import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import { LogOut, PlusSquare, Search, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-200">
      <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
        <Search className="text-blue-600" />
        <span>Campus L&F</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium">Home</Link>
        <Link to="/my-posts" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 font-medium">My Posts</Link>
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Link to="/post" className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <PlusSquare size={18} />
          <span>Post Item</span>
        </Link>
        
        {user.role === 'admin' && (
          <Link to="/admin" className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
            <ShieldCheck size={18} /> Admin
          </Link>
        )}

        <div className="flex items-center gap-4 border-l dark:border-gray-700 pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500 transition"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
