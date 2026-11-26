import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-mockmate-path", pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-mockmate-path", pathname);

  // Support local test simulation in development
  if (process.env.NODE_ENV !== "production" && request.headers.get("x-test-auth-role")) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("mockmate-demo")) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.headers.set("x-mockmate-path", pathname);
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.headers.set("x-mockmate-path", pathname);
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/interview") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/resume-tailor");

  const isAuthPath =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // 1. Unauthenticated users cannot access protected routes
  if (isProtectedPath) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Google accounts are pre-verified; manual email users must confirm their email
    const isGoogleUser =
      user.app_metadata?.provider === "google" ||
      user.app_metadata?.providers?.includes("google") ||
      user.identities?.some((i: any) => i.provider === "google");
    const isEmailVerified = Boolean(user.email_confirmed_at || isGoogleUser);

    if (!isEmailVerified) {
      const verifyUrl = new URL("/verify-email", request.url);
      if (user.email) {
        verifyUrl.searchParams.set("email", user.email);
      }
      return NextResponse.redirect(verifyUrl);
    }
  }

  // 3. Logged-in & verified users visiting login or register are sent straight to dashboard
  const isGoogleUser =
    user?.app_metadata?.provider === "google" ||
    user?.app_metadata?.providers?.includes("google") ||
    user?.identities?.some((i: any) => i.provider === "google");
  const isEmailVerified = Boolean(user?.email_confirmed_at || isGoogleUser);

  if (isAuthPath && user && isEmailVerified) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/interview",
    "/interview/:path*",
    "/progress",
    "/progress/:path*",
    "/resume-tailor",
    "/resume-tailor/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/admin",
    "/admin/:path*",
  ],
};
