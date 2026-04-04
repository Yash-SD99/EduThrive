// import { NextResponse } from "next/server";

// export function proxy(request) {
//   const token = request.cookies.get("accessToken")?.value;
//   const { pathname } = request.nextUrl;

//   // =============================================
//   // PUBLIC ROUTES - always allow through
//   // =============================================
//   if (
//     pathname === "/" ||
//     pathname === "/register" ||         
//     pathname.startsWith("/api") ||
//     pathname.startsWith("/_next") ||
//     pathname === "/favicon.ico"
//   ) {
//     return NextResponse.next();
//   }

//   // =============================================
//   // Extract institute code and sub-path
//   // URL structure: /[code]/...
//   // e.g. /DYPCOE/login  →  segments = ["DYPCOE", "login"]
//   //      /DYPCOE/student/dashboard  →  segments = ["DYPCOE", "student", "dashboard"]
//   // =============================================
//   const segments = pathname.split("/").filter(Boolean);
//   // segments[0] = institute code (e.g. "DYPCOE")
//   // segments[1] = role or "login" (e.g. "student", "teacher", "login")

//   const code = segments[0];          // e.g. "DYPCOE"
//   const subPath = segments[1] || ""; // e.g. "login", "student", "teacher"

//   // If no code yet (bare "/"), redirect to a landing or 404
//   if (!code) {
//     return NextResponse.next();
//   }

//   // Allow login page (the (auth) group page)
//   // In Next.js App Router, /[code] with no role segment is the login page
//   if (!subPath || subPath === "login") {
//     return NextResponse.next();
//   }

//   // =============================================
//   // Protected routes — require valid JWT
//   // =============================================
//   if (!token) {
//     return NextResponse.redirect(new URL(`/${code}`, request.url));
//   }

//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));
//     const role = payload?.role;
//     const exp = payload?.exp;

//     // Expired token → back to institute login
//     const currentTime = Math.floor(Date.now() / 1000);
//     if (exp && exp < currentTime) {
//       return NextResponse.redirect(new URL(`/${code}`, request.url));
//     }

//     const pathRole = subPath; // e.g. "student", "teacher", "hod", "director"
//     const allowedRoles = ["student", "teacher", "hod", "director"];

//     // HOD can also access teacher routes (view as teacher)
//     if (role === "hod" && pathRole === "teacher") {
//       return NextResponse.next();
//     }

//     // Block wrong-role access
//     if (allowedRoles.includes(pathRole) && pathRole !== role) {
//       return NextResponse.redirect(new URL(`/${code}`, request.url));
//     }

//   } catch (error) {
//     return NextResponse.redirect(new URL(`/${code}`, request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next|favicon.ico).*)"],
// };