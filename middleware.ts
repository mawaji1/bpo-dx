import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET || 'dx-assessment-secret-key-change-in-production'
    });

    // If no token, redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check admin routes
    if (pathname.startsWith('/admin')) {
        if (token.role !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (public folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
    ],
};
