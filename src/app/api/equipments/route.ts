import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, where, limit, Timestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

const COLLECTION_NAME = "equipments";

// --- GET: FETCH ALL EQUIPMENT ---
export async function GET() {
  try {
    // Naka-order by name para malinis sa table
    const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    
    const data = snapshot.docs.map(doc => {
      const item = doc.data();
      return {
        id: doc.id,
        ...item,
        // Convert dates to ISO string para safe sa frontend
        delivery_date: item.delivery_date?.toDate()?.toISOString() || null,
        createdAt: item.createdAt?.toDate()?.toISOString() || null,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch registry" }, { status: 500 });
  }
}

// --- POST: ADD WITH DUPLICATE CHECK ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, cost_price, quantity, supplier, delivery_date } = body;
    const cleanName = name.trim();

    // 1. Duplicate check (ayaw natin ng dobleng pangalan ng equipment)
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("name", "==", cleanName),
      limit(1)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      return NextResponse.json({ error: "Asset already exists in registry." }, { status: 400 });
    }

    // 2. Add document
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: cleanName,
      category,
      supplier: supplier || "Unknown",
      cost_price: Number(cost_price),
      quantity: Number(quantity),
      delivery_date: delivery_date ? Timestamp.fromDate(new Date(delivery_date)) : serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "System Error: Failed to register asset." }, { status: 500 });
  }
}

// --- PUT: UPDATE WITH DUPLICATE CHECK ---
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, category, cost_price, quantity, supplier, delivery_date } = body;
    const cleanName = name.trim();

    // 1. Check if name is taken by another entry
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("name", "==", cleanName),
      limit(2)
    );
    const existing = await getDocs(q);
    const isDuplicate = existing.docs.some(doc => doc.id !== id);

    if (isDuplicate) {
      return NextResponse.json({ error: "Conflict: Another asset uses this name." }, { status: 400 });
    }

    // 2. Update entry
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      name: cleanName,
      category,
      supplier,
      cost_price: Number(cost_price),
      quantity: Number(quantity),
      delivery_date: delivery_date ? Timestamp.fromDate(new Date(delivery_date)) : serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: "Asset Updated" });
  } catch (error) {
    return NextResponse.json({ error: "System Error: Update failed." }, { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return NextResponse.json({ message: "Asset Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}