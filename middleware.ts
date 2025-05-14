import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth condition
  const isLoggedIn = !!session
  const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup"
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin")

  // Redirect if needed
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!isAuthPage && !isLoggedIn && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // For admin pages, you would typically check for admin role
  // This is a simplified version - in a real app, check user roles
  if (isAdminPage) {
    // Here you would check if the user has admin privileges
    // For now, we'll just check if they're logged in
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
