import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  serverTimestamp, increment 
} from "firebase/firestore";
import { NextResponse } from "next/server";

const COLLECTION_NAME = "promos";

// GET ALL PROMOS
export async function GET() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const promos = querySnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
      
    return NextResponse.json(promos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // DAGDAG: kinuha natin yung clientname sa request body
        const { name, type, price, artist, clientname, productsUsed } = body;

        // 1. SAVE THE PROMO RECORD
        const promoRef = await addDoc(collection(db, "promos"), {
            name,
            type,
            price: Number(price),
            artist,
            clientname: clientname || "WALANG PANGALAN", // DAGDAG: Para siguradong may entry sa DB
            productsUsed, 
            createdAt: serverTimestamp(),
        });

        // 2. DEDUCT INVENTORY QUANTITY
        if (productsUsed && Array.isArray(productsUsed)) {
            for (const item of productsUsed) {
                if (item.name && item.quantity > 0) {
                    const productQuery = query(
                        collection(db, "products"), 
                        where("name", "==", item.name)
                    );
                    const productSnapshot = await getDocs(productQuery);

                    if (!productSnapshot.empty) {
                        const productDoc = productSnapshot.docs[0];
                        const productRef = doc(db, "products", productDoc.id);

                        await updateDoc(productRef, {
                            quantity: increment(-Number(item.quantity)),
                            updatedAt: serverTimestamp()
                        });
                    }
                }
            }
        }

        return NextResponse.json({ id: promoRef.id }, { status: 201 });
    } catch (error: any) {
        console.error("Promo Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE PROMO
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const docRef = doc(db, COLLECTION_NAME, _id);
    await updateDoc(docRef, { 
      ...updateData, 
      updatedAt: serverTimestamp() 
    });

    return NextResponse.json({ message: "Updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE PROMO
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return NextResponse.json({ message: "Promo deleted!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}