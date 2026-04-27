import React, { useState } from 'react';
import axios from 'axios';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Tag, Loader2, AlertCircle, X, FileText, CheckCircle2, CloudUpload } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PostItem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    type: 'lost'
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileType, setFileType] = useState('image'); // 'image' or 'document'

  const landmarks = [
    "Main Library", "Central Cafeteria", "Block A", "Block B", "Sports Complex", 
    "Admin Building", "Auditorium", "Science Lab", "Student Union"
  ];

  const categories = [
    "Electronics", "Documents", "Personal Items", "Books", "Accessories", "Other"
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const isDocument = formData.category === 'Documents';
    const maxSize = isDocument ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      setError(`File too large. Max: ${isDocument ? '20MB' : '5MB'}`);
      return;
    }

    if (file.type.startsWith('image/')) {
      setFileType('image');
      setLoading(true);
      setError('Optimizing image for fast upload...');
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (!blob) {
              setError("Failed to process image. Try a different photo.");
              setLoading(false);
              return;
            }
            const compressedFile = new File([blob], file.name || "upload.jpg", { type: 'image/jpeg' });
            setImage(compressedFile);
            setImagePreview(URL.createObjectURL(compressedFile));
            setLoading(false);
            setError('');
            console.log("Image optimized. New size:", (compressedFile.size / 1024).toFixed(2), "KB");
          }, 'image/jpeg', 0.7); 
        };
        img.onerror = () => {
          setError("Invalid image file.");
          setLoading(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      setFileType('document');
      setImage(file);
      setImagePreview(null);
    }
  };

  const removeFile = () => {
    setImage(null);
    setImagePreview(null);
    setFileType('image');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError("Please upload an image or document first.");
    if (!user) return navigate('/login');
    
    setLoading(true);
    setUploadProgress(1); 
    setError('');
    
    console.log("Submit triggered. Image type:", typeof image, "isBlob:", image instanceof Blob);

    try {
      const fileForm = new FormData();
      fileForm.append('file', image);
      fileForm.append('fileNameBase', `${Date.now()}_${user.uid}`);

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/upload`, fileForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress || 1);
        }
      });

      const downloadURL = uploadResponse?.data?.imageUrl;
      if (!downloadURL) {
        throw new Error('Upload succeeded but no file URL was returned.');
      }
      
      await addDoc(collection(db, 'items'), {
        ...formData,
        imageUrl: downloadURL,
        fileType: fileType,
        userId: user.uid,
        userName: user.name || user.username || 'Campus User',
        status: 'active',
        createdAt: serverTimestamp()
      });

      console.log("Database entry saved.");
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);

    } catch (err) {
      console.error("CRITICAL ERROR IN SUBMIT:", err);
      const serverError = err?.response?.data?.error;
      setError(serverError ? `Upload failed: ${serverError}` : `Process failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-12 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl mt-20 text-center border border-green-100 dark:border-green-900/30">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-600 dark:text-green-400" size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Post Published!</h2>
        <p className="text-slate-600 dark:text-gray-400 font-medium">Redirecting home...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-10 transition-colors duration-200 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Tag className="text-blue-600 dark:text-blue-400" /> Report an Item
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Required *</span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-3 border border-red-100 dark:border-red-800/50 font-medium">
          <AlertCircle size={20} /> {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4 p-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-2xl">
          <button
            type="button"
            onClick={() => setFormData({...formData, type: 'lost'})}
            className={`flex-1 py-3 rounded-xl font-black transition-all ${formData.type === 'lost' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            LOST ITEM
          </button>
          <button
            type="button"
            onClick={() => setFormData({...formData, type: 'found'})}
            className={`flex-1 py-3 rounded-xl font-black transition-all ${formData.type === 'found' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
          >
            FOUND ITEM
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase mb-2 ml-1">Item Title *</label>
            <input
              type="text"
              required
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-medium"
              placeholder="e.g. Blue Nike Backpack"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase mb-2 ml-1">Category *</label>
            <select
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-medium"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase mb-2 ml-1 flex items-center gap-1">
              <MapPin size={14} /> Campus Location *
            </label>
            <select
              className="w-full p-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-medium"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              required
            >
              <option value="">Select Landmark</option>
              {landmarks.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase mb-2 ml-1">Detailed Description *</label>
          <textarea
            className="w-full p-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32 text-slate-900 dark:text-white font-medium resize-none"
            placeholder={formData.type === 'found' ? "Tip: Leave out one unique detail to verify ownership later!" : "Color, brand, unique markings, etc."}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase mb-2 ml-1 flex items-center gap-2">
            <Camera size={16} /> Evidence / Photo *
          </label>
          
          <div className="relative group">
            {image ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-xl">
                {fileType === 'image' ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <FileText size={64} className="text-blue-500 mb-4" />
                    <p className="font-bold text-slate-700 dark:text-gray-200">{image.name}</p>
                    <p className="text-xs text-slate-500">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all hover:scale-110"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-2xl cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400 font-black uppercase tracking-tight">Tap to upload proof</p>
                  <p className="text-xs text-gray-400 font-medium">Images up to 5MB, Docs up to 20MB</p>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4.5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-blue-500/30 disabled:opacity-50 active:scale-[0.98] uppercase tracking-tighter"
        >
          {loading ? (
            <>
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" />
                <span>{uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Finalizing...'}</span>
              </div>
              <div className="w-full max-w-[200px] h-1.5 bg-blue-400/30 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <CloudUpload size={20} />
              <span>Share with Campus</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default PostItem;
