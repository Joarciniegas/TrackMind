export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

async function getSessionUser(request: Request, db: D1Database) {
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const db = env.DB;
  const { id } = await params;

  const currentUser = await getSessionUser(request, db);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  // No permitir que el admin se cambie el rol a sí mismo
  if (currentUser.id.toString() === id) {
    return Response.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const validRoles = ["ADMIN", "OPERADOR", "VISOR"];

    if (!data.role || !validRoles.includes(data.role)) {
      return Response.json({ error: "Rol inválido" }, { status: 400 });
    }

    await db.prepare(`
      UPDATE users SET role = ? WHERE id = ?
    `).bind(data.role, id).run();

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const db = env.DB;
  const { id } = await params;

  const currentUser = await getSessionUser(request, db);

  if (!currentUser || currentUser.role !== "ADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  if (currentUser.id.toString() === id) {
    return Response.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  try {
    // Eliminar sesiones del usuario
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
    // Eliminar usuario
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
