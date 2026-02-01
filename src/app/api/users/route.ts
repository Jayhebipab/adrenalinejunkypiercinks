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

// --- 1. GET: Fetch all users (Security: No passwords/PINs) ---
export async function GET() {
  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const users = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Manual exclusion ng sensitive data
      const { password, systemPIN, ...safeData } = data;
      return { id: docSnap.id, ...safeData };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// --- 2. POST: Register with Duplicate Validation ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, role, contact, systemPIN } = body;

    // VALIDATION: Check kung may duplicate Email, Username, o Contact
    const usersRef = collection(db, "users");
    
    const emailCheck = await getDocs(query(usersRef, where("email", "==", email)));
    if (!emailCheck.empty) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const usernameCheck = await getDocs(query(usersRef, where("username", "==", username)));
    if (!usernameCheck.empty) return NextResponse.json({ error: "Username already taken" }, { status: 400 });

    const contactCheck = await getDocs(query(usersRef, where("contact", "==", contact)));
    if (!contactCheck.empty) return NextResponse.json({ error: "Contact number already registered" }, { status: 400 });

    // Hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    let hashedPin = "";
    if (role === "Super Admin" && systemPIN) {
      hashedPin = await bcrypt.hash(systemPIN, 10);
    }

    const newUser = {
      username,
      email,
      role,
      contact,
      password: hashedPassword,
      systemPIN: hashedPin,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "users"), newUser);
    return NextResponse.json({ id: docRef.id, message: "Personnel registered successfully!" }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. PUT: Security Verification & Update with Duplicate Check ---
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, isVerifying, currentPassword, systemPIN, username, contact, newPassword, newSystemPIN } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const userData = docSnap.data();

    // --- SECURITY VERIFICATION MODE ---
    if (isVerifying) {
      const passMatch = currentPassword ? await bcrypt.compare(currentPassword, userData.password) : false;
      const pinMatch = systemPIN ? await bcrypt.compare(systemPIN, userData.systemPIN || "") : false;

      if (passMatch || pinMatch) {
        return NextResponse.json({ message: "Root Access Granted" });
      }
      return NextResponse.json({ error: "Invalid Credentials" }, { status: 401 });
    }

    // --- ACTUAL UPDATE LOGIC WITH VALIDATION ---
    const usersRef = collection(db, "users");

    // 1. Check if Username is taken by OTHER users
    if (username && username !== userData.username) {
      const q = query(usersRef, where("username", "==", username));
      const snap = await getDocs(q);
      if (!snap.empty) return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    // 2. Check if Contact is taken by OTHER users
    if (contact && contact !== userData.contact) {
      const q = query(usersRef, where("contact", "==", contact));
      const snap = await getDocs(q);
      if (!snap.empty) return NextResponse.json({ error: "Contact number already in use by another staff" }, { status: 400 });
    }

    const updateData: any = { updatedAt: serverTimestamp() };
    if (username) updateData.username = username;
    if (contact) updateData.contact = contact;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 10);
    if (newSystemPIN) updateData.systemPIN = await bcrypt.hash(newSystemPIN, 10);

    await updateDoc(docRef, updateData);
    return NextResponse.json({ message: "Updated successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 4. DELETE: Anti-Root Protection ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (docSnap.data().role === "Super Admin") {
      return NextResponse.json({ error: "Root user cannot be deleted" }, { status: 403 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ message: "Personnel removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}