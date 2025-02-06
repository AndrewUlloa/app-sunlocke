import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Ensure environment variables exist and assert their types
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
}

export async function middleware(request: NextRequest) {
  // Skip auth check for auth-related paths and static assets
  if (
    request.nextUrl.pathname.startsWith('/auth/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    console.log("Middleware: Skipping auth check for:", request.nextUrl.pathname)
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
    console.log("Middleware: Checking session for:", request.nextUrl.pathname)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Middleware: Session check error:", error)
      // On error, allow the request but don't redirect
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
    // If there's an error checking the session, allow the request to continue
    // This prevents redirect loops during auth state transitions
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
} 