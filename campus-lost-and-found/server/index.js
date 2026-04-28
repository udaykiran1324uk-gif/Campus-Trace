const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Load server/.env first (local dev), then fallback to workspace root .env
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});
const localUploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let firebaseAdminReady = false;
let resolvedProjectId = null;

function getServiceAccountFromEnv() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  try {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON. It must be valid JSON.');
    return null;
  }
}

const serviceAccountFromEnv = getServiceAccountFromEnv();
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT;
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET ||
  (projectId ? `${projectId}.appspot.com` : null);

if (serviceAccountFromEnv) {
  resolvedProjectId = serviceAccountFromEnv.project_id || projectId || null;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountFromEnv),
    projectId: resolvedProjectId || undefined,
    storageBucket: storageBucket || undefined
  });
  firebaseAdminReady = true;
  console.log("Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_JSON");
} else if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  resolvedProjectId = serviceAccount.project_id || projectId || null;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: resolvedProjectId || undefined,
    storageBucket: storageBucket || undefined
  });
  firebaseAdminReady = true;
  console.log("Firebase Admin initialized with Service Account");
} else {
  // Local machines usually need an explicit project id with ADC.
  if (!projectId) {
    console.warn("CRITICAL: Missing Firebase project id. Set FIREBASE_PROJECT_ID and credentials for password resets.");
  } else {
    try {
      resolvedProjectId = projectId;
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: resolvedProjectId,
        storageBucket: storageBucket || undefined
      });
      firebaseAdminReady = true;
      console.log("Firebase Admin initialized with application default credentials");
    } catch (e) {
      console.warn("CRITICAL: Firebase Admin failed to initialize. Password resets will not work.");
    }
  }
}

const allowedOrigins = [
  'https://campus-trace-gx1m.onrender.com',
  'https://campus-trace-frontend.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/server-side calls and explicitly whitelisted browser origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
// Helmet can sometimes block requests in dev environments, disabling temporarily to fix "Unexpected token" issue
// app.use(helmet()); 
app.use(morgan('dev'));
app.use('/uploads', express.static(localUploadDir));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('/api/health', (req, res) => {
  res.send('Campus Lost & Found API is healthy');
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing file in request.' });
  }
  try {
    const ext = path.extname(req.file.originalname || '') || '.bin';
    const safeName = (req.body.fileNameBase || Date.now().toString()).replace(/[^a-zA-Z0-9_-]/g, '');
    const objectPath = `items/${safeName}${ext}`;
    // First choice: Firebase bucket upload
    if (firebaseAdminReady && storageBucket) {
      try {
        const bucket = admin.storage().bucket(storageBucket);
        const file = bucket.file(objectPath);
        const downloadToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype || 'application/octet-stream',
            metadata: {
              firebaseStorageDownloadTokens: downloadToken
            }
          }
        });
        const encodedPath = encodeURIComponent(objectPath);
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media&token=${downloadToken}`;
        console.log("SUCCESS: Image uploaded to Firebase Storage:", imageUrl);
        return res.json({ imageUrl, objectPath, storage: 'firebase' });
      } catch (bucketError) {
        const msg = String(bucketError?.message || '');
        console.error("Firebase Storage Error:", msg);
        if (!msg.includes('specified bucket does not exist')) {
          throw bucketError;
        }
        console.warn('Firebase bucket unavailable. Falling back to local file storage.');
      }
    } else if (!firebaseAdminReady) {
      console.warn('Firebase Admin not configured. Using local file storage fallback.');
    }

    // Fallback: local server storage so posting still works in development.
    const localFileName = `${safeName}${ext}`;
    const localFilePath = path.join(localUploadDir, localFileName);
    fs.writeFileSync(localFilePath, req.file.buffer);
    
    // Ensure HTTPS on production for image links to avoid Mixed Content issues
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/${encodeURIComponent(localFileName)}`;
    
    console.warn("WARNING: Using temporary Local Storage. Image will be deleted on next restart:", imageUrl);
    return res.json({ imageUrl, objectPath: `uploads/${localFileName}`, storage: 'local' });
  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({ error: error.message || 'Upload failed on server.' });
  }
});

// REAL Password Reset Endpoint
app.post('/api/reset-password', async (req, res) => {
  console.log("RECEIVED RESET REQUEST for UID:", req.body.uid);
  const { uid, newPassword } = req.body;
  if (!firebaseAdminReady) {
    return res.status(503).json({
      error: 'Auth server not configured. Set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_JSON (or server/serviceAccountKey.json), then restart.'
    });
  }
  
  if (!uid || !newPassword) {
    return res.status(400).json({ error: 'Missing UID or password' });
  }

  try {
    // This actually updates the password in Firebase Authentication
    await admin.auth().updateUser(uid, {
      password: newPassword
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle any requests that don't match the API routes (Routing fallback)
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
