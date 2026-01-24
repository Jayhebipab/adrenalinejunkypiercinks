import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/mongodb";

const WEBSITE_IDENTIFIER = "adrenalinjunky";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, service, message } = body;

    if (!name || !email || !service || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. SAVE TO MONGODB (Para lumitaw sa Messenger Component)
    await connectToDatabase();
    const mongoose = (global as any).mongoose.conn;
    await mongoose.connection.db.collection("chats").insertOne({
      senderEmail: email,
      senderName: name,
      message: `[SERVICE: ${service.toUpperCase()}] ${message}`,
      isAdmin: false, // User ang nag-send
      website: WEBSITE_IDENTIFIER,
      timestamp: new Date()
    });

    // 2. NODEMAILER TRANSPORTER
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false }
    });

    // 3. SEND EMAILS (Admin & Customer)
    const mailOptions = {
      from: `"Adrenalin Junky" <${process.env.EMAIL_USER}>`,
      to: "jpablobscs@tfvc.edu.ph",
      subject: `NEW INQUIRY: ${service.toUpperCase()} - ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET & DELETE (Maintain for compatibility)
export async function GET() {
  return NextResponse.json({ message: "Use /api/chats for unified fetching" });
}