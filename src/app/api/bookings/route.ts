import { db } from "@/lib/firebase"; // Galing sa client config mo
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, getDoc
} from "firebase/firestore";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- CONFIG TRANSPORTER ---
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

// --- 1. GET ALL BOOKINGS ---
export async function GET() {
  try {
    const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. NEW BOOKING REQUEST (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, artist, date, time, service, message, images } = body;

    const bookingData = {
      name,
      email,
      phone,
      artist,
      preferredDate: date,
      preferredTime: time,
      service,
      message,
      images: Array.isArray(images) ? images : [], // Cloudinary URLs array
      status: "pending",
      website: "adrenalinejunky",
      timestamp: serverTimestamp(), // Gamit ang Firebase serverTimestamp
    };

    const docRef = await addDoc(collection(db, "bookings"), bookingData);

    // Email Confirmation
    const customerMailOptions = {
      from: `"Adrenaline Junky Piercinks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Booking at Adrenaline Junky is being reviewed!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee;">
          <div style="background: #000; padding: 20px; text-align: center;">
            <h1 style="color: #ea580c; text-transform: uppercase;">Adrenaline Junky</h1>
          </div>
          <div style="padding: 30px;">
            <h2>Hi ${name},</h2>
            <p>We've received your request for a <b>${service}</b>.</p>
            <p>Date: ${new Date(date).toDateString()}<br>Time: ${time}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(customerMailOptions);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. DELETE BOOKING ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    await deleteDoc(doc(db, "bookings", id));
    
    return NextResponse.json({ message: "Deleted!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 4. UPDATE STATUS (PATCH) ---
export async function PATCH(req: Request) {
  try {
    const { id, status, preferredDate, preferredTime } = await req.json();
    
    const docRef = doc(db, "bookings", id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = snap.data();

    const updateFields: any = { status: status };
    if (preferredDate) updateFields.preferredDate = preferredDate;
    if (preferredTime) updateFields.preferredTime = preferredTime;

    await updateDoc(docRef, updateFields);

    if (status === "approved") {
      const approvalMailOptions = {
        from: `"Adrenaline Junky Piercinks" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `🔥 CONFIRMED: Your session at Adrenaline Junky is set!`,
        html: `<h2>Hi ${booking.name}, Your session is APPROVED!</h2>`,
      };
      await transporter.sendMail(approvalMailOptions);
    }

    return NextResponse.json({ message: "Status updated!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}