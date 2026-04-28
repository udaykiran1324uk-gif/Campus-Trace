export const API_BASE_URL = (() => {
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalHost) {
      return 'http://localhost:5000';
    }
  }
  // Hardcoded fallback for your specific Render deployment
  return configuredUrl || 'https://campus-trace-gx1m.onrender.com';
})();

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop';

export const resolveImageUrl = (rawUrl) => {
  if (!rawUrl) return FALLBACK_IMAGE;

  // Handle Firebase Storage URLs directly
  if (rawUrl.includes('firebasestorage.googleapis.com')) {
    return rawUrl;
  }

  const isClientLocal =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  try {
    const parsed = new URL(rawUrl);
    const isLocalImageHost = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    
    // If it's a localhost link but we are on production, swap the domain
    if (!isClientLocal && isLocalImageHost && parsed.pathname.startsWith('/uploads/')) {
      return `${API_BASE_URL}${parsed.pathname}`;
    }
    return rawUrl;
  } catch {
    // If it's a relative path starting with /uploads/
    if (rawUrl.startsWith('/uploads/')) {
      return `${API_BASE_URL}${rawUrl}`;
    }
    return rawUrl;
  }
};
