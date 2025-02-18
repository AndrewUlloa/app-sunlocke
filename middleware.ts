import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Ensure environment variables exist and assert their types
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
}

// Define public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/signup', '/test-d2']

// Define protected routes that shouldn't redirect to /transcribe
const noRedirectRoutes = ['/test-d2']

export async function middleware(request: NextRequest) {
  // Create a response object that we'll use to handle cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create the Supabase client
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

  try {
    // Skip middleware for specific paths
    if (
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.includes('.') ||
      request.nextUrl.pathname === '/auth/callback'
    ) {
      return response
    }

    console.log("Middleware: Checking session for:", request.nextUrl.pathname)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Middleware: Session check error:", error)
      return response
    }

    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
    const isNoRedirectRoute = noRedirectRoutes.includes(request.nextUrl.pathname)

    // Handle authenticated users
    if (session) {
      // If authenticated user tries to access public routes and it's not a no-redirect route,
      // redirect to dashboard
      if (isPublicRoute && !isNoRedirectRoute) {
        console.log("Middleware: Authenticated user accessing public route, redirecting to /transcribe")
        return NextResponse.redirect(new URL('/transcribe', request.url))
      }
      // Allow access to protected routes
      return response
    }

    // Handle non-authenticated users
    if (!session) {
      // Allow access to public routes
      if (isPublicRoute) {
        return response
      }
      // Redirect to home for protected routes
      console.log("Middleware: Unauthenticated user accessing protected route, redirecting to /")
      return NextResponse.redirect(new URL('/', request.url))
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 