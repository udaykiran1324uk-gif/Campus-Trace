import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapPin, Calendar, User, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { DetailSkeleton } from '../components/Skeleton';

const ItemDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimReason, setClaimReason] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null); // null, 'pending', 'exists', 'approved'
  const [ownerContact, setOwnerContact] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      const docRef = doc(db, 'items', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const itemData = { id: docSnap.id, ...docSnap.data() };
        setItem(itemData);
        
        // Check if user already has a claim
        if (user) {
          const q = query(
            collection(db, 'claims'), 
            where('itemId', '==', id), 
            where('claimerId', '==', user.uid)
          );
          const claimSnap = await getDocs(q);
          if (!claimSnap.empty) {
            const claim = claimSnap.docs[0].data();
            setClaimStatus(claim.status);
            
            // If approved, fetch owner contact info
            if (claim.status === 'approved') {
              const ownerRef = doc(db, 'users', itemData.userId);
              const ownerSnap = await getDoc(ownerRef);
              if (ownerSnap.exists()) {
                setOwnerContact(ownerSnap.data());
              }
            }
          }
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    };

    fetchItem();
  }, [id, user, navigate]);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (user.uid === item.userId) return alert("You cannot claim your own item.");

    setClaiming(true);
    try {
      await addDoc(collection(db, 'claims'), {
        itemId: item.id,
        itemTitle: item.title,
        ownerId: item.userId,
        claimerId: user.uid,
        claimerName: user.name,
        claimerEmail: user.email,
        reason: claimReason,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setClaimStatus('pending');
    } catch (err) {
      console.error(err);
      alert("Failed to submit claim.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  const isOwner = user?.uid === item.userId;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="md:w-1/2 h-64 md:h-auto relative">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          <span className={`absolute top-4 left-4 px-4 py-1 rounded-full text-sm font-bold uppercase shadow-lg ${item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {item.type}
          </span>
        </div>

        {/* Info Section */}
        <div className="md:w-1/2 p-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-800">{item.title}</h1>
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold">
              {item.category}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="text-blue-500" size={20} />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="text-blue-500" size={20} />
              <span>{item.createdAt?.toDate().toLocaleDateString() || 'Recently'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <User className="text-blue-500" size={20} />
              <span>Posted by {item.userName}</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-2 border-b pb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>

          {item.status === 'claimed' ? (
            <div className="bg-gray-100 p-4 rounded-xl flex items-center gap-3 text-gray-700 font-bold border-2 border-dashed border-gray-300">
              <CheckCircle className="text-green-500" /> This item has been successfully claimed.
            </div>
          ) : isOwner ? (
            <div className="bg-blue-50 p-6 rounded-2xl flex items-center gap-4 text-blue-800 border-2 border-dashed border-blue-200">
              <AlertCircle className="text-blue-600" />
              <div>
                <h4 className="font-black uppercase tracking-tighter">Your Post</h4>
                <p className="text-sm font-bold opacity-70">Manage responses for this item in your dashboard.</p>
              </div>
            </div>
          ) : claimStatus === 'approved' ? (
            <div className="space-y-4">
              <div className="bg-green-100 p-6 rounded-2xl border-2 border-green-500 shadow-lg animate-pulse">
                <div className="flex items-center gap-3 text-green-800 font-black uppercase tracking-tighter mb-4">
                  <CheckCircle size={24} /> Claim Approved!
                </div>
                <p className="text-green-900 font-bold text-sm mb-6">
                  The owner has verified your claim. You can now contact them to arrange the handover.
                </p>
                <div className="bg-white/50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 text-slate-800 font-bold">
                    <User size={18} className="text-blue-600" /> {ownerContact?.name}
                  </div>
                  <div className="flex items-center gap-3 text-slate-800 font-bold">
                    <MessageCircle size={18} className="text-blue-600" /> {ownerContact?.email}
                  </div>
                  <div className="flex items-center gap-3 text-slate-800 font-bold">
                    <MapPin size={18} className="text-blue-600" /> Dept: {ownerContact?.department}
                  </div>
                </div>
              </div>
            </div>
          ) : claimStatus === 'exists' || claimStatus === 'pending' ? (
            <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center gap-4 text-blue-800 border-2 border-dashed border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-blue-600" />
              </div>
              <div className="text-center">
                <h4 className="font-black uppercase tracking-tighter text-lg">Request Pending</h4>
                <p className="text-sm font-bold opacity-70">The owner is currently reviewing your claim request. Please check back later.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="space-y-4">
              <h3 className="font-bold text-gray-800">Request to Claim</h3>
              <textarea
                placeholder="Describe why this is yours (e.g., color of the case, specific marks, serial number hints)..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm"
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={claiming}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} /> {claiming ? 'Submitting...' : 'Submit Claim Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
