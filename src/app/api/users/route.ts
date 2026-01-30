export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

// Obtener cookie de sesión y verificar si es admin
async function getSessionUser(request: Request, db: any) {
  const cookies = request.headers.get("Cookie") || "";
  const sessionMatch = cookies.match(/session=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (!sessionId) return null;

  const user = await db
    .prepare(`
      SELECT u.id, u.email, u.name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `)
    .bind(sessionId)
    .first();

  return user;
}

export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = env.DB;

  const currentUser = await getSessionUser(request, db);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { results } = await db.prepare(`
      SELECT id, email, name, picture, role, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `).all();

    return Response.json(results || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
