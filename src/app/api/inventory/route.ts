import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, updateDoc, doc, 
  query, orderBy, serverTimestamp, writeBatch, increment 
} from "firebase/firestore";
import { NextResponse } from "next/server";

// --- GET: Para sa history ng delivery reports ---
export async function GET() {
  try {
    const q = query(collection(db, "delivery_reports"), orderBy("delivery_date", "desc"));
    const snapshot = await getDocs(q);
    
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// --- POST: Para sa New Delivery (Batch Update sa Products & Add Report) ---
export async function POST(req: Request) {
  try {
    const { supplier, date, items } = await req.json();
    const batch = writeBatch(db);

    // 1. I-update ang bawat produkto sa products collection
    items.forEach((item: any) => {
      const productRef = doc(db, "products", item.productId);
      batch.update(productRef, {
        selling_price: parseFloat(item.sellingPrice),
        supplier_name: supplier,
        last_delivery_date: new Date(date),
        quantity: increment(parseInt(item.quantity)), // Dadagdagan yung existing quantity
        updatedAt: serverTimestamp()
      });
    });

    // 2. I-insert ang delivery report document
    const reportRef = doc(collection(db, "delivery_reports"));
    batch.set(reportRef, {
      supplier,
      delivery_date: new Date(date),
      items: items.map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: parseInt(i.quantity),
        sellingPrice: parseFloat(i.sellingPrice)
      })),
      createdAt: serverTimestamp()
    });

    await batch.commit();

    return NextResponse.json({ message: "Stock Assigned!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Post failed: " + error.message }, { status: 500 });
  }
}

// --- PUT: Para sa Quick Update / Edit Button ---
export async function PUT(req: Request) {
  try {
    const { id, quantity, sellingPrice } = await req.json();
    
    const productRef = doc(db, "products", id);
    
    await updateDoc(productRef, {
      quantity: parseInt(quantity),
      selling_price: parseFloat(sellingPrice),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: "Inventory Updated Successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 500 });
  }
}