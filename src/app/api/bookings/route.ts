import { db } from "@/lib/firebase";
import { 
  collection, getDocs, addDoc, deleteDoc, 
  updateDoc, doc, query, orderBy, serverTimestamp, getDoc, increment, where 
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    let q;
    if (email) {
      // INALIS ang orderBy dito para iwas 500 error (Firestore Index requirement)
      q = query(
        collection(db, "bookings"), 
        where("email", "==", email)
      );
    } else {
      q = query(collection(db, "bookings"), orderBy("timestamp", "desc"));
    }

    const snapshot = await getDocs(q);
    
    // I-map ang data at i-convert ang timestamps
    const bookings = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // I-convert ang preferredDate kung ito ay Firestore Timestamp
      let displayDate = data.preferredDate;
      if (data.preferredDate && typeof data.preferredDate.toDate === 'function') {
        displayDate = data.preferredDate.toDate().toLocaleDateString();
      } else if (data.preferredDate?.seconds) {
        displayDate = new Date(data.preferredDate.seconds * 1000).toLocaleDateString();
      }

      return { 
        id: doc.id, 
        ...data,
        // Eto yung gagamitin sa frontend mo {b.date} at {b.time}
        date: displayDate || "No Date",
        time: data.preferredTime || "No Time",
        // I-save ang raw seconds para sa manual sorting mamaya
        sortTimestamp: data.timestamp?.seconds || 0
      };
    });

    // MANUAL SORTING: Dahil tinanggal natin ang orderBy sa query, 
    // tayo na ang mag-aayos dito (Latest first)
    bookings.sort((a, b) => b.sortTimestamp - a.sortTimestamp);

    // Ibalik ang tamang format base sa request
    if (email) {
      return NextResponse.json(bookings); // Array para sa Portal
    }
    
    return NextResponse.json({ bookings }); // Object para sa Admin
  } catch (error: any) {
    console.error("GET Error:", error);
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

// --- 4. UPDATE STATUS (With Decline Reason Support) ---
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, 
      status, 
      preferredDate, 
      preferredTime, 
      finalPrice, 
      inventoryUsed, 
      artist,
      declineReason // <--- Dito natin kukunin yung comment mula sa frontend
    } = body;
    
    const docRef = doc(db, "bookings", id);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const booking = snap.data();
    const updateFields: any = { status };

    if (preferredDate) updateFields.preferredDate = preferredDate;
    if (preferredTime) updateFields.preferredTime = preferredTime;
    
    // I-save ang reason sa Firestore kung meron
    if (declineReason) updateFields.declineReason = declineReason;

    // --- LOGIC FOR DECLINED ---
    if (status === "declined") {
      const declineContent = `
        <p style="font-size: 18px; color: #ef4444; font-weight: bold;">APPOINTMENT DECLINED</p>
        <p>We're sorry, but your appointment for <strong>${booking.service.toUpperCase()}</strong> could not be accepted at this time.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; font-size: 10px; color: #ef4444; letter-spacing: 2px; font-weight: bold;">REASON FROM STUDIO</p>
          <p style="margin: 10px 0 0 0; color: #1a1a1a; font-style: italic;">
            "${declineReason || "No specific reason provided. Please contact the studio for more details."}"
          </p>
        </div>
        
        <p style="font-size: 12px; color: #666;">You can try booking another schedule or contact us at our social media pages.</p>
      `;

      await transporter.sendMail({
        from: `"ADRENALINE JUNKY" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `❌ DECLINED: Appointment Request`,
        html: getEmailTemplate(booking.name, declineContent),
      });
    }

    // --- LOGIC FOR FINISHED (Inventory subtraction) ---
    if (status === "finished") {
      updateFields.artist = artist;
      updateFields.finalPrice = Number(finalPrice);
      updateFields.inventoryUsed = inventoryUsed; 
      updateFields.finishedAt = serverTimestamp();

      if (Array.isArray(inventoryUsed)) {
        for (const item of inventoryUsed) {
          const productsRef = collection(db, "products");
          const q = query(productsRef, where("name", "==", item.name));
          const querySnapshot = await getDocs(q);
          
          for (const productDoc of querySnapshot.docs) {
            const productRef = doc(db, "products", productDoc.id);
            await updateDoc(productRef, {
              quantity: increment(-item.quantity) 
            });
          }
        }
      }
    }

    // --- LOGIC FOR APPROVED ---
    if (status === "approved") {
      const approvalContent = `
        <p style="font-size: 18px; color: #ea580c; font-weight: bold;">SESSION CONFIRMED!</p>
        <p>Your appointment for <strong>${booking.service.toUpperCase()}</strong> has been approved.</p>
        <div style="background: #000; color: #fff; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; font-size: 10px; color: #ea580c; letter-spacing: 2px;">SCHEDULE</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">
            ${new Date(updateFields.preferredDate || booking.preferredDate).toDateString()} @ ${updateFields.preferredTime || booking.preferredTime}
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"ADRENALINE JUNKY" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `🔥 CONFIRMED: ${booking.service.toUpperCase()}`,
        html: getEmailTemplate(booking.name, approvalContent),
      });
    }

    // --- LOGIC FOR ADJUSTED ---
    if (status === "adjusted") {
      const adjustmentContent = `
        <p style="font-size: 18px; color: #3b82f6; font-weight: bold;">SCHEDULE ADJUSTED!</p>
        <p>Your appointment for <strong>${booking.service.toUpperCase()}</strong> has been updated to a new schedule.</p>
        <div style="background: #111; color: #fff; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; font-size: 10px; color: #3b82f6; letter-spacing: 2px;">NEW SCHEDULE</p>
          <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">
            ${new Date(updateFields.preferredDate).toDateString()} @ ${updateFields.preferredTime}
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"ADRENALINE JUNKY" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `🕒 SCHEDULE UPDATED: ${booking.service.toUpperCase()}`,
        html: getEmailTemplate(booking.name, adjustmentContent),
      });
    }

    // Isang bagsakang update sa Firestore
    await updateDoc(docRef, updateFields);

    return NextResponse.json({ message: "Update successful!" });
  } catch (error: any) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}