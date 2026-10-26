import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://cvfaethiloimouyxbanb.supabase.co";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_CDDcZdQiIZS8pJPAp1J4yw_L9ABd4k7";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const VALID_ROLES = ["reporter", "reviewer", "collector", "recycler", "admin"];

function verifyAdminSession(request: NextRequest): boolean {
  try {
    let raw = request.cookies.get("tubigloop_session")?.value;
    if (!raw) return false;
    if (raw.includes("%")) {
      try {
        raw = decodeURIComponent(raw);
      } catch {
        // ignore decode error
      }
    }
    const session = JSON.parse(raw);
    return String(session.role || "").toLowerCase() === "admin";
  } catch {
    return false;
  }
}

async function updateUserRole(userId: string, rawRole: string) {
  if (!userId) {
    return { status: 400, res: { success: false, message: "Target userId is required." } };
  }

  const role = rawRole.toLowerCase();
  if (!VALID_ROLES.includes(role)) {
    return {
      status: 400,
      res: { success: false, message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: updatedUser, error } = await supabase
    .from("app_users")
    .update({ role })
    .eq("id", userId)
    .select("id, full_name, email, role")
    .single();

  if (error) {
    return { status: 500, res: { success: false, message: error.message } };
  }

  return {
    status: 200,
    res: {
      success: true,
      message: `Role updated to '${role}' for ${updatedUser.full_name}!`,
      user: updatedUser,
    },
  };
}

// 1. GET: List all users
export async function GET(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: users, error } = await supabase
      .from("app_users")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, users: users || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error fetching users." },
      { status: 500 }
    );
  }
}

// 2. PATCH: Update user role
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = await updateUserRole(body.userId, body.newRole);
    return NextResponse.json(result.res, { status: result.status });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error updating role." },
      { status: 500 }
    );
  }
}

// 3. POST: Create a new user OR update role (fallback)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this POST is a role update
    if (body.action === "update_role" || (body.userId && body.newRole)) {
      const result = await updateUserRole(body.userId, body.newRole);
      return NextResponse.json(result.res, { status: result.status });
    }

    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "tubigloop123";
    const role = (body.role || "reporter").trim().toLowerCase();

    if (!fullName || fullName.length < 3) {
      return NextResponse.json(
        { success: false, message: "Full name must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid email is required." },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role assigned." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already registered
    const { data: existing } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const { data: site } = await supabase.from("sites").select("id").limit(1).maybeSingle();

    const { data: newUser, error: insertError } = await supabase
      .from("app_users")
      .insert({
        full_name: fullName,
        email: email,
        password_hash: hashPassword(password),
        role: role,
        site_id: site?.id || null,
      })
      .select("id, full_name, email, role")
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${newUser.full_name} created as ${newUser.role}!`,
      user: newUser,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error creating user." },
      { status: 500 }
    );
  }
}
