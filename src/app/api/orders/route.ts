import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

// --- GET: FETCH ALL ORDERS ---
export async function GET() {
  try {
    // Kinukuha lahat ng orders mula sa "orders" collection, pinakabago ang una
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// --- POST: SUBMIT NEW ORDER ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      customer_name, 
      contact_number, 
      address, 
      items, 
      total_amount, 
      payment_method, 
      screenshot 
    } = body;

    // Validation para masiguro na kumpleto ang data bago i-save
    if (!customer_name || !items || !screenshot) {
      return NextResponse.json({ error: "Missing required order details." }, { status: 400 });
    }

    // Pag-save ng bagong order document sa Firestore
    const docRef = await addDoc(collection(db, "orders"), {
      customer_name: customer_name.trim(),
      contact_number: contact_number.trim(),
      address: address.trim(),
      items: items, 
      total_amount: Number(total_amount),
      payment_method: payment_method,
      screenshot: screenshot, 
      status: "Pending", // Default status para sa verification
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ 
      message: "Order placed successfully", 
      orderId: docRef.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Post Error:", error);
    return NextResponse.json({ error: "System Error: Failed to submit order." }, { status: 500 });
  }
}

// --- PUT: UPDATE ORDER STATUS ---
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID and Status are required" }, { status: 400 });
    }

    // Update ang specific order document (halimbawa: Pending -> Paid)
    const orderRef = doc(db, "orders", id);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: "Order status updated" });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// --- DELETE: REMOVE ORDER ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    // Pag-delete ng record sa Firestore gamit ang Document ID
    await deleteDoc(doc(db, "orders", id));
    return NextResponse.json({ message: "Order record deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}