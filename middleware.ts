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

    // Handle admin routes separately
    if (request.nextUrl.pathname.startsWith('/admin')) {
      console.log("Middleware: Checking admin auth for:", request.nextUrl.pathname)
      const basicAuth = request.headers.get('authorization')

      if (basicAuth) {
        const authValue = basicAuth.split(' ')[1]
        const [user, pwd] = atob(authValue).split(':')

        if (user === 'admin' && pwd === 'marketing2024') {
          return response
        }
      }

      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      })
    }

    console.log("Middleware: Checking session for:", request.nextUrl.pathname)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Middleware: Session check error:", error)
      return response
    }

    // If user is not signed in and the current path is not /,
    // redirect the user to /
    if (!session && request.nextUrl.pathname !== "/") {
      console.log("Middleware: No session, redirecting to /")
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and the current path is /,
    // redirect the user to /transcribe
    if (session && request.nextUrl.pathname === "/") {
      console.log("Middleware: Session exists, redirecting to /transcribe")
      const redirectUrl = new URL('/transcribe', request.url)
      return NextResponse.redirect(redirectUrl)
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