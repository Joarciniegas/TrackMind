export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(request: Request) {
  const { env } = getRequestContext();

  const clientId = (env as any).GOOGLE_CLIENT_ID;
  const redirectUri = (env as any).GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback`;

  if (!clientId) {
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: state,
    access_type: "offline",
    prompt: "consent",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: googleAuthUrl,
      "Set-Cookie": `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });

  return response;
}
