import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Para maiwasan ang "Firebase App already exists" error
const adminConfig = {
  // Siguraduhin na tugma ito sa pangalan sa .env.local
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const app = getApps().length > 0 
  ? getApp() 
  : initializeApp({ credential: cert(adminConfig as any) });

const db = getFirestore(app);

const handler = NextAuth({
  // Dito natin ikakabit yung Firestore
  adapter: FirestoreAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Para mawala yung 'Property id does not exist' error
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/home", // Optional: kung may custom sign-in page ka
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };