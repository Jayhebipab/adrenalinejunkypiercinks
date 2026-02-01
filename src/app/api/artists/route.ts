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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const docRef = doc(db, "artists", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
      } else {
        return NextResponse.json({ error: "Artist not found" }, { status: 404 });
      }
    }

    const q = query(collection(db, "artists"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const artists = querySnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    }));
    return NextResponse.json(artists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.profileImage) {
      return NextResponse.json({ error: "Profile image is required" }, { status: 400 });
    }

    const newArtist = {
      fullName: body.fullName || "Unnamed Artist",
      email: body.email || "",
      contactNumber: body.contactNumber || "",
      position: body.position || "",
      profileImage: body.profileImage,
      status: body.status || "active", 
      socials: {
        instagram: body.socials?.instagram || "",
        facebook: body.socials?.facebook || "",
      },
      artworks: body.artworks || [], 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "artists"), newArtist);
    return NextResponse.json({ id: docRef.id, message: "Artist registered!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Artist ID is required" }, { status: 400 });

    const docRef = doc(db, "artists", id);
    const updatedFields = {
      fullName: updateData.fullName,
      email: updateData.email,
      contactNumber: updateData.contactNumber,
      position: updateData.position,
      profileImage: updateData.profileImage,
      status: updateData.status || "active", 
      socials: {
        instagram: updateData.socials?.instagram || "",
        facebook: updateData.socials?.facebook || "",
      },
      artworks: updateData.artworks || [], 
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updatedFields);
    return NextResponse.json({ message: "Artist profile and portfolio synced!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
    await deleteDoc(doc(db, "artists", id));
    return NextResponse.json({ message: "Artist removed from the collective" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}