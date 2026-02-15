import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"

export async function POST(req: Request) {
    try {
        const { email, currentPassword, newPassword } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        const isMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 403 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        const docRef = doc(db, "users", userDoc.id);
        
        await updateDoc(docRef, {
            password: hashedNewPassword,
            lastUpdated: new Date().toISOString()
        });

        return NextResponse.json({ message: "Password updated" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}