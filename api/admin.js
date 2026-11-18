import { sql, setup, isAdmin } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' });
  try {
    await setup();
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, nombre, mensaje, estado, creado FROM mensajes
                             WHERE estado <> 'borrado' ORDER BY (estado = 'pendiente') DESC, creado DESC LIMIT 500`;
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = parseInt(b.id, 10);
      const estado = { aprobar: 'aprobado', ocultar: 'pendiente', borrar: 'borrado' }[b.accion];
      if (!id || !estado) return res.status(400).json({ error: 'Petición inválida' });
      await sql`UPDATE mensajes SET estado = ${estado} WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error de base de datos' });
  }
}
