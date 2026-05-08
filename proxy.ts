import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|icon-192.png|icon-512.png|apple-touch-icon.png).*)"],
};
