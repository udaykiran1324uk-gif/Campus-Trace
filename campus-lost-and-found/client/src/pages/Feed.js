import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Search, MapPin, Calendar, Tag, Filter, X } from 'lucide-react';
import { FeedSkeleton } from '../components/Skeleton';

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

const Feed = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, lost, found
  const [category, setCategory] = useState('all');

  const categories = ["Electronics", "Documents", "Personal Items", "Books", "Accessories", "Other"];

  // Single subscription to items - removed server-side orderBy to avoid indexing issues
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'items'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
      setLoading(false);
    }, (error) => {
      console.error("Feed error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Use useMemo for filtering and manual sorting
  const filteredItems = useMemo(() => {
    const result = items.filter(item => {
      const matchesType = filter === 'all' || item.type === filter;
      const matchesSearch = (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                           (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || item.category === category;
      return matchesType && matchesSearch && matchesCategory;
    });

    // Manual Sort by date (newest first)
    return result.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [items, searchTerm, filter, category]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 min-h-screen transition-colors duration-200">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-xl shadow-blue-500/5 mb-8 border border-gray-100 dark:border-gray-700 transition-all">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="What are you looking for?"
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white dark:bg-gray-600 shadow-md text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('lost')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filter === 'lost' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500'}`}
              >
                Lost
              </button>
              <button 
                onClick={() => setFilter('found')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filter === 'found' ? 'bg-green-500 text-white shadow-md' : 'text-gray-500'}`}
              >
                Found
              </button>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-bold text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <FeedSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className={`absolute top-4 right-4 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {item.type}
                </span>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight line-clamp-1">{item.title}</h3>
                </div>
                
                <div className="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded-md mb-4 border border-blue-100 dark:border-blue-800/50">
                  {item.category}
                </div>

                <p className="text-slate-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 font-medium h-10">
                  {item.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 text-xs font-bold">
                    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-blue-500">
                      <MapPin size={14} />
                    </div>
                    {item.location}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 text-xs font-bold">
                    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-purple-500">
                      <Calendar size={14} />
                    </div>
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recently Posted'}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 text-xs font-bold">
                    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-green-500">
                      <Tag size={14} />
                    </div>
                    By <span className="text-slate-900 dark:text-gray-200">{item.userName}</span>
                  </div>
                </div>

                <Link 
                  to={`/item/${item.id}`}
                  className="mt-6 w-full flex items-center justify-center py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 mt-8 transition-all">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <Search size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No matching items</h2>
          <p className="text-slate-700 dark:text-gray-400 font-bold mb-4">Try adjusting your filters or search keywords.</p>
          <div className="text-xs font-black uppercase text-blue-700 mb-8 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-full inline-block">
            Database Status: {items.length} total items found
          </div>
          <br/>
          <button 
            onClick={() => {setSearchTerm(''); setFilter('all'); setCategory('all');}}
            className="mt-4 text-blue-600 dark:text-blue-400 font-black text-sm uppercase tracking-widest hover:underline border-2 border-blue-600 dark:border-blue-400 px-6 py-2 rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Feed;
