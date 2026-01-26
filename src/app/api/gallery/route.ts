import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) {
    client = new MongoClient(uri);
  }
  return client;
}

// 1. GET: Kunin lahat ng photos (kasama na artist details)
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    
    // Naka-sort pa rin sa pinakabago
    const photos = await db.collection("gallery")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(photos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Mag-save ng image, category, placement, at Artist Info
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      image, 
      category, 
      placement, 
      artistId, 
      artistName, 
      artistImage 
    } = body;

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    // Dito natin bubuuin yung document para sa DB
    const newEntry = {
      image,
      category,
      placement,
      // Idinagdag natin ang mga 'to par para sa mapping mamaya
      artistId: artistId ? new ObjectId(artistId) : null, 
      artistName: artistName || "Unknown Artist",
      artistImage: artistImage || "",
      createdAt: new Date()
    };

    const result = await db.collection("gallery").insertOne(newEntry);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. DELETE: Burahin ang image gamit ang ID
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json(); 
    
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("gallery").deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Successfully deleted!" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. PUT: I-update ang details ng isang gallery item
export async function PUT(req: Request) {
  try {
    const { id, placement, artistId, artistName, artistImage } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("gallery").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          placement, 
          artistId: new ObjectId(artistId), 
          artistName, 
          artistImage,
          updatedAt: new Date() 
        } 
      }
    );

    return NextResponse.json({ message: "Updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}