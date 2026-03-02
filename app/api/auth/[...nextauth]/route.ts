import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import NextAuth, { type NextAuthOptions } from "next-auth";
import { type JWT } from "next-auth/jwt";
import { type Session } from "next-auth";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { type Role } from "@/store/useUserStore";
import { cookies } from "next/headers";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

function normalizeRole(role: unknown): Role {
  const r = String(role).toUpperCase();
  return r === "MENTOR" ? "MENTOR" : "STUDENT";
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email aur Password dono zaroori hain");
        }
        
        await connectMongoDB();
        const user = await User.findOne({ email: credentials.email }).lean();
        
        if (!user) throw new Error("Is email se koi account nahi mila");
        if (user.password !== credentials.password) throw new Error("Ghalat password");
        
        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: normalizeRole(user.role),
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectMongoDB();
          const userExists = await User.findOne({ email: user.email });
          
          if (!userExists) {
            // 👇 Yahan NEXT.JS 16 ke liye 'await' lagana zaroori tha!
            const cookieStore = await cookies(); 
            const intendedRole = cookieStore.get("intended_role")?.value || "student";

            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: intendedRole, 
            });
          }
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user }) {
      if (user) {
        await connectMongoDB();
        const dbUser = await User.findOne({ email: user.email }).lean();
        
        if (dbUser) {
          token.id = String(dbUser._id);
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = normalizeRole(dbUser.role);
        } else {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = normalizeRole((user as any).role);
        }
      }
      token.role = normalizeRole(token.role);
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email ?? null;
        session.user.name = token.name ?? null;
        session.user.role = normalizeRole(token.role);
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };