import { NextRequest, NextResponse } from "next/server";
import { registerWithFirebase } from "@/lib/firebase/auth";

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

    // Register user in Firebase Authentication & save role profile in Firestore
    let newUser;
    try {
      newUser = await registerWithFirebase(username, email, password, role);
    } catch (fbErr: any) {
      const code = fbErr?.code || "";
      if (code === "auth/operation-not-allowed") {
        return NextResponse.json(
          {
            success: false,
            message: "Email/Password sign-in is disabled in your Firebase project. Please enable it in Firebase Console > Authentication > Sign-in method.",
          },
          { status: 403 }
        );
      } else if (code === "auth/email-already-in-use") {
        return NextResponse.json(
          { success: false, message: "An account with this email already exists. Please sign in." },
          { status: 400 }
        );
      } else if (code === "auth/weak-password") {
        return NextResponse.json(
          { success: false, message: "Password is too weak. Please choose a stronger password." },
          { status: 400 }
        );
      } else if (code === "auth/invalid-email") {
        return NextResponse.json(
          { success: false, message: "The email address is improperly formatted." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: fbErr?.message || "Registration failed." },
        { status: 400 }
      );
    }

    const sessionData = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    };

    const response = NextResponse.json({
      success: true,
      message: `Account created successfully! Welcome, ${newUser.username}.`,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: String(newUser.role).toUpperCase(),
      },
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
        message: error?.message || "Server error while registering account.",
      },
      { status: 500 }
    );
  }
}
