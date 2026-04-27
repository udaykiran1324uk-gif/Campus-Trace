const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = admin.firestore();
  
  db.collection('items').get().then(snapshot => {
    console.log(`Total Items in Database: ${snapshot.size}`);
    snapshot.forEach(doc => {
      console.log(`- ${doc.data().title} (${doc.data().type}) by ${doc.data().userName}`);
    });
    process.exit(0);
  }).catch(err => {
    console.error('Error getting documents', err);
    process.exit(1);
  });
} catch (e) {
  console.log('Firebase Admin Error (likely missing credentials)');
  process.exit(1);
}
