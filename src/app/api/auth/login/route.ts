import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
    if (!uri) throw new Error("MONGODB_URI is not defined");
    if (!client) client = new MongoClient(uri);
    return client;
}

export async function POST(req: Request) {
    try {
        const { email, password, pin, isVaultMode } = await req.json();
        const mongoClient = await getClient();
        await mongoClient.connect();
        const db = mongoClient.db("adrenalinjunkypiercinks");

        let user;

        if (isVaultMode) {
            user = await db.collection("users").findOne({ role: "Super Admin" });
            if (!user) return NextResponse.json({ error: "Root User not found" }, { status: 404 });
            
            const pinMatch = await bcrypt.compare(pin, user.systemPIN);
            if (!pinMatch) return NextResponse.json({ error: "Invalid Master PIN" }, { status: 401 });
        } else {
            user = await db.collection("users").findOne({ email });
            if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
            
            const passMatch = await bcrypt.compare(password, user.password);
            if (!passMatch) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
        }

        const { password: _, systemPIN: __, ...userSafeData } = user;
        const response = NextResponse.json({ message: "Success", user: userSafeData });

        // IMPORTANT FIX: secure: false muna para sa localhost
        response.cookies.set("auth_token", "active_session", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;

    } catch (error: any) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}