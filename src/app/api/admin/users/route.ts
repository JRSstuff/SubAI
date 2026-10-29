import { NextRequest, NextResponse } from "next/server";
import { getFirestoreUsers, updateFirestoreUserRole } from "@/lib/firebase/firestore";
import { registerWithFirebase } from "@/lib/firebase/auth";

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

  try {
    await updateFirestoreUserRole(userId, role);
    return {
      status: 200,
      res: {
        success: true,
        message: `Role updated to '${role}' in Firestore!`,
        user: { id: userId, role },
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      res: { success: false, message: err?.message || "Failed to update role in Firestore." },
    };
  }
}

// 1. GET: List all users from Firestore
export async function GET(request: NextRequest) {
  try {
    const isAdmin = verifyAdminSession(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Administrator access required." },
        { status: 403 }
      );
    }

    const users = await getFirestoreUsers();
    return NextResponse.json({ success: true, users: users || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error fetching users from Firestore." },
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
    const password = body.password || "";
    const rawRole = (body.role || "reporter").toLowerCase();
    const role = VALID_ROLES.includes(rawRole) ? rawRole : "reporter";

    if (!fullName || fullName.length < 3) {
      return NextResponse.json(
        { success: false, message: "Full name must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const newUser = await registerWithFirebase(fullName, email, password, role);

    return NextResponse.json({
      success: true,
      message: `User '${fullName}' successfully created with role '${role}' in Firebase!`,
      user: {
        id: newUser.id,
        full_name: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Error creating user in Firebase." },
      { status: 500 }
    );
  }
}
