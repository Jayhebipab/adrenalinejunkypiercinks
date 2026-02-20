import { db } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    writeBatch, 
    Timestamp,
    doc,
    updateDoc,
    deleteDoc,
    getDoc
} from "firebase/firestore";
import { NextResponse } from "next/server";

// Siguraduhing tugma ito sa identifier ng studio mo par
const WEBSITE_IDENTIFIER = "adrenaline_junky_studio"; 
const CHATS_COLLECTION = "chats";

// --- 1. FETCH CHATS ---
export async function GET() {
    try {
        const chatsRef = collection(db, CHATS_COLLECTION);
        const q = query(
            chatsRef, 
            where("website", "==", WEBSITE_IDENTIFIER)
        );

        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
        }));

        return NextResponse.json(chats);
    } catch (error: any) {
        console.error("Firebase Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- 2. SAVE MESSAGE ---
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { senderEmail, senderName, message, isAdmin, type } = body;

        if (!message || !senderEmail) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const docRef = await addDoc(collection(db, CHATS_COLLECTION), {
            senderEmail,
            senderName,
            message,
            isAdmin: isAdmin || false,
            type: type || "text",
            website: WEBSITE_IDENTIFIER,
            timestamp: Timestamp.now(),
            isEdited: false // Default state
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error("Firebase POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- 3. EDIT SPECIFIC MESSAGE (PATCH) ---
export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, message } = body;

        if (!id || !message) {
            return NextResponse.json({ error: "ID and Message required" }, { status: 400 });
        }

        const msgRef = doc(db, CHATS_COLLECTION, id);
        
        // Update protocol sa Firestore
        await updateDoc(msgRef, {
            message: message,
            isEdited: true,
            lastUpdated: Timestamp.now()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Firebase PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- 4. DELETE MESSAGE OR THREAD ---
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id"); // Para sa single message delete
        const email = searchParams.get("email"); // Para sa bulk wipe (buong thread)

        // Case A: Delete specific message by ID
        if (id) {
            const msgRef = doc(db, CHATS_COLLECTION, id);
            await deleteDoc(msgRef);
            return NextResponse.json({ success: true, mode: "single" });
        }

        // Case B: Wipe buong thread based sa email
        if (email) {
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
            return NextResponse.json({ success: true, mode: "bulk" });
        }

        return NextResponse.json({ error: "ID or Email required" }, { status: 400 });
    } catch (error: any) {
        console.error("Firebase DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}