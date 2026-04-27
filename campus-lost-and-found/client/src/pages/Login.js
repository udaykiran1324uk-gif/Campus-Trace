import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let emailToUse = identifier;

      // Check if the identifier is an email
      const isEmail = identifier.includes('@');
      
      if (!isEmail) {
        // Try to find user by username
        const q = query(collection(db, 'users'), where('username', '==', identifier.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error("Username not found");
        }
        
        emailToUse = querySnapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
      navigate('/');
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message === "Username not found" ? "Username not found" : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black mb-3 text-blue-700 dark:text-blue-400 tracking-tighter uppercase">Welcome Back</h2>
          <p className="text-slate-700 dark:text-gray-400 font-bold text-sm tracking-tight">Login with your Email or Username</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs mb-8 flex items-center gap-3 border border-red-200 dark:border-red-800/50 font-black uppercase tracking-widest">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative group">
            <label className="block text-[10px] font-black text-slate-600 dark:text-gray-500 uppercase mb-2 ml-1 tracking-[0.2em]">Identifier</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-bold transition-all"
                required
              />
            </div>
          </div>

          <div className="relative group">
            <label className="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-2 ml-1 tracking-[0.2em]">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-bold transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Link to="/forgot-password" size="sm" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-black uppercase tracking-widest">
              Forgot Security Key?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-[0.2em] hover:bg-blue-700 transition duration-200 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <><Loader2 className="animate-spin" size={20} /> Authenticating...</> : 'Launch Portal'}
          </button>
        </form>

        <p className="mt-12 text-center text-slate-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">
          No access account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">Request Joining</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
