import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin']);

function normalizeSchoolSlug(value: string | null | undefined) {
  const slug = value?.toLowerCase().trim();
  if (!slug || slug === '__superadmin' || RESERVED_SUBDOMAINS.has(slug)) return null;
  return slug;
}

function extractSlugFromHost(host: string) {
  const hostname = host.split(':')[0].toLowerCase();
  const parts = hostname.split('.');
  if (parts.length >= 3 && !hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
    return normalizeSchoolSlug(parts[0]);
  }
  return null;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const searchParams = request.nextUrl.searchParams;

  // Extract School Slug
  let schoolSlug = normalizeSchoolSlug(process.env.DEV_SCHOOL_SLUG || searchParams.get('school'));
  if (!schoolSlug) {
    schoolSlug = extractSlugFromHost(host);
  }

  // Create a new response to modify headers
  let response = NextResponse.next();
  if (schoolSlug) {
    // We clone the request headers to pass them to NextResponse.next
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-school-slug', schoolSlug);
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Next.js 16 - Imperative matcher logic for static assets
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname === '/favicon.ico' || 
    pathname.includes('.')
  ) {
    return response;
  }

  // Paths that don't require authentication
  const isPublicPath = pathname === '/login' || pathname === '/register';

  // If trying to access a protected route without being logged in
  if (!isPublicPath && (!token || !userCookie)) {
    return NextResponse.redirect(new URL(schoolSlug ? `/login?school=${schoolSlug}` : '/login', request.url));
  }

  // If already logged in and trying to access login page
  if (isPublicPath && token && userCookie) {
    try {
      const user = JSON.parse(userCookie);
      if (user.mustChangePassword) {
        return NextResponse.redirect(new URL('/change-password', request.url));
      }
      // Redirect based on role
      return redirectToRoleDashboard(user.role, request.url);
    } catch (e) {
      // Invalid cookie, let them login
    }
  }

  // Handle protected routes for authenticated users
  if (!isPublicPath && token && userCookie) {
    try {
      const user = JSON.parse(userCookie);

      // Force password change
      if (user.mustChangePassword && pathname !== '/change-password') {
        return NextResponse.redirect(new URL('/change-password', request.url));
      }

      // Allow users to change password if they are forced to
      if (pathname === '/change-password') {
        if (!user.mustChangePassword) {
          return redirectToRoleDashboard(user.role, request.url);
        }
        return NextResponse.next();
      }

      // Role-based route protection
      if (pathname.startsWith('/admin/platform') && user.role !== 'super_admin') {
        return redirectToRoleDashboard(user.role, request.url);
      }
      
      if (pathname.startsWith('/admin/school') && user.role !== 'school_admin') {
        return redirectToRoleDashboard(user.role, request.url);
      }
      
      if (pathname.startsWith('/teacher') && user.role !== 'teacher') {
        return redirectToRoleDashboard(user.role, request.url);
      }
      
      if (pathname.startsWith('/student') && user.role !== 'student') {
        return redirectToRoleDashboard(user.role, request.url);
      }
    } catch (e) {
      // Invalid cookie
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Root path redirect
  if (pathname === '/' && token && userCookie) {
    try {
      const user = JSON.parse(userCookie);
      return redirectToRoleDashboard(user.role, request.url);
    } catch (e) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } else if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

function redirectToRoleDashboard(role: string, baseUrl: string) {
  switch (role) {
    case 'super_admin':
      return NextResponse.redirect(new URL('/admin/platform', baseUrl));
    case 'school_admin':
      return NextResponse.redirect(new URL('/admin/school', baseUrl));
    case 'teacher':
      return NextResponse.redirect(new URL('/teacher/dashboard', baseUrl));
    case 'student':
      return NextResponse.redirect(new URL('/student/dashboard', baseUrl));
    default:
      return NextResponse.redirect(new URL('/login', baseUrl));
  }
}

// Next 16 removes the matcher config object for middleware. We will use a standard pattern inside the middleware function instead if needed, but our route rules already exclude API routes.
