export async function onRequestGet(context) {
  const { env, params } = context;
  const { id } = params;

  try {
    const vehicle = await env.DB.prepare(`
      SELECT * FROM vehicles WHERE id = ?
    `).bind(id).first();

    if (!vehicle) {
      return Response.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    const { results: timeline } = await env.DB.prepare(`
      SELECT * FROM timeline WHERE vehicle_id = ? ORDER BY created_at DESC
    `).bind(id).all();

    return Response.json({ ...vehicle, timeline });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { env, params, request } = context;
  const { id } = params;

  try {
    const data = await request.json();

    // If status is being updated, add to timeline
    if (data.status) {
      const current = await env.DB.prepare(`
        SELECT status FROM vehicles WHERE id = ?
      `).bind(id).first();

      if (current && current.status !== data.status) {
        await env.DB.prepare(`
          INSERT INTO timeline (vehicle_id, status, user_name, note)
          VALUES (?, ?, ?, ?)
        `).bind(
          id,
          data.status,
          data.user_name || 'Sistema',
          data.note || `Cambio a ${data.status}`
        ).run();
      }
    }

    // Build update query dynamically
    const fields = [];
    const values = [];

    if (data.status) { fields.push('status = ?'); values.push(data.status); }
    if (data.recon_cost !== undefined) { fields.push('recon_cost = ?'); values.push(data.recon_cost); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
    if (data.photo_url !== undefined) { fields.push('photo_url = ?'); values.push(data.photo_url); }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await env.DB.prepare(`
      UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
