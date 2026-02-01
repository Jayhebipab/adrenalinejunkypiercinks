import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch 
} from "firebase/firestore";
import { NextResponse } from "next/server";

// 1. GET: Fetch lahat ng Tattoo Entries
export async function GET() {
  try {
    // Pinalitan ang collection sa 'tattoo_gallery'
    const q = query(collection(db, "tattoo_gallery"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const tattoos = querySnapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
      
    return NextResponse.json(tattoos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Bulk Upload para sa Tattoos
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    const batch = writeBatch(db);
    const results: string[] = [];

    items.forEach((item) => {
      const { image, category, placement, artistId, artistName, artistImage } = item;
      
      const docRef = doc(collection(db, "tattoo_gallery"));
      
      batch.set(docRef, {
        image, 
        category: category || "Tattoo", // Default is Tattoo
        placement,
        artistId: artistId || null,
        artistName: artistName || "Unknown Artist",
        artistImage: artistImage || "",
        createdAt: serverTimestamp()
      });
      
      results.push(docRef.id);
    });

    await batch.commit();

    return NextResponse.json({ 
      message: `${results.length} tattoos saved successfully!`,
      ids: results 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Specific Tattoo Entry
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await deleteDoc(doc(db, "tattoo_gallery", id));
    return NextResponse.json({ message: "Tattoo deleted successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. PUT: Update Tattoo Details
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { _id, category, placement, artistId, artistName, artistImage } = body;

    if (!_id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const docRef = doc(db, "tattoo_gallery", _id);
    
    await updateDoc(docRef, { 
      category: category || "Tattoo",
      placement, 
      artistId, 
      artistName, 
      artistImage,
      updatedAt: serverTimestamp() 
    });

    return NextResponse.json({ message: "Tattoo updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}