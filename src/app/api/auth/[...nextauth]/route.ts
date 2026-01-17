import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb"; // Eto yung bago

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Users: "clients", // Pinangalanan nating 'clients' gaya ng gusto mo
    },
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ... callbacks etc.
});

export { handler as GET, handler as POST };