import React, { useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { validatePassword } from '../utils/validation';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Handle Phone Submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Phone number not found. Please check and try again.");
      }

      const data = querySnapshot.docs[0].data();
      setUserData({ id: querySnapshot.docs[0].id, ...data });
      
      // Generate random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtp(generatedOtp);
      
      console.log("Simulated OTP:", generatedOtp);
      alert(`Verification code sent to your phone! (Debug: ${generatedOtp})`);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (otp === sentOtp) {
      setStep(3);
      setError('');
    } else {
      setError("Invalid OTP code. Please try again.");
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) return setError(passwordError);

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      // Direct Backend Password Update
      const response = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          uid: userData.id, 
          newPassword: newPassword 
        })
      });

      // Handle common HTML-instead-of-JSON error
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Server returned non-JSON:", text.substring(0, 100));
        throw new Error("Server communication error. Please ensure the backend is running correctly on port 5000.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Backend reset failed");
      }
      
      alert("Password updated successfully! You can now log in with your new password.");
      navigate('/login');
    } catch (err) {
      console.error("Reset Error:", err);
      setError("Failed to update password: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700">
        <h2 className="text-3xl font-bold mb-2 text-center text-blue-600 dark:text-blue-400">Reset Password</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8 text-sm">
          {step === 1 && "Enter your registered phone number"}
          {step === 2 && "Enter the 6-digit code sent to your phone"}
          {step === 3 && "Create a strong new password"}
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-100 dark:border-red-800/50">
            {error}
          </div>
        )}

        {/* Step 1: Phone Input */}
        {step === 1 && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Get OTP"}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-center text-2xl tracking-[1em] py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white font-mono"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Verify OTP
            </button>
            <button 
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
              className="w-full text-sm text-gray-500 hover:text-blue-600 transition font-bold"
            >
              Back to Phone Number
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-blue-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Update Password</>}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
