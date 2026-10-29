import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqF8Uamk63M_WO7quXkR2nYCwHTxUlT8w",
  authDomain: "flowloop-f621b.firebaseapp.com",
  projectId: "flowloop-f621b",
  storageBucket: "flowloop-f621b.firebasestorage.app",
  messagingSenderId: "690926932551",
  appId: "1:690926932551:web:b9bc8ff94bb7900e185762",
  measurementId: "G-46QCB4E3VF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_ACCOUNTS = [
  { fullName: "CDO Reporter", email: "reporter@tubigloop.edu", role: "reporter", password: "tubigloop123" },
  { fullName: "CDO Reviewer", email: "reviewer@tubigloop.edu", role: "reviewer", password: "tubigloop123" },
  { fullName: "CDO Collector", email: "collector@tubigloop.edu", role: "collector", password: "tubigloop123" },
  { fullName: "CDO Recycler", email: "recycler@tubigloop.edu", role: "recycler", password: "tubigloop123" },
  { fullName: "Campus Administrator", email: "admin@tubigloop.edu", role: "admin", password: "tubigloop123" },
];

async function seed() {
  console.log("Seeding Firebase demo accounts for flowloop-f621b...");
  for (const acc of DEMO_ACCOUNTS) {
    try {
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(auth, acc.email, acc.password);
        uid = cred.user.uid;
        await updateProfile(cred.user, { displayName: acc.fullName });
        console.log(`Created Firebase Auth user: ${acc.email} (${uid})`);
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          const cred = await signInWithEmailAndPassword(auth, acc.email, acc.password);
          uid = cred.user.uid;
          console.log(`User already exists, logged in: ${acc.email} (${uid})`);
        } else {
          throw err;
        }
      }

      await setDoc(doc(db, "users", uid), {
        id: uid,
        username: acc.fullName,
        full_name: acc.fullName,
        email: acc.email,
        role: acc.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { merge: true });
      console.log(`Synced Firestore profile: /users/${uid} [role: ${acc.role}]`);
    } catch (err) {
      console.error(`Failed for ${acc.email}:`, err.code, err.message);
    }
  }
}

seed();
