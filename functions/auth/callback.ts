type Env = Record<string, unknown>

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  const response = await context.next()
  
  // Add special header to indicate successful login
  const headers = new Headers(response.headers)
  headers.set('X-Auth-Success', 'true')
  
  return new Response(response.body, {
    status: response.status,
    headers
  })
} 