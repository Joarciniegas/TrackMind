import { getRequestContext } from "@cloudflare/next-on-pages";
import { sendPushToAll, createNotification } from "@/lib/push";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const { id } = await params;

  try {
    const vehicle = await env.DB.prepare(`
      SELECT * FROM vehicles WHERE id = ?
    `).bind(id).first();

    if (!vehicle) {
      return Response.json({ error: "Vehículo no encontrado" }, { status: 404 });
    }

    const { results: timeline } = await env.DB.prepare(`
      SELECT * FROM timeline WHERE vehicle_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return Response.json({ ...vehicle, timeline: timeline || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const { id } = await params;

  try {
    const data = await request.json();
    let statusChanged = false;
    let vehicleInfo: { year?: number; make?: string; model?: string } = {};

    // Get current vehicle info for notifications
    const currentVehicle = await env.DB.prepare(`
      SELECT year, make, model, status FROM vehicles WHERE id = ?
    `).bind(id).first() as { year: number; make: string; model: string; status: string } | null;

    if (currentVehicle) {
      vehicleInfo = { year: currentVehicle.year, make: currentVehicle.make, model: currentVehicle.model };
    }

    // If status is being updated, add to timeline
    if (data.status && currentVehicle && currentVehicle.status !== data.status) {
      statusChanged = true;
      await env.DB.prepare(`
        INSERT INTO timeline (vehicle_id, status, user_name, note)
        VALUES (?, ?, ?, ?)
      `).bind(
        id,
        data.status,
        data.user_name || "Sistema",
        data.note || `Cambio a ${data.status}`
      ).run();
    }

    // Build update query dynamically
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.vin !== undefined) { fields.push("vin = ?"); values.push(data.vin); }
    if (data.year !== undefined) { fields.push("year = ?"); values.push(data.year); }
    if (data.make !== undefined) { fields.push("make = ?"); values.push(data.make); }
    if (data.model !== undefined) { fields.push("model = ?"); values.push(data.model); }
    if (data.trim !== undefined) { fields.push("trim = ?"); values.push(data.trim); }
    if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
    if (data.miles !== undefined) { fields.push("miles = ?"); values.push(data.miles); }
    if (data.status) { fields.push("status = ?"); values.push(data.status); }
    if (data.auction !== undefined) { fields.push("auction = ?"); values.push(data.auction); }
    if (data.payment_method !== undefined) { fields.push("payment_method = ?"); values.push(data.payment_method); }
    if (data.flooring_company !== undefined) { fields.push("flooring_company = ?"); values.push(data.flooring_company); }
    if (data.purchase_price !== undefined) { fields.push("purchase_price = ?"); values.push(data.purchase_price); }
    if (data.transport_cost !== undefined) { fields.push("transport_cost = ?"); values.push(data.transport_cost); }
    if (data.recon_cost !== undefined) { fields.push("recon_cost = ?"); values.push(data.recon_cost); }
    if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }
    if (data.photo_url !== undefined) { fields.push("photo_url = ?"); values.push(data.photo_url); }

    if (fields.length > 0) {
      fields.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);

      await env.DB.prepare(`
        UPDATE vehicles SET ${fields.join(", ")} WHERE id = ?
      `).bind(...values).run();
    }

    // Send push notification for status change
    if (statusChanged) {
      const vapidPublicKey = (env as any).VAPID_PUBLIC_KEY;
      const vapidPrivateKey = (env as any).VAPID_PRIVATE_KEY;
      const vapidSubject = (env as any).VAPID_SUBJECT || "mailto:admin@trackmind.app";

      if (vapidPublicKey && vapidPrivateKey) {
        const notification = createNotification.statusChange({
          ...vehicleInfo,
          status: data.status,
          user_name: data.user_name,
        });

        sendPushToAll(env.DB, notification, vapidPublicKey, vapidPrivateKey, vapidSubject)
          .catch((e) => console.error("Push error:", e));
      }
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
  const { id } = await params;

  try {
    // Get vehicle info before deleting for notification
    const vehicle = await env.DB.prepare(`
      SELECT year, make, model FROM vehicles WHERE id = ?
    `).bind(id).first() as { year: number; make: string; model: string } | null;

    // Eliminar timeline primero (foreign key)
    await env.DB.prepare("DELETE FROM timeline WHERE vehicle_id = ?").bind(id).run();

    // Eliminar vehículo
    await env.DB.prepare("DELETE FROM vehicles WHERE id = ?").bind(id).run();

    // Send push notification
    if (vehicle) {
      const vapidPublicKey = (env as any).VAPID_PUBLIC_KEY;
      const vapidPrivateKey = (env as any).VAPID_PRIVATE_KEY;
      const vapidSubject = (env as any).VAPID_SUBJECT || "mailto:admin@trackmind.app";

      if (vapidPublicKey && vapidPrivateKey) {
        const notification = createNotification.vehicleDeleted({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
        });

        sendPushToAll(env.DB, notification, vapidPublicKey, vapidPrivateKey, vapidSubject)
          .catch((e) => console.error("Push error:", e));
      }
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
