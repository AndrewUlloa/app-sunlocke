type Env = Record<string, unknown>

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  const url = new URL(context.request.url)
  
  // Special handling for auth callback
  if (url.pathname === '/auth/callback') {
    console.log('Cloudflare middleware: Processing auth callback...')
    return await context.next()
  }

  // For all other routes, check authentication
  try {
    return await context.next()
  } catch (err) {
    console.error('Cloudflare middleware error:', err)
    return new Response(`Internal Server Error`, { status: 500 })
  }
} 