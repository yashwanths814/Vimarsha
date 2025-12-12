import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("__session")?.value;
    const { pathname } = req.nextUrl;

    // Public pages (no login needed)
    const publicPages = ["/", "/loader", "/intro", "/manufacturer/login"];

    // If visiting a public page → allow
    if (publicPages.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Protected pages (must login)
    if (pathname.startsWith("/manufacturer") && !pathname.startsWith("/manufacturer/login")) {
        if (!token) {
            const loginURL = new URL("/manufacturer/login", req.url);
            return NextResponse.redirect(loginURL);
        }
    }

    return NextResponse.next();
}
