export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendPushToAll } from "@/lib/push";

export async function POST(request: Request) {
  const { env } = getRequestContext();

  try {
    // Verify user is admin
    const cookies = request.headers.get("Cookie") || "";
    const sessionMatch = cookies.match(/session=([^;]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;

    if (!sessionId) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await env.DB.prepare(`
      SELECT u.id, u.role FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).bind(sessionId).first() as { id: number; role: string } | null;

    if (!user || user.role !== "ADMIN") {
      return Response.json({ error: "No autorizado" }, { status: 403 });
    }

    const vapidPublicKey = (env as any).VAPID_PUBLIC_KEY;
    const vapidPrivateKey = (env as any).VAPID_PRIVATE_KEY;
    const vapidSubject = (env as any).VAPID_SUBJECT || ((env as any).VAPID_EMAIL ? `mailto:${(env as any).VAPID_EMAIL}` : "mailto:admin@trackmind.app");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({ error: "VAPID keys no configuradas" }, { status: 500 });
    }

    const notification = {
      title: "🧪 Prueba de Notificación",
      body: "¡Las notificaciones push del servidor funcionan correctamente!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "test",
      url: "/",
    };

    const result = await sendPushToAll(
      env.DB,
      notification,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject
    );

    return Response.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
