export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = env.DB;

  try {
    const subscription = await request.json();

    // Obtener usuario de la sesión
    const cookies = request.headers.get("Cookie") || "";
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    if (!sessionId) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await db
      .prepare(`
        SELECT u.id FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > datetime('now')
      `)
      .bind(sessionId)
      .first() as { id: number } | null;

    if (!user) {
      return Response.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // Guardar suscripción
    await db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
    `).bind(
      user.id,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth
    ).run();

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
