import { NextResponse } from "next/server";

export function proxy(request) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Allow login page
  if (pathname === "/") {
    return NextResponse.next();
  }

  // No token → redirect
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // Decode JWT manually (Edge-safe)
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    const role = payload?.role;
    const exp = payload?.exp;

    const currentTime = Math.floor(Date.now() / 1000);

    // Check expiration
    if (exp && exp < currentTime) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const pathRole = pathname.split("/")[1];

    const allowedRoles = ["student", "teacher", "hod", "director"];

    if (allowedRoles.includes(pathRole) && pathRole !== role) {
      return NextResponse.redirect(new URL("/", request.url));
    }

  } catch (error) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};