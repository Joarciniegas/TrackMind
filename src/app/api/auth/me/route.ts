export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = env.DB;

  // Obtener cookie de sesión
  const cookies = request.headers.get("Cookie") || "";
  const sessionMatch = cookies.match(/session=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (!sessionId) {
    return Response.json({ user: null });
  }

  // Buscar sesión y usuario
  const result = await db
    .prepare(`
      SELECT u.id, u.email, u.name, u.picture, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `)
    .bind(sessionId)
    .first();

  if (!result) {
    return Response.json({ user: null });
  }

  return Response.json({ user: result });
}
