import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  const { env } = getRequestContext();

  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM vehicles ORDER BY created_at DESC
    `).all();

    return Response.json(results || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { env } = getRequestContext();

  try {
    const data = await request.json();

    const result = await env.DB.prepare(`
      INSERT INTO vehicles (vin, stock_no, year, make, model, trim, color, miles, status, auction, payment_method, flooring_company, purchase_price, transport_cost, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.vin,
      data.stock_no || null,
      data.year || null,
      data.make || null,
      data.model || null,
      data.trim || null,
      data.color || null,
      data.miles || null,
      "SUBASTA",
      data.auction || null,
      data.payment_method || "CASH",
      data.flooring_company || null,
      data.purchase_price || 0,
      data.transport_cost || 0,
      data.notes || null
    ).run();

    // Add to timeline
    await env.DB.prepare(`
      INSERT INTO timeline (vehicle_id, status, user_name, note)
      VALUES (?, ?, ?, ?)
    `).bind(
      result.meta.last_row_id,
      "SUBASTA",
      data.user_name || "Sistema",
      "Vehículo creado"
    ).run();

    return Response.json({ success: true, id: result.meta.last_row_id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
