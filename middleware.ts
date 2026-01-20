import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const referer = request.headers.get('referer')
  const refererUrl = referer ? new URL(referer) : null

  // If user is on a kiosk route
  if (pathname.startsWith('/kiosk/')) {
    // Allow access to kiosk routes
    return NextResponse.next()
  }

  // If user was on kiosk and tries to navigate elsewhere
  if (refererUrl && refererUrl.pathname.startsWith('/kiosk/')) {
    // Allow navigation to dashboard (authorized exit via master PIN)
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      return NextResponse.next()
    }
    // Redirect back to the kiosk they were on for all other routes
    return NextResponse.redirect(refererUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
