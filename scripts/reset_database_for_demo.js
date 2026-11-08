const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

const collectionsToReset = ['reports', 'cleanup_tasks', 'collection_batches', 'handovers'];

async function resetDatabase() {
  console.log('--- Starting Complete Database Reset for DEMO ---');
  let totalDeleted = 0;

  for (const colName of collectionsToReset) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    console.log(`Clearing collection "${colName}" (${snap.size} documents)...`);
    
    for (const d of snap.docs) {
      await deleteDoc(doc(db, colName, d.id));
      totalDeleted++;
      console.log(`  Deleted [${colName}]: ${d.id}`);
    }
  }

  // Verify users collection is preserved
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Preserved "users" collection: ${usersSnap.size} user accounts intact for login.`);

  console.log(`\nSUCCESS: Database successfully reset! ${totalDeleted} documents removed.`);
  console.log('The database is now 100% clean and ready for your live DEMO.');
}

resetDatabase().catch(console.error);
