import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// ─── Audit Trail Helper ───────────────────────────────────────────────────────
async function logAuditTrail({
  userId,
  email,
  action,
  reason,
  success,
}: {
  userId: string;
  email: string;
  action: string;
  reason: string;
  success: boolean;
}) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      userId,
      email,
      action,
      reason,
      success,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("[AUDIT_LOG_ERROR]", err);
  }
}

// ─── 1. GET: Fetch all users (No passwords/PINs) ─────────────────────────────
export async function GET() {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const { password, systemPIN, ...safeData } = data;
      return { id: docSnap.id, ...safeData };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("[GET_USERS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ─── 2. POST: Register new user ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, role, contact, systemPIN } = body;

    if (!username?.trim()) return NextResponse.json({ error: "Username is required." }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: "Password is required." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (!role?.trim()) return NextResponse.json({ error: "Role is required." }, { status: 400 });
    if (role === "Super Admin" && !systemPIN?.trim()) {
      return NextResponse.json({ error: "Master PIN is required for Super Admin." }, { status: 400 });
    }

    const usersRef = collection(db, "users");

    const emailCheck = await getDocs(query(usersRef, where("email", "==", email)));
    if (!emailCheck.empty) return NextResponse.json({ error: "Email already exists." }, { status: 400 });

    const usernameCheck = await getDocs(query(usersRef, where("username", "==", username)));
    if (!usernameCheck.empty) return NextResponse.json({ error: "Username already taken." }, { status: 400 });

    if (contact?.trim()) {
      const contactCheck = await getDocs(query(usersRef, where("contact", "==", contact)));
      if (!contactCheck.empty) return NextResponse.json({ error: "Contact number already registered." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let hashedPin = "";
    if (role === "Super Admin" && systemPIN) {
      hashedPin = await bcrypt.hash(systemPIN, 10);
    }

    const newUser = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role,
      contact: contact?.trim() || "",
      password: hashedPassword,
      systemPIN: hashedPin,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "users"), newUser);

    await logAuditTrail({
      userId: docRef.id,
      email: email.trim().toLowerCase(),
      action: "USER_REGISTERED",
      reason: `New ${role} account created`,
      success: true,
    });

    return NextResponse.json({ id: docRef.id, message: "Personnel registered successfully!" }, { status: 201 });

  } catch (error: any) {
    console.error("[POST_USER_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── 3. PUT: Update user / Verify Super Admin / Change Password ───────────────
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, isVerifying, isChangingPassword, currentPassword, newPassword, systemPIN } = body;

    console.log("[PUT] Body received:", JSON.stringify(body, null, 2));

    if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    console.log("[PUT] Doc exists:", docSnap.exists());

    if (!docSnap.exists()) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const userData = docSnap.data();

    console.log("[PUT] userData keys:", Object.keys(userData));

    // ── Mode 1: Super Admin verification ──
    if (isVerifying) {
      const passMatch = currentPassword && userData.password
        ? await bcrypt.compare(currentPassword, userData.password)
        : false;
      const pinMatch = systemPIN && userData.systemPIN
        ? await bcrypt.compare(systemPIN, userData.systemPIN)
        : false;

      if (passMatch || pinMatch) return NextResponse.json({ message: "Root Access Granted" });
      return NextResponse.json({ error: "Invalid Credentials" }, { status: 401 });
    }

    // ── Mode 2: Change own password ──
    if (isChangingPassword) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
      }

      if (!userData.password) {
        return NextResponse.json({ error: "This account uses a social login and has no password to update." }, { status: 400 });
      }

      const isMatch = await bcrypt.compare(currentPassword, userData.password);

      if (!isMatch) {
        await logAuditTrail({
          userId: id,
          email: userData.email,
          action: "PASSWORD_CHANGE_FAILED",
          reason: "Incorrect current password",
          success: false,
        });
        return NextResponse.json({ error: "Incorrect current password." }, { status: 403 });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      await updateDoc(docRef, {
        password: hashedNewPassword,
        updatedAt: serverTimestamp(),
      });

      await logAuditTrail({
        userId: id,
        email: userData.email,
        action: "PASSWORD_CHANGED",
        reason: "User successfully changed their password",
        success: true,
      });

      return NextResponse.json({ message: "Password updated successfully." });
    }

    // ── Mode 3: General profile / permissions update ──
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    const reservedKeys = ["id", "isVerifying", "isChangingPassword", "currentPassword", "newPassword", "systemPIN", "newSystemPIN", "email"];

    Object.keys(body).forEach(key => {
      if (!reservedKeys.includes(key) && body[key] !== undefined) {
        updateData[key] = body[key];
      }
    });

    if (body.newPassword?.trim()) {
      updateData.password = await bcrypt.hash(body.newPassword, 10);
    }
    if (body.newSystemPIN?.trim()) {
      updateData.systemPIN = await bcrypt.hash(body.newSystemPIN, 10);
    }

    await updateDoc(docRef, updateData);

    await logAuditTrail({
      userId: id,
      email: userData.email,
      action: "USER_UPDATED",
      reason: "Profile or permissions updated",
      success: true,
    });

    return NextResponse.json({ message: "Sync Successful" });

  } catch (error: any) {
    console.error("[PUT_USER_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── 4. DELETE: Anti-Root Protection ─────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const userData = docSnap.data();

    if (userData.role === "Super Admin") {
      return NextResponse.json({ error: "Root user cannot be deleted." }, { status: 403 });
    }

    await deleteDoc(docRef);

    await logAuditTrail({
      userId: id,
      email: userData.email,
      action: "USER_DELETED",
      reason: "Personnel record removed",
      success: true,
    });

    return NextResponse.json({ message: "Personnel removed." });

  } catch (error: any) {
    console.error("[DELETE_USER_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}