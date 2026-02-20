import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, where 
} from "firebase/firestore";
import { NextResponse } from "next/server";

// --- GET: FETCH ORDERS (filtered by email kung meron) ---
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    const ordersRef = collection(db, "orders");
    const q = email
      ? query(ordersRef, where("customer_email", "==", email), orderBy("createdAt", "desc"))
      : query(ordersRef, orderBy("createdAt", "desc"));

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

// --- POST: SUBMIT NEW ORDER (UPDATED) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      customer_name, 
      customer_email, // 1. Tinanggap na natin ang email dito
      contact_number, 
      address, 
      items, 
      subtotal,       // 2. Isinama na rin natin ang breakdown para sa record
      vat_percentage,
      vat_deduction,
      total_amount, 
      payment_method, 
      screenshot 
    } = body;

    // 3. Updated Validation (Dapat may email na rin)
    if (!customer_name || !customer_email || !items || !screenshot) {
      return NextResponse.json({ error: "Missing required order details (Name, Email, Items, or Receipt)." }, { status: 400 });
    }

    // 4. Pag-save sa Firestore
    const docRef = await addDoc(collection(db, "orders"), {
      customer_name: customer_name.trim(),
      customer_email: customer_email.trim(), // Isasama sa record ng order
      contact_number: contact_number.trim(),
      address: address.trim(),
      items: items, 
      subtotal: Number(subtotal),
      vat_percentage: Number(vat_percentage),
      vat_deduction: Number(vat_deduction),
      total_amount: Number(total_amount),
      payment_method: payment_method,
      screenshot: screenshot, // Base64 string ito
      status: "Pending",
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ 
      message: "Order placed successfully", 
      orderId: docRef.id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Post Error:", error);
    // Mas detalyadong error handling para sa debug
    return NextResponse.json({ error: error.message || "System Error: Failed to submit order." }, { status: 500 });
  }
}

// --- PUT: UPDATE ORDER STATUS & COURIER ---
export async function PUT(req: Request) {
  try {
    const { id, status, courier } = await req.json(); // Tinatanggap na natin ang 'courier' dito

    if (!id || !status) {
      return NextResponse.json({ error: "ID and Status are required" }, { status: 400 });
    }

    const orderRef = doc(db, "orders", id);
    
    // Gagawa tayo ng update object para dynamic
    const updateData: any = {
      status: status,
      updatedAt: serverTimestamp()
    };

    // Kung may pinasang courier (halimbawa pag 'Finished' na), isama sa database
    if (courier) {
      updateData.courier = courier;
    }

    await updateDoc(orderRef, updateData);

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Hanapin ang specific order document sa Firestore at burahin
    const orderRef = doc(db, "orders", id);
    await deleteDoc(orderRef);

    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}