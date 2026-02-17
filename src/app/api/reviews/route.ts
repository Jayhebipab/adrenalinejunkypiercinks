import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, stars, description, userEmail, userImage, reviewImage } = body;

    if (!description || !stars) {
      return NextResponse.json({ error: "Required fields missing!" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "reviews"), {
      name: name || "Anonymous User",
      stars: Number(stars),
      description,
      userEmail: userEmail || "",
      userImage: userImage || "",
      reviewImage: reviewImage || "", // This is the URL from your Cloudinary helper
      isVisible: false,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, message: "Review Saved!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. UPDATE REVIEW (Para sa Hide/Show Toggle)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, isVisible } = body;

    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

    const docRef = doc(db, "reviews", id);
    
    await updateDoc(docRef, {
      isVisible: isVisible,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: "Review status updated!" });
  } catch (error: any) {
    console.error("Firebase PUT Review Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE REVIEW
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    
    await deleteDoc(doc(db, "reviews", id));
    return NextResponse.json({ message: "Review deleted permanently!" });
  } catch (error: any) {
    console.error("Firebase DELETE Review Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}