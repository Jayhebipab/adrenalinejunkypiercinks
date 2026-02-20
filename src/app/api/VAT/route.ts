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
  where, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { NextResponse } from "next/server";

const VATS_COLLECTION = "vats";

export async function GET() {
  try {
    // Kunin lang muna lahat ng documents sa collection
    const querySnapshot = await getDocs(collection(db, VATS_COLLECTION));
    
    const vats = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // Kung walang laman, fallback sa 0
    if (vats.length === 0) {
      return NextResponse.json([{ percentage: 0 }]);
    }

    // I-sort na lang natin manually dito sa array para iwas Index error sa Firebase
    const sortedVats = vats.sort((a: any, b: any) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

    return NextResponse.json(sortedVats);
  } catch (error: any) {
    console.error("VAT API Error:", error);
    return NextResponse.json({ error: "Failed to fetch VAT" }, { status: 500 });
  }
}

// --- 2. POST: Mag-add ng bagong VAT (With Validation) ---
export async function POST(req: Request) {
  try {
    const { vat_name, percentage } = await req.json();

    // Basic range validation
    if (percentage < 1 || percentage > 99) {
      return NextResponse.json({ error: "Percentage must be between 1 and 99" }, { status: 400 });
    }

    // CHECK DUPLICATE: Bawal ang magkaparehong vat_name
    const vatsRef = collection(db, VATS_COLLECTION);
    const q = query(vatsRef, where("vat_name", "==", vat_name));
    const duplicateCheck = await getDocs(q);

    if (!duplicateCheck.empty) {
      return NextResponse.json({ error: `VAT name '${vat_name}' already exists.` }, { status: 400 });
    }

    const newVat = {
      vat_name,
      percentage: Number(percentage),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, VATS_COLLECTION), newVat);
    return NextResponse.json({ id: docRef.id, message: "VAT Created" }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. PUT: Mag-update ng VAT (With Duplicate Name Protection) ---
export async function PUT(req: Request) {
  try {
    const { id, vat_name, percentage } = await req.json();

    if (percentage < 1 || percentage > 99) {
      return NextResponse.json({ error: "Percentage must be between 1 and 99" }, { status: 400 });
    }

    const docRef = doc(db, VATS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "VAT record not found" }, { status: 404 });
    }

    const currentData = docSnap.data();

    // CHECK DUPLICATE: Kung nagbago ang pangalan, check kung may kapareho sa iba
    if (vat_name && vat_name !== currentData.vat_name) {
      const vatsRef = collection(db, VATS_COLLECTION);
      const q = query(vatsRef, where("vat_name", "==", vat_name));
      const duplicateCheck = await getDocs(q);
      
      if (!duplicateCheck.empty) {
        return NextResponse.json({ error: "Another VAT record is already using that name." }, { status: 400 });
      }
    }

    await updateDoc(docRef, {
      vat_name,
      percentage: Number(percentage),
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: "VAT Updated successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 4. DELETE: Magbura ng VAT ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await deleteDoc(doc(db, VATS_COLLECTION, id));
    return NextResponse.json({ message: "VAT Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}