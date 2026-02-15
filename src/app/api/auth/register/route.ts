import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const { name, email, password, systemPIN, role } = await req.json();

        const usersRef = collection(db, "users");

        // 1. KUNG SUPER ADMIN ANG SULAT, CHECK KUNG MERON NA SA DB
        if (role === "Super Admin") {
            const superAdminQuery = query(usersRef, where("role", "==", "Super Admin"), limit(1));
            const superAdminSnapshot = await getDocs(superAdminQuery);

            if (!superAdminSnapshot.empty) {
                return NextResponse.json(
                    { error: "ROOT ACCESS DENIED: Super Admin already exists in the system." }, 
                    { status: 403 }
                );
            }
        }

        // 2. CHECK KUNG EXISTING NA ANG EMAIL PARA SA KAHIT ANONG ROLE
        const emailQuery = query(usersRef, where("email", "==", email), limit(1));
        const emailSnapshot = await getDocs(emailQuery);

        if (!emailSnapshot.empty) {
            return NextResponse.json({ error: "Personnel email already registered" }, { status: 400 });
        }

        // 3. HASHING SENSITIVE DATA
        // Mataas na salt rounds para sa Super Admin security
        const hashedPassword = await bcrypt.hash(password, 12);
        const hashedPIN = await bcrypt.hash(systemPIN, 12);

        // 4. SAVE TO FIRESTORE
        await addDoc(usersRef, {
            name,
            email,
            password: hashedPassword,
            systemPIN: hashedPIN,
            role, // Super Admin
            createdAt: new Date().toISOString(),
            isApproved: role === "Super Admin" ? true : false // Auto-approve kung root, false kung iba
        });

        return NextResponse.json({ message: " SUCCESSFUL: Root user created." }, { status: 201 });

    } catch (error: any) {
        console.error("Register Error:", error);
        return NextResponse.json({ error: "Protocol Error: System Failure" }, { status: 500 });
    }
}