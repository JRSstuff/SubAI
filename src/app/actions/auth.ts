"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";

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
 * Hash password with PBKDF2 and a random cryptographic salt.
 * No external dependencies needed.
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash string.
 */
function verifyPassword(password: string, combined: string): boolean {
  try {
    const [salt, storedHash] = combined.split(":");
    if (!salt || !storedHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === storedHash;
  } catch {
    return false;
  }
}

/**
 * Server-side login verification.
 * Direct, fast authentication without email verification barriers.
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const search = username.toLowerCase();

    // Query app_users by email or username/full_name
    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, full_name, email, password_hash, role")
      .or(`email.eq.${search},full_name.ilike.${username}`)
      .maybeSingle();

    if (error || !user || !user.password_hash) {
      return {
        success: false,
        message: "Invalid email/username or password.",
      };
    }

    if (!verifyPassword(password, user.password_hash)) {
      return {
        success: false,
        message: "Invalid email/username or password.",
      };
    }

    // Safely set secure HTTP-only session cookie
    try {
      cookieStore.set(
        "tubigloop_session",
        JSON.stringify({
          id: user.id,
          username: user.full_name,
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
      message: `Welcome back, ${user.full_name}!`,
      user: {
        id: user.id,
        username: user.full_name,
        email: user.email,
        role: String(user.role).toUpperCase(),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unable to sign in. Please try again.",
    };
  }
}

/**
 * Server-side registration verification.
 * Direct database registration without third-party email rate limits.
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
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Check if an account already exists with this email
    const { data: existingUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return {
        success: false,
        message: "An account with this email already exists. Please sign in.",
      };
    }

    // 2. Fetch default pilot site
    const { data: defaultSite } = await supabase
      .from("sites")
      .select("id")
      .limit(1)
      .maybeSingle();

    // 3. Insert directly into app_users table
    const { data: newUser, error: insertError } = await supabase
      .from("app_users")
      .insert({
        full_name: username,
        email: email.toLowerCase(),
        password_hash: hashPassword(password),
        role: role,
        site_id: defaultSite?.id || null,
      })
      .select("id, full_name, email, role")
      .single();

    if (insertError || !newUser) {
      return {
        success: false,
        message: insertError?.message || "Registration failed. Please check your database tables.",
      };
    }

    // 4. Safely set session cookie immediately
    try {
      cookieStore.set(
        "tubigloop_session",
        JSON.stringify({
          id: newUser.id,
          username: newUser.full_name,
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
      message: "Account created successfully!",
      user: {
        id: newUser.id,
        username: newUser.full_name,
        email: newUser.email,
        role: String(newUser.role).toUpperCase(),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Registration failed. Please try again.",
    };
  }
}
