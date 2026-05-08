import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl, headers } = request;
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (isAuthRoute) {
        if (isLoggedIn) {
          const host =
            headers.get("x-forwarded-host") ||
            headers.get("host") ||
            nextUrl.host;
          const proto =
            headers.get("x-forwarded-proto") ||
            nextUrl.protocol.replace(":", "") ||
            "http";
          return Response.redirect(new URL(`${proto}://${host}/`));
        }
        return true;
      }
      if (!isLoggedIn) {
        const isRSC =
          headers.has("Next-Router-State-Tree") ||
          headers.has("Next-Router-Prefetch");
        if (isRSC) return new Response(null, { status: 401 });

        const host =
          headers.get("x-forwarded-host") ||
          headers.get("host") ||
          nextUrl.host;
        const proto =
          headers.get("x-forwarded-proto") ||
          nextUrl.protocol.replace(":", "") ||
          "http";
        const loginUrl = new URL(`${proto}://${host}/login`);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return Response.redirect(loginUrl);
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error extra fields from authorize
        token.homeId = user.homeId;
        // @ts-expect-error extra fields from authorize
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      if (token?.homeId) session.user.homeId = token.homeId as string;
      if (token?.role) session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
  trustHost: true,
};
