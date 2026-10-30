const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const env = fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8');
env.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collectionsToClean = ['reports', 'cleanup_tasks', 'collection_batches', 'handovers'];

async function cleanup() {
  console.log('Cleaning up all presentation demo data from Firestore...');
  let totalDeleted = 0;

  for (const colName of collectionsToClean) {
    const snap = await getDocs(collection(db, colName));
    for (const d of snap.docs) {
      const data = d.data();
      if (data.is_demo === true || data.dataset_origin === 'presentation_demo' || d.id.startsWith('demo-')) {
        await deleteDoc(doc(db, colName, d.id));
        console.log(`Deleted from ${colName}: ${d.id}`);
        totalDeleted++;
      }
    }
  }

  console.log(`\nCleanup finished! Removed ${totalDeleted} demo documents.`);
  process.exit(0);
}

cleanup().catch((err) => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
