import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Ensure environment variables exist and assert their types
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
}

export async function middleware(request: NextRequest) {
  // Create a response object that we'll use to handle cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Special handling for callback path
    if (request.nextUrl.pathname === '/auth/callback') {
      console.log("Middleware: Processing auth callback...")
      return response
    }

    // Skip auth check for static assets and other auth paths
    if (
      request.nextUrl.pathname.startsWith('/auth/') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.includes('.')
    ) {
      console.log("Middleware: Skipping auth check for:", request.nextUrl.pathname)
      return response
    }

    // Handle admin routes with basic auth - COMPLETELY SEPARATE FROM SUPABASE AUTH
    if (request.nextUrl.pathname.startsWith('/admin')) {
      console.log("Middleware: Handling admin auth independently")
      const basicAuth = request.headers.get('authorization')
      const adminCookie = request.cookies.get('adminAuth')?.value
      
      // If we have a valid authorization header
      if (basicAuth) {
        const authValue = basicAuth.split(' ')[1]
        const [user, pwd] = atob(authValue).split(':')

        if (user === 'admin' && pwd === 'marketing2024') {
          // Set an admin auth cookie for future requests
          response.cookies.set({
            name: 'adminAuth',
            value: 'authorized',
            path: '/',
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 24 hours
            sameSite: 'strict'
          })
          
          return response
        }
      } 
      // Check for valid admin cookie
      else if (adminCookie === 'authorized') {
        return response
      }

      // If no valid auth, prompt for credentials
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      })
    }

    // Only create Supabase client for non-admin routes
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Handle regular session-based auth for non-admin routes
    console.log("Middleware: Checking session for:", request.nextUrl.pathname)
    const { data: { session } } = await supabase.auth.getSession()

    // If user is not signed in and trying to access a protected route
    if (!session && request.nextUrl.pathname !== "/") {
      console.log("Middleware: No session, redirecting to /")
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If user is signed in and on the root path
    if (session && request.nextUrl.pathname === "/") {
      console.log("Middleware: Session exists, redirecting to /transcribe")
      return NextResponse.redirect(new URL('/transcribe', request.url))
    }

    return response
  } catch (error) {
    console.error("Middleware: Unexpected error:", error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (auth callback route)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|api/).*)',
  ],
} 