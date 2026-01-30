export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = env.DB;

  try {
    const { endpoint } = await request.json();

    await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
      .bind(endpoint)
      .run();

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
