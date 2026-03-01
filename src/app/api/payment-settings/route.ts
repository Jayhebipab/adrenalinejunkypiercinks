import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, query, limit } from "firebase/firestore";
import { NextResponse } from "next/server";

const DOC_REF = doc(db, "payment_settings", "current_settings");

// ─── GET: Fetch all payment methods ──────────────────────────────────────────
export async function GET() {
  try {
    const snap = await getDoc(DOC_REF);

    // Legacy support: kung nag-migrate from old flat structure
    if (!snap.exists()) {
      return NextResponse.json({ methods: [] });
    }

    const data = snap.data();

    // If old format pa (gcash_name, bpi_name etc), auto-migrate to array
    if (!data.methods && (data.gcash_name || data.bpi_name)) {
      const migrated = [];
      if (data.gcash_name || data.gcash_number || data.gcash_qr) {
        migrated.push({
          id: "gcash_legacy",
          type: "GCash",
          icon: "gcash",
          name: data.gcash_name || "",
          number: data.gcash_number || "",
          qr: data.gcash_qr || "",
        });
      }
      if (data.bpi_name || data.bpi_number || data.bpi_qr) {
        migrated.push({
          id: "bpi_legacy",
          type: "BPI Bank",
          icon: "bank",
          name: data.bpi_name || "",
          number: data.bpi_number || "",
          qr: data.bpi_qr || "",
        });
      }
      return NextResponse.json({ methods: migrated });
    }

    return NextResponse.json({ methods: data.methods || [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// ─── POST: Add a new payment method ──────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, icon, name, number, qr } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required." }, { status: 400 });
    }

    const snap = await getDoc(DOC_REF);
    const existing = snap.exists() ? (snap.data().methods || []) : [];

    const newMethod = {
      id: `method_${Date.now()}`,
      type,
      icon: icon || "wallet",
      name,
      number: number || "",
      qr: qr || "",
      createdAt: new Date().toISOString(),
    };

    await setDoc(DOC_REF, { methods: [...existing, newMethod], updatedAt: new Date().toISOString() }, { merge: true });

    return NextResponse.json({ message: "Payment method added.", method: newMethod }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add payment method." }, { status: 500 });
  }
}

// ─── PATCH: Update an existing payment method by id ──────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, type, icon, name, number, qr } = body;

    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    const snap = await getDoc(DOC_REF);
    if (!snap.exists()) return NextResponse.json({ error: "Settings not found." }, { status: 404 });

    const methods: any[] = snap.data().methods || [];
    const idx = methods.findIndex((m: any) => m.id === id);
    if (idx === -1) return NextResponse.json({ error: "Method not found." }, { status: 404 });

    methods[idx] = {
      ...methods[idx],
      ...(type   !== undefined && { type }),
      ...(icon   !== undefined && { icon }),
      ...(name   !== undefined && { name }),
      ...(number !== undefined && { number }),
      ...(qr     !== undefined && { qr }),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(DOC_REF, { methods, updatedAt: new Date().toISOString() });

    return NextResponse.json({ message: "Payment method updated.", method: methods[idx] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment method." }, { status: 500 });
  }
}

// ─── DELETE: Remove a payment method by id ───────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

    const snap = await getDoc(DOC_REF);
    if (!snap.exists()) return NextResponse.json({ error: "Settings not found." }, { status: 404 });

    const methods: any[] = snap.data().methods || [];
    const filtered = methods.filter((m: any) => m.id !== id);

    if (filtered.length === methods.length) {
      return NextResponse.json({ error: "Method not found." }, { status: 404 });
    }

    await updateDoc(DOC_REF, { methods: filtered, updatedAt: new Date().toISOString() });

    return NextResponse.json({ message: "Payment method deleted." });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment method." }, { status: 500 });
  }
}