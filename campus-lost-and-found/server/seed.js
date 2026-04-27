const admin = require('firebase-admin');
const fs = require('fs');

// Note: This script assumes you have credentials set up 
// or it will try to use application default credentials
try {
  admin.initializeApp({
    projectId: 'campus-lost-found-c8f1d',
    storageBucket: 'campus-lost-found-c8f1d.firebasestorage.app'
  });
} catch (e) {}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function createPost() {
  try {
    const imagePath = 'c:\\Users\\udayk\\web projects\\photo.JPG';
    const destination = 'items/sample_id_' + Date.now() + '.jpg';

    console.log('Uploading sample image from:', imagePath);
    
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found at path');
    }

    await bucket.upload(imagePath, {
      destination: destination,
      metadata: { contentType: 'image/jpeg' }
    });

    // Make the file publicly readable for the feed
    await bucket.file(destination).makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    console.log('Creating Firestore entry...');
    await db.collection('items').add({
      title: 'Found Student ID Photo',
      description: 'Found this ID photo near the Main Library. Please claim if this is yours.',
      location: 'Main Library',
      category: 'Documents',
      type: 'found',
      imageUrl: publicUrl,
      userId: 'admin_seed',
      userName: 'Admin System',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('SUCCESS: Sample post created!');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

createPost();
