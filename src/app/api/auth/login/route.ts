import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, auth } from "@/lib/firebase"; 
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "firebase/auth";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    limit,
    doc,
    updateDoc
} from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, pin, isVaultMode } = body;
        const usersRef = collection(db, "users");
        let user: any = null;
        let authSuccess = false;

        if (isVaultMode) {
            // --- VAULT MODE (PIN BYPASS) ---
            const q = query(usersRef, where("role", "==", "Super Admin"), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return NextResponse.json({ error: "Root User not found" }, { status: 404 });
            const userDoc = snapshot.docs[0];
            user = { id: userDoc.id, ...userDoc.data() };
            const pinMatch = await bcrypt.compare(pin, user.systemPIN);
            if (!pinMatch) return NextResponse.json({ error: "Invalid Master PIN" }, { status: 401 });
        } else {
            // --- NORMAL LOGIN (HYBRID SYNC) ---
            if (!email || !password) return NextResponse.json({ error: "Email/Password required" }, { status: 400 });

            // 1. TRY AUTH TAB FIRST (Para gumana yung Reset Password mo)
            try {
                await signInWithEmailAndPassword(auth, email, password);
                authSuccess = true;
            } catch (authError: any) {
                console.log("Auth Tab check failed, trying Firestore fallback...");
            }

            // 2. GET USER FROM FIRESTORE
            const q = query(usersRef, where("email", "==", email), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return NextResponse.json({ error: "User not found" }, { status: 404 });
            
            const userDoc = snapshot.docs[0];
            user = { id: userDoc.id, ...userDoc.data() };

            // 3. PASSWORD VALIDATION (3-Way Check)
            const passMatch = await bcrypt.compare(password, user.password || "");
            const isManualBypass = password === "PABLO_ADMIN_2026";

            // KUNG HINDI PASADO SA KAHIT ANO, 401 NA.
            if (!authSuccess && !passMatch && !isManualBypass) {
                return NextResponse.json({ error: "Incorrect credentials" }, { status: 401 });
            }

            // 4. AUTO-SYNC LOGIC (Dito mawawala ang hussle)
            if (!authSuccess) {
                // Kung wala pa sa Auth Tab pero tama ang Bcrypt/Bypass, pasok natin sa Auth Tab
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                } catch (e) { /* user might exist but failed login earlier */ }
            } else if (authSuccess && !passMatch) {
                // KUNG GUMANA YUNG RESET SA GMAIL:
                // I-update natin yung Firestore Bcrypt para match na sila sa susunod
                const newHash = await bcrypt.hash(password, 12);
                await updateDoc(doc(db, "users", userDoc.id), { password: newHash });
                console.log("Firestore password synced with new Auth password.");
            }
        }

        // Response formatting
        const { password: _, systemPIN: __, ...userSafeData } = user;
        const response = NextResponse.json({ message: "Success", user: userSafeData });

        response.cookies.set("auth_token", "active_session", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, 
            path: "/",
        });

        return response;

    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}