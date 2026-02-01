import { db } from "@/lib/firebase";
import { 
  collection, doc, writeBatch, serverTimestamp, increment 
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { dr_number, supplier_id, date_delivered, items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items list" }, { status: 400 });
    }

    // Initialize ang Batch (Katumbas ng bulkWrite sa Mongo)
    const batch = writeBatch(db);

    // 1. I-map ang items para sa inventory updates
    items.forEach((item: any) => {
      // Tandaan: Sa Firebase, yung item.product_id ay rekta nang string ID
      const productRef = doc(db, "inventory", item.product_id);
      
      batch.update(productRef, {
        quantity: increment(parseInt(item.quantity)), // $inc: Dagdag sa kasalukuyang stock
        selling_price: parseFloat(item.selling_price),
        last_dr: dr_number,
        updatedAt: serverTimestamp() // Mas safe gamitin ang server side time
      });
    });

    // 2. I-save ang transaction record sa delivery_logs history
    const logRef = doc(collection(db, "delivery_logs"));
    batch.set(logRef, {
      dr_number,
      supplier_id,
      date_delivered: new Date(date_delivered),
      items_count: items.length,
      createdAt: serverTimestamp()
    });

    // Isang bagsakan na commit sa database
    await batch.commit();

    return NextResponse.json({ 
      message: "Stock updated successfully", 
      modifiedCount: items.length 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}