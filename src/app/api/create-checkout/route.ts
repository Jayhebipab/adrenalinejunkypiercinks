import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { items, totalAmount } = await req.json();
    
    // 1. Gawa tayo ng Order ID (e.g., AJ-170123456)
    const orderId = `AJ-${Date.now()}`;

    // 2. I-save muna sa Firebase (Pending status)
    await addDoc(collection(db, "orders"), {
      orderId: orderId,
      amount: totalAmount,
      status: "Pending",
      createdAt: serverTimestamp(),
    });

    // 3. I-prepare ang Auth Header (Base64 Secret Key)
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    // 4. Tawagan ang PayMongo Checkout API
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_line_items: true,
            payment_method_types: ['gcash'],
            reference_number: orderId, // Importante ito para sa Webhook mamaya
            line_items: items.map((item: any) => ({
              amount: Math.round(item.price * 100), // Convert Peso to Cents dito na rin
              currency: 'PHP',
              name: item.name,
              quantity: item.quantity,
            })),
            success_url: "https://adrenalinejunkypiercinks.vercel.app/success",
            cancel_url: "https://adrenalinejunkypiercinks.vercel.app/checkout",
          },
        },
      }),
    });

    const session = await response.json();

    if (session.errors) {
      console.error(session.errors);
      return NextResponse.json({ error: "PayMongo Error" }, { status: 400 });
    }

    // 5. Ibalik ang GCash Link sa Frontend
    return NextResponse.json({ url: session.data.attributes.checkout_url });

  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json({ error: "System Error" }, { status: 500 });
  }
}