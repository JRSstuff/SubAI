"use server";

import { cookies } from "next/headers";
import { loginWithFirebase, registerWithFirebase } from "@/lib/firebase/auth";

export interface AuthResponse {
  success: boolean;
  message: string;
  error?: string;
  user?: {
    id?: string;
    username: string;
    email?: string;
    role?: string;
  };
}

/**
 * Server-side login verification using Firebase Auth & Firestore.
 */
export async function handleLoginAction(formData: FormData): Promise<AuthResponse> {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username) {
    return {
      success: false,
      message: "Please enter your username or email.",
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Please enter your password.",
    };
  }

  try {
    const user = await loginWithFirebase(username, password);
    const cookieStore = await cookies();

    // Set secure HTTP-only session cookie
    try {
      cookieStore.set(
        "subai_session",
        JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }
      );
      cookieStore.set(
        "tubigloop_session",
        JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }
      );
    } catch (cookieErr) {
      console.warn("Session cookie warning:", cookieErr);
    }

    return {
      success: true,
      message: `Welcome back, ${user.username}!`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: String(user.role).toUpperCase(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Invalid credentials. Please try again.",
    };
  }
}

/**
 * Server-side registration verification using Firebase Auth & Firestore.
 */
export async function handleRegisterAction(formData: FormData): Promise<AuthResponse> {
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const rawRole = formData.get("role")?.toString().trim().toLowerCase() || "reporter";

  const validRoles = ["reporter", "reviewer", "collector", "recycler", "admin"];
  const role = validRoles.includes(rawRole) ? rawRole : "reporter";

  if (!username || username.length < 3) {
    return {
      success: false,
      message: "Name must be at least 3 characters.",
    };
  }

  if (!email || !email.includes("@") || !email.includes(".")) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters.",
    };
  }

  try {
    const newUser = await registerWithFirebase(username, email, password, role);
    const cookieStore = await cookies();

    // Set session cookie
    try {
      cookieStore.set(
        "subai_session",
        JSON.stringify({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
      cookieStore.set(
        "tubigloop_session",
        JSON.stringify({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
    } catch (cookieErr) {
      console.warn("Session cookie warning:", cookieErr);
    }

    return {
      success: true,
      message: "Account created successfully in Firebase!",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: String(newUser.role).toUpperCase(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Registration failed. Please try again.",
    };
  }
}

/**
 * Clear session cookie on logout.
 */
export async function handleLogoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("subai_session");
    cookieStore.delete("tubigloop_session");
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * Retrieve current authenticated session user.
 */
export async function getCurrentUserAction(): Promise<{
  id: string;
  username: string;
  email: string;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie =
      cookieStore.get("subai_session")?.value ||
      cookieStore.get("tubigloop_session")?.value;
    if (!sessionCookie) return null;
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}
