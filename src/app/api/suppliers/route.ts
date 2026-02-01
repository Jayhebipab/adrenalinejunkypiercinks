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

const COLLECTION_NAME = "suppliers";

// --- 1. GET: Kunin lahat (Sorted by Latest) ---
export async function GET() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. POST: Mag-add (With Triple Duplicate Check) ---
export async function POST(req: Request) {
  try {
    const { name, company_name, address, contact } = await req.json();
    const suppliersRef = collection(db, COLLECTION_NAME);

    // Check Company Name
    const qName = query(suppliersRef, where("company_name", "==", company_name));
    const snapName = await getDocs(qName);
    if (!snapName.empty) return NextResponse.json({ error: "Company name already exists" }, { status: 400 });

    // Check Contact
    const qContact = query(suppliersRef, where("contact", "==", contact));
    const snapContact = await getDocs(qContact);
    if (!snapContact.empty) return NextResponse.json({ error: "Contact number already used by another supplier" }, { status: 400 });

    // Check Address
    const qAddress = query(suppliersRef, where("address", "==", address));
    const snapAddress = await getDocs(qAddress);
    if (!snapAddress.empty) return NextResponse.json({ error: "This address is already registered" }, { status: 400 });

    const newDoc = await addDoc(suppliersRef, {
      name, company_name, address, contact,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ id: newDoc.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. PUT: Mag-update (With Exclusion Duplicate Check) ---
export async function PUT(req: Request) {
  try {
    const { id, name, company_name, address, contact } = await req.json();
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    const currentData = docSnap.data();
    const suppliersRef = collection(db, COLLECTION_NAME);

    // Validation logic: Check kung nagbago at kung taken na ng iba
    if (company_name && company_name !== currentData.company_name) {
      const q = query(suppliersRef, where("company_name", "==", company_name));
      if (!(await getDocs(q)).empty) return NextResponse.json({ error: "New company name is already taken" }, { status: 400 });
    }

    if (contact && contact !== currentData.contact) {
      const q = query(suppliersRef, where("contact", "==", contact));
      if (!(await getDocs(q)).empty) return NextResponse.json({ error: "New contact is already in use" }, { status: 400 });
    }

    if (address && address !== currentData.address) {
      const q = query(suppliersRef, where("address", "==", address));
      if (!(await getDocs(q)).empty) return NextResponse.json({ error: "Address is already registered to another company" }, { status: 400 });
    }

    await updateDoc(docRef, {
      name, company_name, address, contact,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ message: "Updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 4. DELETE: Magbura ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}