import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

// 1. GET ALL OR SINGLE BLOG
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // FETCH SINGLE POST (Para sa blog/[id]/page.tsx)
    if (id) {
      const docRef = doc(db, "blogs", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return NextResponse.json({ 
          id: docSnap.id, 
          ...docSnap.data() 
        });
      } else {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }
    }

    // FETCH ALL POSTS (Para sa Admin at Blog List)
    const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const blogs = querySnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));
    
    return NextResponse.json(blogs);
  } catch (error: any) {
    console.error("Firebase GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST NEW BLOG
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // validation check para iwas empty src error sa frontend
    if (!body.image || !body.title) {
      return NextResponse.json({ error: "Kulang ng Image o Title, par!" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "blogs"), {
      title: body.title,
      image: body.image, 
      category: body.category || "Tattoo Culture",
      content: body.content || "",
      slug: body.slug || "",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, message: "New story published!" }, { status: 201 });
  } catch (error: any) {
    console.error("Firebase POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. UPDATE EXISTING BLOG
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    const docRef = doc(db, "blogs", id);
    
    // Clean update data (alisin ang id field para hindi ma-save sa loob ng fields)
    const { id: _, ...cleanData } = updateData;

    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Updated successfully!" });
  } catch (error: any) {
    console.error("Firebase PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE BLOG
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    
    await deleteDoc(doc(db, "blogs", id));
    return NextResponse.json({ message: "Deleted successfully!" });
  } catch (error: any) {
    console.error("Firebase DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}