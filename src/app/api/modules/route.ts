import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// GET: Fetch all modules
export async function GET() {
  try {
    const q = query(collection(db, "modules"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    const modules = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(modules);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// POST: Add new module
export async function POST(req: Request) {
  try {
    const { id, label, order } = await req.json();
    // Gagamitin natin ang custom ID (e.g., 'inventory') para madaling i-reference sa users
await setDoc(doc(db, "modules", id), { 
  id: id,
  label: label,
  order: order,
  createdAt: serverTimestamp()
});
    return NextResponse.json({ message: "Module created" });
  } catch (error) {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}

// DELETE: Remove module
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await deleteDoc(doc(db, "modules", id));
    return NextResponse.json({ message: "Module deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}