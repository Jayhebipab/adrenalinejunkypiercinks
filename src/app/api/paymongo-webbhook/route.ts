import { db } from "@/lib/firebase"; // Ginamit ang db mo par
import { 
  collection, query, where, getDocs, updateDoc, doc, serverTimestamp, limit 
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventType = body.data.attributes.type;

    // 1. Check kung "paid" ang status mula kay PayMongo
    if (eventType === "checkout_session.payment.paid") {
      const resource = body.data.attributes.payload.data;
      const attributes = resource.attributes;
      
      // Ito yung reference_number na isesend natin mamaya sa create-checkout
      const externalReference = attributes.reference_number; 

      // 2. Hanapin ang Order sa Firebase gamit ang reference_number
      // Kunwari ang collection name mo ay "orders"
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("orderId", "==", externalReference), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0];
        
        // 3. I-update ang status ng order sa Firebase
        await updateDoc(doc(db, "orders", orderDoc.id), {
          status: "Paid",
          paymongoPaymentId: resource.id,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log(`Order ${externalReference} marked as PAID.`);
      }
    }

    // 4. Laging mag-return ng 200 sa PayMongo para hindi sila ulit-ulit
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Failed" }, { status: 500 });
  }
}