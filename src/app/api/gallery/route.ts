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
  serverTimestamp,
  writeBatch // Gagamit tayo nito para sa mass upload
} from "firebase/firestore";
import { NextResponse } from "next/server";

// 1. GET: Same logic, fetch lahat
export async function GET() {
  try {
    const q = query(collection(db, "piercing_gallery"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const piercings = querySnapshot.docs.map(doc => ({
      _id: doc.id, // Ginawa nating _id para match sa frontend mo kanina
      ...doc.data()
    }));
      
    return NextResponse.json(piercings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: In-update para sa Bulk/Multiple Images
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Check kung array ang dumating (maramihan) o isa lang
    const items = Array.isArray(body) ? body : [body];
    const batch = writeBatch(db);
    const results: string[] = [];

    items.forEach((item) => {
      const { image, category, placement, artistId, artistName, artistImage } = item;
      
      // Gawa tayo ng bagong document reference para sa bawat image
      const docRef = doc(collection(db, "piercing_gallery"));
      
      batch.set(docRef, {
        image, // Cloudinary URL
        category: category || "Piercing",
        placement,
        artistId: artistId || null,
        artistName: artistName || "Unknown Piercer",
        artistImage: artistImage || "",
        createdAt: serverTimestamp()
      });
      
      results.push(docRef.id);
    });

    // Isang transaction lang sa Firebase para tipid sa request
    await batch.commit();

    return NextResponse.json({ 
      message: `${results.length} items saved successfully!`,
      ids: results 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// 3. DELETE: Kukunin natin ang ID sa URL (Search Params)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // Match na ito sa ?id=... ng frontend

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await deleteDoc(doc(db, "piercing_gallery", id));
    return NextResponse.json({ message: "Deleted from Firebase!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. PUT: Siguraduhin na _id ang gagamitin
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    // Ginamit natin ang _id dahil yun ang property name sa frontend mo
    const { _id, category, placement, artistId, artistName, artistImage } = body;

    if (!_id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const docRef = doc(db, "piercing_gallery", _id);
    
    await updateDoc(docRef, { 
      category: category || "Piercing",
      placement, 
      artistId, 
      artistName, 
      artistImage,
      updatedAt: serverTimestamp() 
    });

    return NextResponse.json({ message: "Updated successfully!" });
  } catch (error: any) {
    console.error("Firebase Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
