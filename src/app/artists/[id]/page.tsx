import { MongoClient, ObjectId } from "mongodb";
import Image from "next/image";
import { notFound } from "next/navigation";

// I-update natin ang function para tumanggap ng string na sigurado
async function getArtistData(id: string) {
  if (!id) return null; // Safety check

  const client = new MongoClient(process.env.MONGODB_URI!);
  try {
    await client.connect();
    const db = client.db("adrenalinjunkypiercinks");
    
    // Ang 'id' dito ay galing na sa nira-replace nating params sa baba
    const artist = await db.collection("artists").findOne({
       fullName: { $regex: new RegExp(id.replace(/-/g, " "), "i") } 
    });

    return artist;
  } finally {
    await client.close();
  }
}

// DITO ANG PAGBABAGO: Ang params ay kailangang i-await
export default async function ArtistProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. I-await ang params bago i-access ang .id
  const { id } = await params;

  // 2. Ngayon, sigurado nang string ang 'id', hindi na siya undefined
  const artist = await getArtistData(id);

  if (!artist) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 px-6">
      {/* ... (keep your existing UI code here) ... */}
      <h1 className="text-6xl font-black uppercase italic text-orange-500">
        {artist.fullName}
      </h1>
    </div>
  );
}