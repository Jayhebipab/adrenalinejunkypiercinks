import { db } from "@/lib/firebase";
import { 
    collection, getDocs, addDoc, deleteDoc, 
    updateDoc, doc, query, orderBy, serverTimestamp, where, limit, increment
} from "firebase/firestore";
import { NextResponse } from "next/server";

// --- GET: FETCH ALL PRODUCTS ---
export async function GET() {
    try {
        const q = query(collection(db, "products"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: ADD PRODUCT ---
export async function POST(req: Request) {
    try {
        const { name, category, cost_price, image, description } = await req.json();
        const cleanName = name.trim();
        const cleanCategory = (category || "Uncategorized").trim();
        const cleanDescription = (description || "").trim();

        // ✅ Check if name + category + description combo already exists
        const q = query(
            collection(db, "products"),
            where("name", "==", cleanName),
            where("category", "==", cleanCategory),
            limit(1)
        );
        const existing = await getDocs(q);

        if (!existing.empty) {
            const existingDoc = existing.docs[0].data();
            const existingDesc = (existingDoc.description || "").trim();
            if (existingDesc === cleanDescription) {
                return NextResponse.json(
                    { error: "Product Name, Category, Description already exists." },
                    { status: 400 }
                );
            }
        }

        const docRef = await addDoc(collection(db, "products"), {
            name: cleanName,
            category: cleanCategory,
            cost_price: Number(cost_price) || 0,
            selling_price: 0,
            quantity: 0,
            isVisible: true,
            image: image || "",
            description: cleanDescription,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return NextResponse.json({ id: docRef.id }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- PUT: UPDATE PRODUCT ---
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const id = body.id || body._id;

        if (!id) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

        // --- SCENARIO A: AUTO-DEDUCT STOCK (FROM ORDERS) ---
        if (body.deductQuantity !== undefined) {
            const amountToDeduct = Number(body.deductQuantity);
            if (isNaN(amountToDeduct) || amountToDeduct <= 0) {
                return NextResponse.json({ error: "Invalid deduction quantity." }, { status: 400 });
            }
            const productRef = doc(db, "products", id);
            await updateDoc(productRef, {
                quantity: increment(-Math.abs(amountToDeduct)),
                updatedAt: serverTimestamp()
            });
            return NextResponse.json({ success: true, message: `Successfully deducted ${amountToDeduct} from stock.` });
        }

        // --- SCENARIO B: MANUAL PRODUCT EDIT ---
        if (body.name) {
            const cleanName = body.name.trim();
            const cleanCategory = (body.category || "").trim();
            const cleanDescription = (body.description || "").trim();

            const q = query(
                collection(db, "products"),
                where("name", "==", cleanName),
                where("category", "==", cleanCategory),
                limit(1)
            );
            const existing = await getDocs(q);

            if (!existing.empty && existing.docs[0].id !== id) {
                const existingDoc = existing.docs[0].data();
                const existingDesc = (existingDoc.description || "").trim();
                if (existingDesc === cleanDescription) {
                    return NextResponse.json(
                        { error: "Product Name, Category, Description already exists." },
                        { status: 400 }
                    );
                }
            }
        }

        // ✅ Selling price validation
        const costPrice = body.cost_price !== undefined ? Number(body.cost_price) : undefined;
        const sellingPrice = body.sellingPrice !== undefined ? Number(body.sellingPrice) : body.selling_price !== undefined ? Number(body.selling_price) : undefined;

        if (costPrice !== undefined && sellingPrice !== undefined && sellingPrice < costPrice) {
            return NextResponse.json(
                { error: "Selling price must be greater than or equal to cost price." },
                { status: 400 }
            );
        }

        const updateData: any = { updatedAt: serverTimestamp() };

        if (body.name !== undefined) updateData.name = body.name.trim();
        if (body.description !== undefined) updateData.description = body.description;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.image !== undefined) updateData.image = body.image;
        if (body.isVisible !== undefined) updateData.isVisible = Boolean(body.isVisible);
        if (body.quantity !== undefined) updateData.quantity = Number(body.quantity);
        if (body.cost_price !== undefined) updateData.cost_price = Number(body.cost_price);
        if (sellingPrice !== undefined) updateData.selling_price = sellingPrice;

        const productRef = doc(db, "products", id);
        await updateDoc(productRef, updateData);

        return NextResponse.json({ message: "Product updated successfully." });

    } catch (error: any) {
        console.error("Firebase Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- DELETE: REMOVE PRODUCT ---
export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const id = body.id || body._id;
        if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });
        await deleteDoc(doc(db, "products", id));
        return NextResponse.json({ message: "Product purged." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}