import { db } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    writeBatch, 
    Timestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

const WEBSITE_IDENTIFIER = "disruptivesolutionsinc";
const CHATS_COLLECTION = "chats";

// --- FETCH CHATS ---
export async function GET() {
    try {
        const chatsRef = collection(db, CHATS_COLLECTION);
        // Nanatiling walang orderBy para iwas sa Index Error (Sorting is done in Frontend)
        const q = query(
            chatsRef, 
            where("website", "==", WEBSITE_IDENTIFIER)
        );

        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Safe timestamp conversion
            timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
        }));

        return NextResponse.json(chats);
    } catch (error: any) {
        console.error("Firebase Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- SAVE MESSAGE (Accepts Text or Cloudinary URL) ---
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { senderEmail, senderName, message, isAdmin, type } = body;

        // Message validation: Ngayon ang 'message' ay pwedeng text o Cloudinary URL string
        if (!message || !senderEmail) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const docRef = await addDoc(collection(db, CHATS_COLLECTION), {
            senderEmail,
            senderName,
            message, // Ito ay magiging text content o ang Cloudinary Secure URL
            isAdmin: isAdmin || false,
            type: type || "text", // "text" or "image"
            website: WEBSITE_IDENTIFIER,
            timestamp: Timestamp.now()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error("Firebase POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- DELETE THREAD ---
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        const q = query(
            collection(db, CHATS_COLLECTION), 
            where("senderEmail", "==", email),
            where("website", "==", WEBSITE_IDENTIFIER)
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Firebase DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}