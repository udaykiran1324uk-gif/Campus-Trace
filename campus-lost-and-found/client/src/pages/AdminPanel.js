import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Trash2, Users, Package, CheckCircle, BarChart3, ShieldAlert } from 'lucide-react';

const AdminPanel = () => {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubItems();
      unsubUsers();
    };
  }, []);

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        const batch = writeBatch(db);
        const relatedClaimsQuery = query(collection(db, 'claims'), where('itemId', '==', itemId));
        const relatedClaimsSnap = await getDocs(relatedClaimsQuery);
        relatedClaimsSnap.forEach((claimDoc) => batch.delete(claimDoc.ref));
        batch.delete(doc(db, 'items', itemId));
        await batch.commit();
        alert("Post deleted successfully.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAllPosts = async () => {
    const confirmed = window.confirm("Delete ALL posts in the website? This will also remove all related claims and cannot be undone.");
    if (!confirmed) return;

    try {
      let deletedItems = 0;
      while (true) {
        const itemsSnap = await getDocs(query(collection(db, 'items')));
        if (itemsSnap.empty) break;
        const batch = writeBatch(db);
        itemsSnap.docs.forEach((itemDoc) => {
          batch.delete(itemDoc.ref);
          deletedItems += 1;
        });
        await batch.commit();
        if (itemsSnap.size < 500) break;
      }

      let deletedClaims = 0;
      while (true) {
        const claimsSnap = await getDocs(query(collection(db, 'claims')));
        if (claimsSnap.empty) break;
        const batch = writeBatch(db);
        claimsSnap.docs.forEach((claimDoc) => {
          batch.delete(claimDoc.ref);
          deletedClaims += 1;
        });
        await batch.commit();
        if (claimsSnap.size < 500) break;
      }

      alert(`All posts deleted. Removed ${deletedItems} posts and ${deletedClaims} claims.`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete all posts.");
    }
  };

  const stats = {
    totalItems: items.length,
    resolvedItems: items.filter(i => i.status === 'claimed').length,
    activeLost: items.filter(i => i.type === 'lost' && i.status === 'active').length,
    activeFound: items.filter(i => i.type === 'found' && i.status === 'active').length,
    totalUsers: users.length
  };

  if (loading) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="text-orange-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-800">Admin Command Center</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'stats' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <BarChart3 size={18} /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('items')}
          className={`px-6 py-3 font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'items' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Package size={18} /> Manage Items
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-medium transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={18} /> User Directory
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Posts" value={stats.totalItems} icon={<Package className="text-blue-500" />} color="bg-blue-50" />
          <StatCard title="Items Resolved" value={stats.resolvedItems} icon={<CheckCircle className="text-green-500" />} color="bg-green-50" />
          <StatCard title="Active Lost" value={stats.activeLost} icon={<BarChart3 className="text-red-500" />} color="bg-red-50" />
          <StatCard title="Total Students" value={stats.totalUsers} icon={<Users className="text-purple-500" />} color="bg-purple-50" />
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="flex justify-end p-4 border-b border-gray-100">
            <button
              onClick={handleDeleteAllPosts}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
            >
              <Trash2 size={16} /> Delete All Posts
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Posted By</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                      <div>
                        <div className="font-bold text-gray-800">{item.title}</div>
                        <div className="text-xs text-gray-500 capitalize">{item.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.userName}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition p-2"
                      title="Delete Post"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-2xl ${color} flex items-center justify-between shadow-sm`}>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className="p-3 bg-white rounded-xl shadow-inner">
      {icon}
    </div>
  </div>
);

export default AdminPanel;
