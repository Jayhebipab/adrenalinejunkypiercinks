import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, query, limit } from "firebase/firestore";
import { NextResponse } from "next/server";

// --- GET: Kunin lahat ng Payment Details ---
export async function GET() {
  try {
    const q = query(collection(db, "payment_settings"), limit(1));
    const snapshot = await getDocs(q);
    
    // Default Values kung wala pang laman ang DB
    const defaults = { 
      gcash_qr: "", 
      gcash_name: "JAYSON PABLO",
      gcash_number: "09123456789",
      bpi_qr: "", 
      bpi_name: "JAYSON PABLO", 
      bpi_number: "1234-5678-90" 
    };

    if (snapshot.empty) {
      return NextResponse.json(defaults);
    }

    const data = snapshot.docs[0].data();
    return NextResponse.json({ id: snapshot.docs[0].id, ...data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// --- POST: Update QR at Details (Dashboard Side) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      gcash_qr, gcash_name, gcash_number, 
      bpi_qr, bpi_name, bpi_number 
    } = body;

    await setDoc(doc(db, "payment_settings", "current_settings"), {
      // GCash Details
      gcash_qr: gcash_qr || "",
      gcash_name: gcash_name || "",
      gcash_number: gcash_number || "",
      
      // BPI Details
      bpi_qr: bpi_qr || "",
      bpi_name: bpi_name || "",
      bpi_number: bpi_number || "",
      
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ message: "Payment settings updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}