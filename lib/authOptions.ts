import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { type NextAuthOptions } from "next-auth";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { type Role } from "@/store/useUserStore";
import { cookies } from "next/headers";
import { hashPassword, isPasswordHash, verifyPassword } from "@/lib/password";

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
    image?: string | null;
  }
}

function normalizeRole(role: unknown): Role {
  const r = String(role).toUpperCase();
  if (r === "ADMIN") return "ADMIN";
  if (r === "MENTOR") return "MENTOR";
  return "STUDENT";
}

function normalizeSignupRole(role: unknown): "student" | "mentor" {
  return String(role).toLowerCase() === "mentor" ? "mentor" : "student";
}

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
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
        const email = normalizeEmail(credentials?.email);
        const password = String(credentials?.password || "");

        if (!email || !password) {
          throw new Error("Email and password are required");
        }

        await connectMongoDB();
        const user = await User.findOne({ email });

        if (!user || !(await verifyPassword(password, user.password))) {
          throw new Error("Invalid email or password");
        }

        if (!isPasswordHash(user.password)) {
          user.password = await hashPassword(password);
          await user.save();
        }

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
            const cookieStore = await cookies();
            const intendedRole = normalizeSignupRole(
              cookieStore.get("intended_role")?.value
            );

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

    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        try {
          await connectMongoDB();
          const dbUser = token.id
            ? await User.findById(token.id).lean()
            : token.email
              ? await User.findOne({ email: token.email }).lean()
              : null;

          if (dbUser) {
            token.id = String(dbUser._id);
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.image = dbUser.image ?? null;
            token.role = normalizeRole(dbUser.role);
          } else if (session?.user) {
            token.name = session.user.name ?? token.name;
            token.email = session.user.email ?? token.email;
            token.image = session.user.image ?? token.image ?? null;
            token.role = normalizeRole(session.user.role ?? token.role);
          }
        } catch (error) {
          console.error("Error refreshing session token:", error);
        }
      }

      if (user) {
        await connectMongoDB();
        const dbUser = await User.findOne({ email: user.email }).lean();

        if (dbUser) {
          token.id = String(dbUser._id);
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image ?? null;
          token.role = normalizeRole(dbUser.role);
        } else {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image ?? null;
          token.role = normalizeRole((user as { role?: unknown }).role);
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
        session.user.image = token.image ?? null;
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
