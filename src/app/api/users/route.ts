import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getDb() {
    if (!uri) throw new Error("MONGODB_URI is not defined");
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    return client.db("adrenalinjunkypiercinks");
}

// 1. GET: Fetch all users (Excluding sensitive data)
export async function GET() {
    try {
        const db = await getDb();
        const users = await db.collection("users")
            .find({})
            .project({ password: 0, systemPIN: 0 })
            .toArray();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// 2. POST: Register new personnel
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, email, password, role, contact, systemPIN } = body;
        const db = await getDb();

        const existing = await db.collection("users").findOne({ email });
        if (existing) return NextResponse.json({ error: "Email exists" }, { status: 400 });

        const hashedPassword = await bcrypt.hash(password, 10);
        let hashedPin = "";
        if (role === "Super Admin" && systemPIN) {
            hashedPin = await bcrypt.hash(systemPIN, 10);
        }

        const newUser = {
            username, email, role, contact,
            password: hashedPassword,
            systemPIN: hashedPin,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            createdAt: new Date()
        };

        await db.collection("users").insertOne(newUser);
        return NextResponse.json({ message: "Created" });
    } catch (error) {
        return NextResponse.json({ error: "Post failed" }, { status: 500 });
    }
}
// --- 3. PUT: PARA SA UPDATE AT SECURITY VERIFICATION ---
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, isVerifying, currentPassword, systemPIN, username, contact, newPassword, newSystemPIN } = body;
        
        const db = await getDb();
        const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // --- SECURITY BYPASS (ROOT AUTH) ---
        if (isVerifying) {
            // I-check ang password
            const passMatch = currentPassword ? await bcrypt.compare(currentPassword, user.password) : false;
            
            // I-check ang PIN
            const pinMatch = systemPIN ? await bcrypt.compare(systemPIN, user.systemPIN || "") : false;

            // "OR" LOGIC: Basta isa sa kanila ang tumama, papasok na.
            if (passMatch || pinMatch) {
                return NextResponse.json({ message: "Root Access Granted" });
            }
            
            return NextResponse.json({ error: "Security Bypass Failed: Invalid Credentials" }, { status: 401 });
        }

        // --- ACTUAL UPDATE LOGIC ---
        const updateFields: any = {};
        if (username) updateFields.username = username;
        if (contact) updateFields.contact = contact;
        if (newPassword) updateFields.password = await bcrypt.hash(newPassword, 10);
        if (newSystemPIN) updateFields.systemPIN = await bcrypt.hash(newSystemPIN, 10);

        await db.collection("users").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        return NextResponse.json({ message: "Updated successfully" });

    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// 4. DELETE: Remove personnel (Protection for Super Admin included)
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const db = await getDb();
        
        // Anti-delete protection para sa Super Admin
        const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
        if (user?.role === "Super Admin") {
            return NextResponse.json({ error: "Root user cannot be deleted" }, { status: 403 });
        }

        await db.collection("users").deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}