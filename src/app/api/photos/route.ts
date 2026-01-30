export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(request: Request) {
  const { env } = getRequestContext();
  const bucket = (env as any).PHOTOS;
  const db = env.DB;

  if (!bucket) {
    return Response.json({ error: "R2 bucket not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const vehicleId = formData.get("vehicleId") as string;

    if (!file || !vehicleId) {
      return Response.json({ error: "Missing file or vehicleId" }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "La imagen es muy grande (max 10MB)" }, { status: 400 });
    }

    // Generar nombre único
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `vehicles/${vehicleId}/${Date.now()}.${ext}`;

    // Subir a R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generar URL pública (requiere dominio personalizado o R2.dev habilitado)
    const photoUrl = `/api/photos/${filename}`;

    // Actualizar vehículo con la URL de la foto
    await db.prepare(`
      UPDATE vehicles SET photo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(photoUrl, vehicleId).run();

    return Response.json({ success: true, url: photoUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET para servir las fotos
export async function GET(request: Request) {
  const { env } = getRequestContext();
  const bucket = (env as any).PHOTOS;

  if (!bucket) {
    return new Response("R2 bucket not configured", { status: 500 });
  }

  const url = new URL(request.url);
  // Extraer el path después de /api/photos/
  const key = url.pathname.replace("/api/photos/", "");

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
