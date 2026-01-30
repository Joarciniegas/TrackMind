export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = env.DB;

  // Obtener cookie de sesión
  const cookies = request.headers.get("Cookie") || "";
  const sessionMatch = cookies.match(/session=([^;]+)/);
  const sessionId = sessionMatch ? sessionMatch[1] : null;

  if (sessionId) {
    // Eliminar sesión de la base de datos
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }

  // Eliminar cookie
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": "session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    },
  });
}

export async function GET(request: Request) {
  return POST(request);
}
