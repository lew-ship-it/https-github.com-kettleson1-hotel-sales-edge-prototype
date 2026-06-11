import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { getUserAccess } from "@/lib/access";

/* ────────────────────────────────────────────────────────────────
   Authentication (Auth.js v5).

   Production: Resend magic links — owner enters email, clicks the
   link, they're in. NOTE: email providers require a database adapter
   to store one-time verification tokens. Recommended on Vercel:

     npm i @auth/upstash-redis-adapter @upstash/redis
     import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
     import { Redis } from "@upstash/redis";
     ...
     adapter: UpstashRedisAdapter(Redis.fromEnv()),

   (Vercel Marketplace → Upstash Redis adds the env vars for you.)

   Development: a Credentials provider that accepts any email that
   exists in the Notion User DB (or anything in demo mode) — so you
   can test locally without email infrastructure. It is disabled
   outside NODE_ENV=development.

   Gate: regardless of provider, sign-in succeeds ONLY if
   getUserAccess(email) finds an Active user row in Notion.
   ──────────────────────────────────────────────────────────────── */

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "Hotel Sales Edge <portal@hotelsalesedge.com>",
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "dev-email",
            name: "Dev sign-in",
            credentials: { email: { label: "Email", type: "email" } },
            async authorize(creds) {
              const email = creds?.email?.toString().toLowerCase();
              const access = await getUserAccess(email);
              return access ? { email, name: access.name } : null;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    // Only people in the Notion User DB (Active = Yes) may sign in.
    async signIn({ user }) {
      const access = await getUserAccess(user?.email?.toLowerCase());
      return Boolean(access);
    },
    // Used by middleware to protect /dashboard.
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});
