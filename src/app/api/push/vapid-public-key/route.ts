export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET() {
  const { env } = getRequestContext();
  const publicKey = (env as any).VAPID_PUBLIC_KEY;

  return Response.json({ publicKey: publicKey || null });
}
