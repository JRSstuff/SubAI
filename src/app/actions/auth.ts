"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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
 * Server-side login verification.
 */
export async function handleLoginAction(formData: FormData): Promise<AuthResponse> {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username) {
    return {
      success: false,
      message: "Please enter your username or email.",
      error: "Please enter your username or email.",
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Please enter your password.",
      error: "Please enter your password.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters.",
      error: "Password must be at least 6 characters.",
    };
  }

  // Format email
  const email = username.includes("@")
    ? username
    : `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@tubigloop.local`;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        message: "Invalid email or password.",
        error: "Invalid email or password.",
      };
    }

    const user = data.user;
    const role = (user?.user_metadata?.role as string) || "reporter";
    const displayName = (user?.user_metadata?.full_name as string) || username;

    return {
      success: true,
      message: `Welcome back, ${displayName}!`,
      user: {
        id: user?.id,
        username: displayName,
        email: user?.email,
        role: role.toUpperCase(),
      },
    };
  } catch {
    return {
      success: false,
      message: "Unable to connect. Please try again.",
      error: "Unable to connect. Please try again.",
    };
  }
}

/**
 * Server-side registration verification.
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
      error: "Name must be at least 3 characters.",
    };
  }

  if (!email || !email.includes("@") || !email.includes(".")) {
    return {
      success: false,
      message: "Please enter a valid email address.",
      error: "Please enter a valid email address.",
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters.",
      error: "Password must be at least 6 characters.",
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username,
          role: role,
        },
      },
    });

    if (error) {
      return {
        success: false,
        message: "Registration failed. Please check your details and try again.",
        error: "Registration failed. Please check your details and try again.",
      };
    }

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        message: "An account with this email already exists.",
        error: "An account with this email already exists.",
      };
    }

    const user = data.user;
    const isEmailConfirmPending = user && !data.session;

    return {
      success: true,
      message: isEmailConfirmPending
        ? "Account created! Please check your email to confirm."
        : "Account created successfully!",
      user: {
        id: user?.id,
        username,
        email,
        role: role.toUpperCase(),
      },
    };
  } catch {
    return {
      success: false,
      message: "Registration failed. Please try again.",
      error: "Registration failed. Please try again.",
    };
  }
}
