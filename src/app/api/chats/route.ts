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
} from "firebase/firestore";
import { NextResponse } from "next/server";

const WEBSITE_IDENTIFIER = "adrenaline_junky_studio"; 
const CHATS_COLLECTION = "chats";

// --- 1. FETCH CHATS ---
export async function GET() {
    try {
        const chatsRef = collection(db, CHATS_COLLECTION);
        const q = query(chatsRef, where("website", "==", WEBSITE_IDENTIFIER));
        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
            // Ibabalik din ang seenAt kung meron
            seenAt: doc.data().seenAt?.toDate()?.toISOString() || null,
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
        const { senderEmail, senderName, message, isAdmin, type, isFAQ } = body;

        if (!message || !senderEmail) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const docRef = await addDoc(collection(db, CHATS_COLLECTION), {
            senderEmail,
            senderName,
            message,
            isAdmin: isAdmin || false,
            type: type || "text",
            isFAQ: isFAQ || false,
            website: WEBSITE_IDENTIFIER,
            timestamp: Timestamp.now(),
            isEdited: false,
            seenAt: null, // Default: hindi pa nakita
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error("Firebase POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- 3. PATCH: Edit message OR bulk mark as seen ---
export async function PATCH(req: Request) {
    try {
        const body = await req.json();

        // CASE A: Mark messages as seen (bulk) 
        // Payload: { markSeen: true, senderEmail: "...", seenBy: "admin" | "client" }
        // seenBy: "admin" = admin nakita na yung messages ng client
        // seenBy: "client" = client nakita na yung messages ng admin
        if (body.markSeen === true) {
            const { senderEmail, seenBy } = body;
            if (!senderEmail || !seenBy) {
                return NextResponse.json({ error: "senderEmail and seenBy required" }, { status: 400 });
            }

            // Kung seenBy = "admin", imi-mark yung mga messages na galing sa client (isAdmin: false)
            // Kung seenBy = "client", imi-mark yung mga messages na galing sa admin (isAdmin: true)
            const isAdminMessages = seenBy === "client"; // client nagbabasa ng admin messages
            
            const q = query(
                collection(db, CHATS_COLLECTION),
                where("website", "==", WEBSITE_IDENTIFIER),
                where("senderEmail", "==", senderEmail),
                where("isAdmin", "==", isAdminMessages),
            );

            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            let updatedCount = 0;

            snapshot.docs.forEach((document) => {
                // I-update lang yung mga hindi pa nakita
                if (!document.data().seenAt) {
                    batch.update(document.ref, { seenAt: Timestamp.now() });
                    updatedCount++;
                }
            });

            if (updatedCount > 0) await batch.commit();
            return NextResponse.json({ success: true, mode: "markSeen", updated: updatedCount });
        }

        // CASE B: Edit specific message content
        const { id, message } = body;
        if (!id || !message) {
            return NextResponse.json({ error: "ID and Message required" }, { status: 400 });
        }

        const msgRef = doc(db, CHATS_COLLECTION, id);
        await updateDoc(msgRef, {
            message,
            isEdited: true,
            lastUpdated: Timestamp.now(),
        });

        return NextResponse.json({ success: true, mode: "edit" });
    } catch (error: any) {
        console.error("Firebase PATCH Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- 4. DELETE: Single message or full thread ---
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const email = searchParams.get("email");

        if (id) {
            const msgRef = doc(db, CHATS_COLLECTION, id);
            await deleteDoc(msgRef);
            return NextResponse.json({ success: true, mode: "single" });
        }

        if (email) {
            const q = query(
                collection(db, CHATS_COLLECTION), 
                where("senderEmail", "==", email),
                where("website", "==", WEBSITE_IDENTIFIER)
            );
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            return NextResponse.json({ success: true, mode: "bulk" });
        }

        return NextResponse.json({ error: "ID or Email required" }, { status: 400 });
    } catch (error: any) {
        console.error("Firebase DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}