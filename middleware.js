export { auth as middleware } from "@/auth";

// Protect the portal; the login page and auth API stay public.
export const config = { matcher: ["/dashboard/:path*"] };
