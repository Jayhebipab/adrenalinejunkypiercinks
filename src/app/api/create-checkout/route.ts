import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    // 1. Siguraduhin na may Secret Key tayo
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      console.error("Missing PAYMONGO_SECRET_KEY");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    // 2. I-define ang auth (Eto yung nawawala kanina)
    const auth = Buffer.from(`${secretKey}:`).toString('base64');

    // 3. I-re-format ang items (Dapat match ang keys sa frontend)
    const formattedLineItems = items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      currency: 'PHP',
      amount: item.amount // Galing sa Math.round(price * 100) ng frontend
    }));

    // 4. Tawagan ang PayMongo
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method_types: ['gcash'],
            line_items: formattedLineItems,
            success_url: "https://adrenalinejunkypiercinks.vercel.app/success",
            reference_number: `AJ-${Date.now()}`
          }
        }
      })
    });

    const session = await response.json();

    // 5. Error handling mula sa PayMongo
    if (session.errors) {
      console.error("PayMongo API Error:", JSON.stringify(session.errors, null, 2));
      return NextResponse.json({ 
        error: session.errors[0].detail || "Payment Session Error" 
      }, { status: 400 });
    }

    // 6. Return the URL to frontend
    return NextResponse.json({ url: session.data.attributes.checkout_url });

  } catch (err) {
    console.error("Internal Server Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}