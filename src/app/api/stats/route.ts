export const runtime = "edge";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET() {
  const { env } = getRequestContext();
  const db = env.DB;

  try {
    // Total vehicles
    const totalResult = await db.prepare("SELECT COUNT(*) as count FROM vehicles").first() as { count: number };
    const total = totalResult?.count || 0;

    // By status
    const { results: statusResults } = await db.prepare(`
      SELECT status, COUNT(*) as count FROM vehicles GROUP BY status
    `).all();

    const byStatus: Record<string, number> = {};
    for (const row of (statusResults || []) as { status: string; count: number }[]) {
      byStatus[row.status] = row.count;
    }

    // Total invested and average
    const investedResult = await db.prepare(`
      SELECT
        SUM(COALESCE(purchase_price, 0) + COALESCE(transport_cost, 0) + COALESCE(recon_cost, 0)) as total,
        AVG(COALESCE(purchase_price, 0) + COALESCE(transport_cost, 0) + COALESCE(recon_cost, 0)) as avg
      FROM vehicles
    `).first() as { total: number; avg: number };

    // Average days in inventory
    const daysResult = await db.prepare(`
      SELECT AVG(julianday('now') - julianday(created_at)) as avg_days
      FROM vehicles
      WHERE status != 'VENDIDO'
    `).first() as { avg_days: number };

    return Response.json({
      total,
      byStatus,
      totalInvested: Math.round(investedResult?.total || 0),
      avgCost: Math.round(investedResult?.avg || 0),
      avgDays: Math.round(daysResult?.avg_days || 0),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
