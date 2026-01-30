export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { generateSessionId } from "@/lib/auth";

export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = env.DB;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`Error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const clientId = (env as any).GOOGLE_CLIENT_ID;
  const clientSecret = (env as any).GOOGLE_CLIENT_SECRET;
  const redirectUri = (env as any).GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/callback`;

  // Intercambiar código por token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    return new Response(`Token error: ${err}`, { status: 400 });
  }

  const tokens = await tokenResponse.json() as { access_token: string };

  // Obtener info del usuario
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoResponse.ok) {
    return new Response("Failed to get user info", { status: 400 });
  }

  const googleUser = await userInfoResponse.json() as {
    email: string;
    name: string;
    picture: string
  };

  // Buscar o crear usuario
  let user = await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(googleUser.email)
    .first();

  if (!user) {
    // Usuario nuevo - crear con rol VISOR por defecto
    // El admin debe cambiar el rol manualmente
    await db
      .prepare("INSERT INTO users (email, name, picture, role) VALUES (?, ?, ?, 'VISOR')")
      .bind(googleUser.email, googleUser.name, googleUser.picture)
      .run();

    user = await db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(googleUser.email)
      .first();
  } else {
    // Actualizar último login y foto
    await db
      .prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP, name = ?, picture = ? WHERE id = ?")
      .bind(googleUser.name, googleUser.picture, user.id)
      .run();
  }

  // Crear sesión
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(sessionId, user!.id, expiresAt.toISOString())
    .run();

  // Redirigir a home con cookie de sesión
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`,
    },
  });
}
