import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { type NextAuthOptions } from "next-auth";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { type Role } from "@/store/useUserStore";
import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { hashPassword, isPasswordHash, verifyPassword } from "@/lib/password";
import Session from "@/models/Session";
import { getRequestNetworkInfo, parseUserAgent } from "@/lib/security";
import { normalizeDatabaseRole, normalizeSessionRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      subscriptionPlan?: "FREE" | "PRO" | "ELITE";
      accountStatus?: "active" | "suspended" | "banned";
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
    subscriptionPlan?: "FREE" | "PRO" | "ELITE";
    accountStatus?: "active" | "suspended" | "banned";
    image?: string | null;
    /** Device-session id; mirrors a row in the Session collection. */
    sid?: string;
  }
}

function normalizeSubscriptionPlan(plan: unknown): "FREE" | "PRO" | "ELITE" {
  const normalized = String(plan || "").trim().toUpperCase();
  if (normalized === "ELITE") return "ELITE";
  if (normalized === "PRO") return "PRO";
  return "FREE";
}

function normalizeAccountStatus(
  status: unknown
): "active" | "suspended" | "banned" {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "banned") return "banned";
  if (normalized === "suspended") return "suspended";
  return "active";
}

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function cacheBustImageUrl(image: unknown): string | null {
  const imageUrl = String(image ?? "").trim();

  if (!imageUrl) {
    return null;
  }

  return imageUrl.includes("?")
    ? `${imageUrl}&v=${Date.now()}`
    : `${imageUrl}?v=${Date.now()}`;
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
          role: normalizeSessionRole(user.role),
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
            const intendedRole = normalizeDatabaseRole(
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
            token.role = normalizeSessionRole(dbUser.role);
            token.subscriptionPlan = normalizeSubscriptionPlan(
              (dbUser as any).subscriptionPlan || (dbUser as any).plan
            );
            token.accountStatus = normalizeAccountStatus(
              (dbUser as any).accountStatus || (dbUser as any).status
            );
          }

          if (session?.user) {
            const sessionUser = session.user as Record<string, unknown>;

            if (Object.prototype.hasOwnProperty.call(sessionUser, "name")) {
              token.name = session.user.name ?? token.name;
            }

            if (Object.prototype.hasOwnProperty.call(sessionUser, "email")) {
              token.email = session.user.email ?? token.email;
            }

            if (Object.prototype.hasOwnProperty.call(sessionUser, "image")) {
              token.image = cacheBustImageUrl(session.user.image);
            }

            if (Object.prototype.hasOwnProperty.call(sessionUser, "role")) {
              token.role = session.user.role
                ? normalizeSessionRole(session.user.role)
                : normalizeSessionRole(token.role);
            }
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
          token.role = normalizeSessionRole(dbUser.role);
          token.subscriptionPlan = normalizeSubscriptionPlan(
            (dbUser as any).subscriptionPlan || (dbUser as any).plan
          );
          token.accountStatus = normalizeAccountStatus(
            (dbUser as any).accountStatus || (dbUser as any).status
          );
        } else {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image ?? null;
          token.role = normalizeSessionRole((user as { role?: unknown }).role);
          token.subscriptionPlan = "FREE";
          token.accountStatus = "active";
        }

        // Record this login as a device session. The JWT strategy keeps no DB
        // sessions, so we log one here (parsing the UA) and embed its `sid` in
        // the token to identify the current device later.
        try {
          if (!token.sid && token.id) {
            const requestHeaders = await headers();
            const parsed = parseUserAgent(requestHeaders.get("user-agent"));
            const { ipAddress, location } = getRequestNetworkInfo((key) =>
              requestHeaders.get(key)
            );
            const sid = randomBytes(24).toString("hex");

            await Session.create({
              userId: token.id,
              sid,
              device: parsed.device,
              os: parsed.os,
              browser: parsed.browser,
              deviceType: parsed.deviceType,
              ipAddress,
              location,
              lastActive: new Date(),
              isCurrentSession: true,
            });

            token.sid = sid;
          }
        } catch (error) {
          console.error("Error recording login session:", error);
        }
      } else if (token.id) {
        try {
          await connectMongoDB();
          const dbUser = await User.findById(token.id, "accountStatus status role subscriptionPlan plan image name email").lean();
          if (dbUser) {
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.image = dbUser.image ?? token.image ?? null;
            token.role = normalizeSessionRole(dbUser.role);
            token.subscriptionPlan = normalizeSubscriptionPlan(
              (dbUser as any).subscriptionPlan || (dbUser as any).plan
            );
            token.accountStatus = normalizeAccountStatus(
              (dbUser as any).accountStatus || (dbUser as any).status
            );
          }
        } catch (error) {
          console.error("Error refreshing account status:", error);
        }
      }
      token.role = normalizeSessionRole(token.role);
      token.subscriptionPlan = normalizeSubscriptionPlan(token.subscriptionPlan);
      token.accountStatus = normalizeAccountStatus(token.accountStatus);
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email ?? null;
        session.user.name = token.name ?? null;
        session.user.image = token.image ?? null;
        session.user.role = normalizeSessionRole(token.role);
        session.user.subscriptionPlan = normalizeSubscriptionPlan(token.subscriptionPlan);
        session.user.accountStatus = normalizeAccountStatus(token.accountStatus);
      }
      return session;
    },
  },
  events: {
    // Remove the current device's session row when the user signs out.
    async signOut({ token }) {
      try {
        if (token?.sid) {
          await connectMongoDB();
          await Session.deleteOne({ sid: token.sid });
        }
      } catch (error) {
        console.error("Error clearing session on sign-out:", error);
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
