import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
const DB_NAME = "adrenalinjunkypiercinks";
const COLLECTION_NAME = "artists";

let client: MongoClient | null = null;
async function getDb() {
    if (!uri) throw new Error("MONGODB_URI is not defined in .env");
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    return client.db(DB_NAME);
}

// --- GET: Kunin lahat ng Artists ---
export async function GET() {
    try {
        const db = await getDb();
        const artists = await db.collection(COLLECTION_NAME)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
            
        return NextResponse.json(artists);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: New Artist Registration ---
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const db = await getDb();

        const newArtist = {
            fullName: body.fullName || "Unnamed Artist",
            email: body.email || "",
            contactNumber: body.contactNumber || "",
            position: body.position || "",
            profileImage: body.profileImage || "",
            // Heto yung bagong status field par
            status: body.status || "active", 
            socials: {
                instagram: body.socials?.instagram || "",
                facebook: body.socials?.facebook || "",
            },
            artworks: body.artworks || [], 
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection(COLLECTION_NAME).insertOne(newArtist);
        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- PUT: Full Update (Profile + Status + Portfolio) ---
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const db = await getDb();

        const updatedFields = {
            fullName: updateData.fullName,
            email: updateData.email,
            contactNumber: updateData.contactNumber,
            position: updateData.position,
            profileImage: updateData.profileImage,
            // Sinasalo na rin dito yung toggle ng active/inactive
            status: updateData.status || "active", 
            socials: {
                instagram: updateData.socials?.instagram || "",
                facebook: updateData.socials?.facebook || "",
            },
            artworks: updateData.artworks || [], 
            updatedAt: new Date()
        };

        const result = await db.collection(COLLECTION_NAME).updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedFields }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Artist not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Artist data and status synced!" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- DELETE: Permanent Removal ---
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const db = await getDb();
        const result = await db.collection(COLLECTION_NAME).deleteOne({ 
            _id: new ObjectId(id) 
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Artist not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Artist removed from database" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}