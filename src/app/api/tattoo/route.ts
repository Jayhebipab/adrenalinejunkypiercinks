import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) {
    client = new MongoClient(uri);
  }
  await client.connect();
  return client;
}

// 1. GET: Fetch all tattoos with artist profile image + name
export async function GET() {
  try {
    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const tattoos = await db.collection("tattoos").aggregate([
      {
        $lookup: {
          from: "artists",           // Join with artists collection
          localField: "artistId",     // tattoo.artistId is ObjectId
          foreignField: "_id",        // match against artists._id
          as: "artistDetails"
        }
      },
      {
        $unwind: {
          path: "$artistDetails",
          preserveNullAndEmptyArrays: true // show tattoo even if no artist match
        }
      },
      {
        $project: {
          image: 1,
          placement: 1,
          category: 1,
          createdAt: 1,
          updatedAt: 1,
          artistId: "$artistDetails._id",
          artistName: "$artistDetails.fullName",
          artistImage: "$artistDetails.profileImage"
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return NextResponse.json(tattoos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Save new tattoo with artistId
export async function POST(req: Request) {
  try {
    const { image, placement, category, artistId } = await req.json();
    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const newTattoo = {
      image,
      placement,
      category,
      artistId: artistId ? new ObjectId(artistId) : null, 
      createdAt: new Date()
    };

    const result = await db.collection("tattoos").insertOne(newTattoo);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. PUT: Update tattoo placement or reassign artist
export async function PUT(req: Request) {
  try {
    const { id, placement, artistId } = await req.json();
    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const updateData: any = { placement, updatedAt: new Date() };

    if (artistId) {
      updateData.artistId = new ObjectId(artistId);
    } else {
      updateData.artistId = null;
    }

    const result = await db.collection("tattoos").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Remove tattoo by ID
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("tattoos").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
