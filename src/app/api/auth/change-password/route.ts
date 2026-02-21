import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from "firebase/firestore"

export async function POST(req: Request) {
    try {
        const { email, currentPassword, newPassword } = await req.json();

        // Basic validation
        if (!email || !currentPassword || !newPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Check if user has a password (might be OAuth user)
        if (!userData.password) {
            return NextResponse.json({ error: "This account uses a social login and has no password to update" }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!isMatch) {
            // Log failed attempt in audit trail
            await logAuditTrail({
                userId: userDoc.id,
                email,
                action: "PASSWORD_CHANGE_FAILED",
                reason: "Incorrect current password",
                success: false,
            });
            return NextResponse.json({ error: "Incorrect current password" }, { status: 403 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        const docRef = doc(db, "users", userDoc.id);

        await updateDoc(docRef, {
            password: hashedNewPassword,
            lastUpdated: new Date().toISOString(),
        });

        // Log successful password change
        await logAuditTrail({
            userId: userDoc.id,
            email,
            action: "PASSWORD_CHANGED",
            reason: "User successfully changed their password",
            success: true,
        });

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });

    } catch (error) {
        // Now you can actually see what's wrong
        console.error("[CHANGE_PASSWORD_ERROR]", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

// --- Audit Trail Helper ---
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
        const auditRef = collection(db, "audit_logs");
        await addDoc(auditRef, {
            userId,
            email,
            action,       // e.g. "PASSWORD_CHANGED" | "PASSWORD_CHANGE_FAILED"
            reason,
            success,
            timestamp: new Date().toISOString(),
            performedAt: new Date(),
        });
    } catch (err) {
        // Don't let audit logging crash the main flow
        console.error("[AUDIT_LOG_ERROR]", err);
    }
}