import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function GET() {
    try {
        const usersRef = collection(db, "users");
        // Hahanap tayo ng kahit isang Super Admin lang
        const q = query(usersRef, where("role", "==", "Super Admin"), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return NextResponse.json({ exists: true });
        }

        return NextResponse.json({ exists: false });
    } catch (error) {
        return NextResponse.json({ exists: true }); // Safety: Lock it if DB fails
    }
}