import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // If user must change password, redirect to change-password page
        if (token?.mustChangePassword && pathname !== '/change-password') {
            return NextResponse.redirect(new URL('/change-password', req.url));
        }

        // Redirect root path based on role
        if (pathname === '/') {
            if (token?.role === 'evaluator') {
                return NextResponse.redirect(new URL('/evaluator', req.url));
            } else {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }
        }

        // Block evaluators from admin pages only
        if (token?.role === 'evaluator') {
            const adminOnlyPaths = ['/admin'];
            const isAdminPage = adminOnlyPaths.some(p => pathname.startsWith(p));
            if (isAdminPage) {
                return NextResponse.redirect(new URL('/evaluator', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

// Protect all routes except login and auth endpoints
export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
    ],
};
