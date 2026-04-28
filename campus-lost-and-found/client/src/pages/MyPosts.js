import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Check, X, User, Mail, MessageSquare, MapPin, Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop';

const resolveImageUrl = (rawUrl) => {
  if (!rawUrl) return FALLBACK_IMAGE;
  const isClientLocal =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  try {
    const parsed = new URL(rawUrl);
    const isLocalImageHost = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (!isClientLocal && isLocalImageHost && parsed.pathname.startsWith('/uploads/')) {
      return `${API_BASE_URL}${parsed.pathname}`;
    }
    return rawUrl;
  } catch {
    if (rawUrl.startsWith('/uploads/')) {
      return `${API_BASE_URL}${rawUrl}`;
    }
    return rawUrl;
  }
};

const MyPosts = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState({}); // Keyed by itemId
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch User's Items
    const q = query(collection(db, 'items'), where('userId', '==', user.uid));
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
      setLoading(false);
    });

    // Fetch all claims for these items
    const claimsQuery = query(collection(db, 'claims'), where('ownerId', '==', user.uid));
    const unsubscribeClaims = onSnapshot(claimsQuery, (snapshot) => {
      const claimsData = {};
      snapshot.docs.forEach(doc => {
        const claim = { id: doc.id, ...doc.data() };
        if (!claimsData[claim.itemId]) claimsData[claim.itemId] = [];
        claimsData[claim.itemId].push(claim);
      });
      setClaims(claimsData);
    });

    return () => {
      unsubscribeItems();
      unsubscribeClaims();
    };
  }, [user]);

  const handleApprove = async (itemId, claimId) => {
    const confirm = window.confirm("Approving this claim will mark the item as resolved. Continue?");
    if (!confirm) return;

    try {
      const batch = writeBatch(db);

      // 1. Update item status
      const itemRef = doc(db, 'items', itemId);
      batch.update(itemRef, { status: 'claimed' });

      // 2. Update approved claim
      const claimRef = doc(db, 'claims', claimId);
      batch.update(claimRef, { status: 'approved' });

      // 3. Reject other claims for the same item
      const otherClaimsQuery = query(collection(db, 'claims'), where('itemId', '==', itemId), where('status', '==', 'pending'));
      const otherClaimsSnap = await getDocs(otherClaimsQuery);
      otherClaimsSnap.forEach(doc => {
        if (doc.id !== claimId) {
          batch.update(doc.ref, { status: 'rejected' });
        }
      });

      await batch.commit();
      alert("Claim approved! The item is now marked as claimed.");
    } catch (err) {
      console.error(err);
      alert("Error approving claim.");
    }
  };

  const handleReject = async (claimId) => {
    try {
      await updateDoc(doc(db, 'claims', claimId), { status: 'rejected' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (item) => {
    if (!user || item.userId !== user.uid) {
      alert("You can delete only your own posts.");
      return;
    }
    const confirmed = window.confirm("Delete this post permanently? This will also remove all related claims.");
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);
      const relatedClaimsQuery = query(collection(db, 'claims'), where('itemId', '==', item.id));
      const relatedClaimsSnap = await getDocs(relatedClaimsQuery);
      relatedClaimsSnap.forEach((claimDoc) => batch.delete(claimDoc.ref));
      batch.delete(doc(db, 'items', item.id));
      await batch.commit();
      alert("Post deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete post.");
    }
  };

  if (loading) return <div className="p-8">Loading your posts...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Posts & Claims</h1>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">You haven't posted any items yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="flex flex-col md:flex-row">
                {/* Item Summary */}
                <div className="md:w-1/3 flex p-4 border-r border-gray-100 bg-gray-50">
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-24 h-24 rounded-lg object-cover shadow-sm"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin size={12} /> {item.location}
                    </div>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                      {item.status}
                    </span>
                    {item.userId === user?.uid && (
                      <button
                        onClick={() => handleDeletePost(item)}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                        title="Delete this post"
                      >
                        <Trash2 size={13} /> Delete Post
                      </button>
                    )}
                  </div>
                </div>

                {/* Claims Section */}
                <div className="flex-1 p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" /> 
                    Claim Requests ({claims[item.id]?.length || 0})
                  </h4>
                  
                  <div className="space-y-3">
                    {claims[item.id]?.length > 0 ? (
                      claims[item.id].map(claim => (
                        <div key={claim.id} className={`p-3 rounded-lg border ${claim.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User size={14} className="text-gray-400" />
                                <span className="text-sm font-semibold">{claim.claimerName}</span>
                                {claim.status === 'approved' && (
                                  <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Approved</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 italic">"{claim.reason}"</p>
                              
                              {claim.status === 'approved' && (
                                <div className="mt-2 pt-2 border-t border-green-200 flex items-center gap-3 text-xs text-green-800 font-medium">
                                  <Mail size={14} /> Contact: {claim.claimerEmail}
                                </div>
                              )}
                            </div>

                            {item.status === 'active' && claim.status === 'pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleApprove(item.id, claim.id)}
                                  className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => handleReject(claim.id)}
                                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No claim requests yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPosts;
