import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const uri = process.env.MONGODB_URI;
const dbName = "adrenalinjunkypiercinks";
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) client = new MongoClient(uri);
  return client;
}

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
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    const bookings = await db.collection("bookings").find({}).sort({ timestamp: -1 }).toArray();
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 2. NEW BOOKING REQUEST (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, artist, date, time, service, message, image } = body;

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(dbName);

    const bookingData = {
      name,
      email,
      phone,
      artist,
      preferredDate: date,
      preferredTime: time,
      service,
      message,
      image,
      status: "pending",
      website: "adrenalinejunky",
      timestamp: new Date(),
    };

    const result = await db.collection("bookings").insertOne(bookingData);

    // Initial Confirmation for Customer
    const customerMailOptions = {
      from: `"Adrenaline Junky Piercinks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Booking at Adrenaline Junky is being reviewed!`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: auto; background: #ffffff; color: #000000; border: 1px solid #eeeeee;">
          <div style="background: #000; padding: 40px; text-align: center;">
            <h1 style="color: #ea580c; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 4px;">ADRENALINE JUNKY</h1>
          </div>
          <div style="padding: 40px;">
            <h2>Hi ${name},</h2>
            <p>We've received your request for a <strong>${service}</strong> session. Our team is currently reviewing the details.</p>
            <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #ea580c;">
              <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>We'll notify you once your slot is confirmed!</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(customerMailOptions);

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. DELETE BOOKING ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    await db.collection("bookings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Deleted!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 4. UPDATE STATUS & SEND APPROVAL EMAIL (PATCH) ---
export async function PATCH(req: Request) {
  try {
    const { id, status, preferredDate, preferredTime } = await req.json();
    
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(dbName);

    // Find the booking first to get user details
    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Build update object
    const updateFields: any = { status: status };
    if (preferredDate) updateFields.preferredDate = preferredDate;
    if (preferredTime) updateFields.preferredTime = preferredTime;

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    // KUNG APPROVED: Send notification email
    if (status === "approved") {
      const approvalMailOptions = {
        from: `"Adrenaline Junky Piercinks" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `🔥 CONFIRMED: Your session at Adrenaline Junky is set!`,
        html: `
          <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: auto; background: #ffffff; color: #000000; border: 10px solid #000000;">
            <div style="background: #000; padding: 40px; text-align: center;">
              <h1 style="color: #ea580c; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 5px;">SESSION CONFIRMED</h1>
              <p style="color: #fff; font-size: 10px; letter-spacing: 3px; margin-top: 5px;">GET READY TO GET INKED</p>
            </div>
            <div style="padding: 40px; line-height: 1.6;">
              <h2 style="font-size: 22px; text-transform: uppercase;">Hi ${booking.name},</h2>
              <p>Great news! Your booking has been <strong>APPROVED</strong>. Your slot is officially locked in.</p>
              
              <div style="background: #f4f4f4; padding: 25px; border-left: 6px solid #ea580c; margin: 25px 0;">
                <p style="margin: 5px 0;"><strong>SERVICE:</strong> ${booking.service.toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>DATE:</strong> ${new Date(preferredDate || booking.preferredDate).toDateString()}</p>
                <p style="margin: 5px 0;"><strong>TIME:</strong> <span style="color: #ea580c; font-weight: bold;">${preferredTime || booking.preferredTime}</span></p>
                <p style="margin: 5px 0;"><strong>ARTIST:</strong> ${booking.artist}</p>
              </div>

              <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 30px;">Important Notes:</h3>
              <ul style="font-size: 13px; color: #333;">
                <li>Please arrive 15 minutes before your schedule.</li>
                <li>Make sure you have eaten properly before the session.</li>
                <li>Rescheduling must be done 48 hours in advance.</li>
              </ul>

              <p style="margin-top: 30px; font-weight: bold; text-align: center; text-transform: uppercase;">See you at the studio!</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(approvalMailOptions);
    }

    return NextResponse.json({ message: "Status updated and email sent!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}