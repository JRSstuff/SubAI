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

export async function POST(request: NextRequest) {
  try {
    let username = "";
    let email = "";
    let password = "";
    let role = "reporter";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      username = (body.username || "").trim();
      email = (body.email || "").trim();
      password = body.password || "";
      role = (body.role || "reporter").trim().toLowerCase();
    } else {
      const formData = await request.formData();
      username = (formData.get("username")?.toString() || "").trim();
      email = (formData.get("email")?.toString() || "").trim();
      password = formData.get("password")?.toString() || "";
      role = (formData.get("role")?.toString() || "reporter").trim().toLowerCase();
    }

    const validRoles = ["reporter", "reviewer", "collector", "recycler", "admin"];
    if (!validRoles.includes(role)) role = "reporter";

    if (!username || username.length < 3) {
      return NextResponse.json(
        { success: false, message: "Name must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("app_users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists. Please sign in.",
        },
        { status: 400 }
      );
    }

    // Fetch site ID
    const { data: defaultSite } = await supabase
      .from("sites")
      .select("id")
      .limit(1)
      .maybeSingle();

    // Insert into app_users
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
      return NextResponse.json(
        {
          success: false,
          message: insertError?.message || "Registration failed.",
        },
        { status: 500 }
      );
    }

    const sessionData = {
      id: newUser.id,
      username: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
    };

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: newUser.id,
        username: newUser.full_name,
        email: newUser.email,
        role: String(newUser.role).toUpperCase(),
      },
    });

    response.cookies.set("tubigloop_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Registration error.",
      },
      { status: 500 }
    );
  }
}
