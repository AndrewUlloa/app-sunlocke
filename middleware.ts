import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip auth check for auth-related paths
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { data: { session } } = await supabase.auth.getSession()

    // If user is not signed in and the current path is not /,
    // redirect the user to /
    if (!session && request.nextUrl.pathname !== "/") {
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and the current path is /,
    // redirect the user to /transcribe
    if (session && request.nextUrl.pathname === "/") {
      const redirectUrl = new URL('/transcribe', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    // If there's an error checking the session, allow the request to continue
    // This prevents redirect loops during auth state transitions
    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
} 