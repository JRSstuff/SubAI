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
 * Server-side login verification connected to Supabase Auth.
 * Adheres strictly to Rule 1 (Server-Verified Truth):
 * Returns explicit 200 OK message on genuine server verification,
 * and exact error details on validation or credential failure.
 */
export async function handleLoginAction(formData: FormData): Promise<AuthResponse> {
  const username = formData.get("username")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!username) {
    return {
      success: false,
      message: "Server Error: Missing username/email",
      error: "Username or email is required by server specification.",
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Server Error: Missing password",
      error: "Password field cannot be empty.",
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      message: "Server Error: Invalid credentials",
      error: "Password must be at least 6 characters long.",
    };
  }

  // Format email (if username doesn't contain '@', format as local campus pilot alias)
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
        message: "Server 401 Unauthorized",
        error: error.message,
      };
    }

    const user = data.user;
    const role = (user?.user_metadata?.role as string) || "reporter";
    const displayName = (user?.user_metadata?.full_name as string) || username;

    return {
      success: true,
      message: "Server 200 OK: User session authenticated and verified with Supabase.",
      user: {
        id: user?.id,
        username: displayName,
        email: user?.email,
        role: role.toUpperCase(),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: "Server Connection Failure",
      error: err instanceof Error ? err.message : "Failed to establish secure session with Supabase server.",
    };
  }
}

/**
 * Server-side registration verification connected to Supabase Auth.
 */
export async function handleRegisterAction(formData: FormData): Promise<AuthResponse> {
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const rawRole = formData.get("role")?.toString().trim().toLowerCase() || "reporter";

  // Sanitize role to valid schema enums
  const validRoles = ["reporter", "reviewer", "collector", "recycler", "admin"];
  const role = validRoles.includes(rawRole) ? rawRole : "reporter";

  if (!username || username.length < 3) {
    return {
      success: false,
      message: "Server Error: Invalid name",
      error: "Full name must be at least 3 characters in length.",
    };
  }

  if (!email || !email.includes("@") || !email.includes(".")) {
    return {
      success: false,
      message: "Server Error: Invalid email format",
      error: "Please enter a valid official email address.",
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      message: "Server Error: Weak password",
      error: "Password must be at least 6 characters long.",
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
        message: "Server Registration Error",
        error: error.message,
      };
    }

    // In Supabase Auth, existing users return with empty identities without a hard error
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        message: "Server Registration Conflict",
        error: "An account with this email address already exists. Please sign in instead.",
      };
    }

    const user = data.user;
    const isEmailConfirmPending = user && !data.session;

    return {
      success: true,
      message: isEmailConfirmPending
        ? `Server 201 Created: Account created for ${username} (${role.toUpperCase()})! If email confirmation is enabled on your Supabase project, check your inbox to confirm.`
        : `Server 201 Created: Account successfully provisioned for ${username} (${role.toUpperCase()}).`,
      user: {
        id: user?.id,
        username,
        email,
        role: role.toUpperCase(),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: "Server Provisioning Failure",
      error: err instanceof Error ? err.message : "Failed to register user on Supabase auth service.",
    };
  }
}
