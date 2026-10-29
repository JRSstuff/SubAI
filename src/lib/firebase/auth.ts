import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { auth, db } from "./config";

export interface TubigLoopUser {
  id: string;
  username: string;
  email: string;
  role: "reporter" | "reviewer" | "collector" | "recycler" | "admin";
}

/**
 * Register a new user with Email and Password in Firebase Auth,
 * and persist their role profile in Firestore `users/{uid}`.
 */
export async function registerWithFirebase(
  fullName: string,
  email: string,
  password: string,
  role: string = "reporter"
) {
  const cleanEmail = email.trim().toLowerCase();
  const validRole = ["reporter", "reviewer", "collector", "recycler", "admin"].includes(
    role.toLowerCase()
  )
    ? (role.toLowerCase() as TubigLoopUser["role"])
    : "reporter";

  // 1. Create user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // 2. Set Firebase Auth display name
  await updateProfile(user, { displayName: fullName });

  // 3. Store role and profile in Firestore
  const userProfile: TubigLoopUser = {
    id: user.uid,
    username: fullName,
    email: cleanEmail,
    role: validRole,
  };

  await setDoc(doc(db, "users", user.uid), {
    ...userProfile,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return userProfile;
}

/**
 * Sign in existing user with Email or Username and Password in Firebase Auth.
 */
export async function loginWithFirebase(
  identifier: string,
  password: string
): Promise<TubigLoopUser> {
  const cleanId = identifier.trim();
  let targetEmail = cleanId.toLowerCase();

  // If user entered a username instead of email, resolve email from Firestore
  if (!cleanId.includes("@")) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", cleanId), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error("No account found with this username. Please check your credentials.");
    }
    targetEmail = snap.docs[0].data().email;
  }

  // Sign in using Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
  const user = userCredential.user;

  // Retrieve user profile and role from Firestore
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      id: user.uid,
      username: data.username || data.full_name || user.displayName || "User",
      email: user.email || targetEmail,
      role: (data.role || "reporter").toLowerCase() as TubigLoopUser["role"],
    };
  }

  // Fallback if Firestore document was not yet created
  const fallbackUser: TubigLoopUser = {
    id: user.uid,
    username: user.displayName || cleanId,
    email: user.email || targetEmail,
    role: "reporter",
  };

  await setDoc(userDocRef, {
    ...fallbackUser,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return fallbackUser;
}

/**
 * Sign out current user from Firebase Auth.
 */
export async function logoutFirebase() {
  await signOut(auth);
}

/**
 * Listen to Firebase Auth state changes.
 */
export function onFirebaseAuthStateChanged(
  callback: (user: FirebaseUser | null, profile: TubigLoopUser | null) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        callback(user, {
          id: user.uid,
          username: data.username || data.full_name || user.displayName || "User",
          email: user.email || "",
          role: (data.role || "reporter").toLowerCase() as TubigLoopUser["role"],
        });
      } else {
        callback(user, {
          id: user.uid,
          username: user.displayName || "User",
          email: user.email || "",
          role: "reporter",
        });
      }
    } catch {
      callback(user, {
        id: user.uid,
        username: user.displayName || "User",
        email: user.email || "",
        role: "reporter",
      });
    }
  });
}
