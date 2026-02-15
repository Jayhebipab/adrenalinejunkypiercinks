import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebase"; // Galing sa iyong firebase.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    limit 
} from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const { email, password, pin, isVaultMode } = await req.json();
        
        // 1. I-setup ang reference sa collection
        const usersRef = collection(db, "users");
        let user: any = null;

        if (isVaultMode) {
            // Vault Mode: Hanapin ang Super Admin via PIN
            const q = query(usersRef, where("role", "==", "Super Admin"), limit(1));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return NextResponse.json({ error: "Root User not found" }, { status: 404 });
            }
            
            const doc = snapshot.docs[0];
            user = { id: doc.id, ...doc.data() };
            
            // bcrypt check para sa systemPIN
            const pinMatch = await bcrypt.compare(pin, user.systemPIN);
            if (!pinMatch) {
                return NextResponse.json({ error: "Invalid Master PIN" }, { status: 401 });
            }
        } else {
            // Normal Login: Hanapin ang User via Email
            const q = query(usersRef, where("email", "==", email), limit(1));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return NextResponse.json({ error: "Incorrect username or password" }, { status: 404 });
            }
            
            const doc = snapshot.docs[0];
            user = { id: doc.id, ...doc.data() };
            
            // bcrypt check para sa password
            const passMatch = await bcrypt.compare(password, user.password);
            if (!passMatch) {
                return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
            }
        }

        // Tanggalin ang sensitive fields bago i-send sa response
        const { password: _, systemPIN: __, ...userSafeData } = user;
        
        const response = NextResponse.json({ 
            message: "Success", 
            user: userSafeData 
        });

        // HTTP-Only Cookie for Session Management
        response.cookies.set("auth_token", "active_session", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;

    } catch (error: any) {
        console.error("Firebase Client SDK Server-side Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}