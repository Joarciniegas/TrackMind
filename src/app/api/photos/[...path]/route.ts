export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { env } = getRequestContext();
  const bucket = (env as any).PHOTOS;
  const { path } = await params;

  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const key = path.join("/");

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const object = await bucket.get(key);

    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch {
    return new Response("Error fetching image", { status: 500 });
  }
}
