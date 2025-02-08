type Env = Record<string, unknown>

export async function onRequest(context: { request: Request; env: Env; next: () => Promise<Response> }) {
  return context.next()
} 