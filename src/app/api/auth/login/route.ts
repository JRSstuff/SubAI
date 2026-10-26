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

export async function POST(request: NextRequest) {
  try {
    let username = "";
    let password = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      username = (body.username || "").trim();
      password = body.password || "";
    } else {
      const formData = await request.formData();
      username = (formData.get("username")?.toString() || "").trim();
      password = formData.get("password")?.toString() || "";
    }

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Please enter your username or email." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Please enter your password." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const search = username.toLowerCase();

    // Query app_users by email or username
    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, full_name, email, password_hash, role")
      .or(`email.eq.${search},full_name.ilike.${username}`)
      .maybeSingle();

    if (error || !user || !user.password_hash) {
      return NextResponse.json(
        { success: false, message: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { success: false, message: "Invalid email/username or password." },
        { status: 401 }
      );
    }

    const sessionData = {
      id: user.id,
      username: user.full_name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      user: {
        id: user.id,
        username: user.full_name,
        email: user.email,
        role: String(user.role).toUpperCase(),
      },
    });

    response.cookies.set("tubigloop_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: false, // allow http over LAN/hotspot
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Authentication error.",
      },
      { status: 500 }
    );
  }
}
