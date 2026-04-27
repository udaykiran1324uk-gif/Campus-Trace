import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Phone, Mail, User, Lock, Building, IdCard, AlertTriangle, CheckCircle2, AtSign } from 'lucide-react';
import { validatePassword, validatePhone } from '../utils/validation';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', name: '', username: '', department: '', studentId: '', phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors([]);

    // Basic validation
    if (!formData.username) return setErrors(["Username is required"]);
    
    const passwordError = validatePassword(formData.password, {
      name: formData.name, phone: formData.phone, studentId: formData.studentId
    });
    
    const phoneError = validatePhone(formData.phone);
    
    let allErrors = [];
    if (passwordError) allErrors.push(passwordError);
    if (phoneError) allErrors.push(phoneError);
    if (formData.password !== formData.confirmPassword) allErrors.push("Passwords do not match");

    if (allErrors.length > 0) {
      setErrors(allErrors);
      // Scroll to top to see errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken
      const usernameQuery = query(collection(db, 'users'), where('username', '==', formData.username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        setErrors(["Username is already taken. Please choose another one."]);
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        username: formData.username.toLowerCase(),
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        studentId: formData.studentId,
        role: formData.email === 'admin@campus.edu' ? 'admin' : 'student',
        isVerified: formData.email.endsWith('.edu'),
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 py-12 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-xl border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-600 dark:text-blue-400">Join Portal</h2>
        <p className="text-slate-500 dark:text-gray-400 text-center mb-8 text-sm">Create your professional campus account</p>
        
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6">
            <h4 className="text-red-700 dark:text-red-400 text-sm font-bold flex items-center gap-2 mb-2">
              <AlertTriangle size={16} /> Please fix the following:
            </h4>
            <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-1">
              {errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <form onSubmit={handleSignup} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="name" type="text" placeholder="John Doe" onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="username" type="text" placeholder="johndoe123" onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="email" type="email" placeholder="student@campus.edu" onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="phone" type="tel" placeholder="10-15 digits" onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Department</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="department" type="text" placeholder="Computer Science" onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Student ID</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="studentId" type="text" placeholder="ID Number" onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={handleChange} required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-blue-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase mb-1 ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" onChange={handleChange} required
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-blue-500">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="md:col-span-2 w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <CheckCircle2 className="animate-bounce" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600 dark:text-gray-400 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
