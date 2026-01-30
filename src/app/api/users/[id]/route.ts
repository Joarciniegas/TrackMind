export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendPushNotification, createNotification } from "@/lib/push";

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

    // Get user info before update
    const targetUser = await db.prepare(`
      SELECT name FROM users WHERE id = ?
    `).bind(id).first() as { name: string } | null;

    await db.prepare(`
      UPDATE users SET role = ? WHERE id = ?
    `).bind(data.role, id).run();

    // Notify the user about their role change
    const vapidPublicKey = (env as any).VAPID_PUBLIC_KEY;
    const vapidPrivateKey = (env as any).VAPID_PRIVATE_KEY;
    const vapidSubject = (env as any).VAPID_SUBJECT || "mailto:admin@trackmind.app";

    if (vapidPublicKey && vapidPrivateKey && targetUser) {
      const notification = createNotification.roleChanged({
        name: targetUser.name,
        role: data.role,
      });

      // Send to the specific user
      try {
        const { results: userSubs } = await db.prepare(`
          SELECT * FROM push_subscriptions WHERE user_id = ?
        `).bind(id).all();

        if (userSubs && userSubs.length > 0) {
          for (const sub of userSubs as any[]) {
            sendPushNotification(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              notification,
              vapidPublicKey,
              vapidPrivateKey,
              vapidSubject
            ).catch(() => {});
          }
        }
      } catch {}
    }

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
