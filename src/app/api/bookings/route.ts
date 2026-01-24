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
      preferredTime: time, // Idinagdag ang Oras sa DB
      service,
      message,
      image,
      status: "pending",
      website: "adrenalinjunky",
      timestamp: new Date(),
    };

    const result = await db.collection("bookings").insertOne(bookingData);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false }
    });

    // --- PROFESSIONAL ADMIN EMAIL ---
    const adminMailOptions = {
      from: `"Booking System" <${process.env.EMAIL_USER}>`,
      to: "jpablobscs@tfvc.edu.ph",
      subject: `🔥 NEW BOOKING: ${service.toUpperCase()} - ${name}`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; border: 1px solid #222;">
          <h2 style="color: #ea580c; text-transform: uppercase; letter-spacing: 2px;">New Request Received</h2>
          <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
          <p style="font-size: 16px;"><strong>Client:</strong> ${name}</p>
          <p style="font-size: 16px;"><strong>Service:</strong> ${service.toUpperCase()}</p>
          <p style="font-size: 16px;"><strong>Schedule:</strong> ${new Date(date).toDateString()} @ <span style="color: #ea580c;">${time}</span></p>
          <p style="font-size: 14px; color: #888; background: #1a1a1a; padding: 15px; border-radius: 8px;"><strong>Note:</strong> ${message}</p>
          <p style="font-size: 12px; color: #444; margin-top: 30px;">Ref ID: ${result.insertedId}</p>
        </div>
      `,
    };

    // --- LUXURY CUSTOMER EMAIL (Para Ma-enganyo Bumalik) ---
    const customerMailOptions = {
      from: `"Adrenalin Junky Piercinks" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Booking at Adrenalin Junky is being reviewed!`,
      html: `
        <div style="font-family: 'Helvetica', sans-serif; max-width: 600px; margin: auto; background: #ffffff; color: #000000; border: 1px solid #eeeeee;">
          <div style="background: #000; padding: 40px; text-align: center;">
            <h1 style="color: #ea580c; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 4px;">ADRENALIN JUNKY</h1>
            <p style="color: #fff; font-size: 12px; letter-spacing: 2px; margin-top: 5px;">PIERCINKS & TATTOO STUDIO</p>
          </div>
          <div style="padding: 40px; line-height: 1.6;">
            <h2 style="font-size: 20px;">Hi ${name},</h2>
            <p>Thank you for choosing <strong>Adrenalin Junky</strong>. We've received your request for a <strong>${service}</strong> session.</p>
            <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #ea580c; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(date).toDateString()}</p>
              <p style="margin: 5px 0;"><strong>Preferred Time:</strong> ${time}</p>
              <p style="margin: 5px 0;"><strong>Artist:</strong> ${artist}</p>
            </div>
            <p>Our team is currently reviewing the details. We'll reach out to you via call or text at <strong>${phone}</strong> shortly to confirm your slot.</p>
            <p>In the meantime, feel free to prepare your reference materials or check our latest works on social media.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">This is an automated acknowledgment of your request. No payment is required until the booking is confirmed.</p>
          </div>
        </div>
      `,
    };

    Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(customerMailOptions)
    ]).catch(err => console.error("Email Error:", err));

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    const result = await db.collection("bookings").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Deleted!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(dbName);
    await db.collection("bookings").updateOne({ _id: new ObjectId(id) }, { $set: { status: status } });
    return NextResponse.json({ message: "Status updated!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}