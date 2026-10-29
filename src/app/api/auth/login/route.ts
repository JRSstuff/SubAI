import { NextRequest, NextResponse } from "next/server";
import { loginWithFirebase, registerWithFirebase } from "@/lib/firebase/auth";

const DEMO_PRESETS: Record<string, { fullName: string; role: string }> = {
  "reporter@subai.ph": { fullName: "CDO Reporter", role: "reporter" },
  "reviewer@subai.ph": { fullName: "CDO Reviewer", role: "reviewer" },
  "collector@subai.ph": { fullName: "CDO Collector", role: "collector" },
  "recycler@subai.ph": { fullName: "CDO Recycler", role: "recycler" },
  "admin@subai.ph": { fullName: "System Administrator", role: "admin" },
  "reporter@tubigloop.edu": { fullName: "CDO Reporter", role: "reporter" },
  "reviewer@tubigloop.edu": { fullName: "CDO Reviewer", role: "reviewer" },
  "collector@tubigloop.edu": { fullName: "CDO Collector", role: "collector" },
  "recycler@tubigloop.edu": { fullName: "CDO Recycler", role: "recycler" },
  "admin@tubigloop.edu": { fullName: "System Administrator", role: "admin" },
};

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

    const cleanEmail = username.toLowerCase();
    let user;

    // 1. Attempt login with Firebase
    try {
      user = await loginWithFirebase(username, password);
    } catch (fbErr: any) {
      const code = fbErr?.code || "";

      // Check if Email/Password provider is disabled in Firebase Console
      if (code === "auth/operation-not-allowed") {
        return NextResponse.json(
          {
            success: false,
            message: "Email/Password sign-in is disabled in your Firebase project. Please enable it in Firebase Console > Authentication > Sign-in method.",
          },
          { status: 403 }
        );
      }

      // If user doesn't exist yet and it's one of the 1-Tap Quick Pilot accounts, auto-provision it in Firebase!
      if (
        (code === "auth/invalid-credential" ||
          code === "auth/user-not-found" ||
          code === "auth/wrong-password") &&
        DEMO_PRESETS[cleanEmail] &&
        (password === "subai123" || password === "tubigloop123")
      ) {
        try {
          const preset = DEMO_PRESETS[cleanEmail];
          user = await registerWithFirebase(preset.fullName, cleanEmail, password, preset.role);
        } catch (regErr: any) {
          if (regErr?.code === "auth/operation-not-allowed") {
            return NextResponse.json(
              {
                success: false,
                message: "Email/Password sign-in is disabled in your Firebase project. Please enable it in Firebase Console > Authentication > Sign-in method.",
              },
              { status: 403 }
            );
          }
        }
      }

      if (!user) {
        let message = "Invalid email/username or password. Please try again.";
        if (code === "auth/too-many-requests") {
          message = "Access temporarily disabled due to many failed attempts. Try again later.";
        } else if (code === "auth/network-request-failed") {
          message = "Network error connecting to Firebase. Please check your internet connection.";
        } else if (fbErr?.message && !fbErr.message.includes("auth/")) {
          message = fbErr.message;
        }
        return NextResponse.json({ success: false, message }, { status: 401 });
      }
    }

    const sessionData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: String(user.role).toUpperCase(),
      },
    });

    response.cookies.set("subai_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: false, // allow http over LAN/hotspot
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set("tubigloop_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: false, // allow http over LAN/hotspot
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "An unexpected error occurred during authentication.",
      },
      { status: 500 }
    );
  }
}
