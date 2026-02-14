import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, getDoc, increment 
} from "firebase/firestore";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

// --- HELPER: BRANDED EMAIL TEMPLATE ---
const getEmailTemplate = (name: string, content: string) => `
  <div style="background-color: #f4f4f4; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #000000; padding: 30px; text-align: center;">
        <img src="https://res.cloudinary.com/diwrwmjgw/image/upload/v1770200378/pic4_oxfpnf.png" alt="Adrenaline Junky" style="width: 120px; height: auto;">
        <p style="color: #ea580c; font-size: 10px; letter-spacing: 4px; font-weight: bold; margin-top: 10px; text-transform: uppercase;">Piercinks & Tattoo Studio</p>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; border-left: 4px solid #ea580c; padding-left: 15px; margin-bottom: 30px;">
          Hi ${name},
        </h2>
        <div style="line-height: 1.6; font-size: 14px; color: #444;">
          ${content}
        </div>
      </div>
    </div>
  </div>
`;

// --- 1. GET ALL BOOKINGS ---
export async function GET() {
  try {
    const q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. NEW BOOKING REQUEST ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, artist, date, time, service, message, images } = body;

    const bookingData = {
      name, email, phone, artist,
      preferredDate: date, preferredTime: time,
      service, message, 
      images: Array.isArray(images) ? images : [],
      status: "pending",
      website: "adrenalinejunky",
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "bookings"), bookingData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. DELETE BOOKING ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await deleteDoc(doc(db, "bookings", id));
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 4. UPDATE STATUS (Strictly Bookings Only) ---
export async function PATCH(req: Request) {
  try {
    const { 
      id, 
      status, 
      preferredDate, 
      preferredTime, 
      finalPrice, 
      inventoryUsed, 
      artist 
    } = await req.json();
    
    const docRef = doc(db, "bookings", id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const booking = snap.data();
    const updateFields: any = { status };

    if (preferredDate) updateFields.preferredDate = preferredDate;
    if (preferredTime) updateFields.preferredTime = preferredTime;

    // --- CASE: FINISHED ---
    if (status === "finished") {
      updateFields.artist = artist;
      updateFields.finalPrice = Number(finalPrice);
      updateFields.inventoryUsed = inventoryUsed; // Array ng materials
      updateFields.finishedAt = serverTimestamp();

      // AUTOMATIC INVENTORY DEDUCTION
      // Hahanapin natin yung bawat product sa inventory at babawasan ang stock
      if (Array.isArray(inventoryUsed)) {
        for (const item of inventoryUsed) {
          // Note: Ang 'item.name' ay dapat match sa name sa 'products' collection
          const productsRef = collection(db, "products");
          const q = query(productsRef);
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach(async (productDoc) => {
            if (productDoc.data().name === item.name) {
              const productRef = doc(db, "products", productDoc.id);
              await updateDoc(productRef, {
                // Babawasan ang quantity. Kung 'stock' ang field name mo, palitan ito.
                quantity: increment(-item.quantity) 
              });
            }
          });
        }
      }
      // PINALITAN: Inalis ang logic na nag-a-addDoc sa "promos" collection.
    }

    // UPDATE MAIN DOCUMENT
    await updateDoc(docRef, updateFields);

    // --- CASE: APPROVED (Email Notification) ---
    if (status === "approved") {
      const approvalContent = `
        <p style="font-size: 18px; color: #ea580c; font-weight: bold;">SESSION CONFIRMED!</p>
        <p>Your appointment for <strong>${booking.service.toUpperCase()}</strong> has been approved.</p>
        <div style="background: #000; color: #fff; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-size: 10px; color: #ea580c; letter-spacing: 2px;">SCHEDULE</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">${new Date(booking.preferredDate).toDateString()} @ ${booking.preferredTime}</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"ADRENALINE JUNKY" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `🔥 CONFIRMED: ${booking.service.toUpperCase()}`,
        html: getEmailTemplate(booking.name, approvalContent),
      });
    }

    return NextResponse.json({ message: "Booking updated and inventory adjusted!" });
  } catch (error: any) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}