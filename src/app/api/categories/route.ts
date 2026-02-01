import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, where, limit 
} from "firebase/firestore";
import { NextResponse } from "next/server";


// --- GET: FETCH ALL ---
export async function GET() {
  try {
    const q = query(collection(db, "categories"), orderBy("category_name", "asc"));
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
// --- POST: ADD WITH DUPLICATE CHECK ---
export async function POST(req: Request) {
  try {
    const { category_name } = await req.json();
    const cleanName = category_name.trim();

    // 1. Check if name already exists
    const q = query(
      collection(db, "categories"), 
      where("category_name", "==", cleanName),
      limit(1)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      return NextResponse.json({ error: "Classification Label already exists." }, { status: 400 });
    }

    // 2. Add if unique
    const docRef = await addDoc(collection(db, "categories"), {
      category_name: cleanName,
      createdAt: serverTimestamp()
    });
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "System Error: Failed to add node." }, { status: 500 });
  }
}

// --- PUT: UPDATE WITH DUPLICATE CHECK ---
export async function PUT(req: Request) {
  try {
    const { id, category_name } = await req.json();
    const cleanName = category_name.trim();

    // 1. Check if the name is used by OTHER documents
    const q = query(
      collection(db, "categories"), 
      where("category_name", "==", cleanName),
      limit(2) // We check if there's more than one or if it's someone else's
    );
    const existing = await getDocs(q);
    
    // Validate if the label exists and doesn't belong to the current ID
    const isDuplicate = existing.docs.some(doc => doc.id !== id);

    if (isDuplicate) {
      return NextResponse.json({ error: "Label conflict: Entry already exists." }, { status: 400 });
    }

    await updateDoc(doc(db, "categories", id), {
      category_name: cleanName,
      updatedAt: serverTimestamp()
    });
    return NextResponse.json({ message: "Updated" });
  } catch (error) {
    return NextResponse.json({ error: "System Error: Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await deleteDoc(doc(db, "categories", id));
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
// ... rest of the GET and DELETE methods remain the same