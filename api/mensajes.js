import { sql, setup, ipHash } from './_db.js';

const clean = s => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await setup();
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, nombre, mensaje, creado FROM mensajes
                             WHERE estado = 'aprobado' ORDER BY creado DESC LIMIT 200`;
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (b.web) return res.status(200).json({ ok: true });            // trampa para bots
      const nombre = clean(b.nombre).slice(0, 40);
      const mensaje = clean(b.mensaje).slice(0, 280);
      if (nombre.length < 2 || mensaje.length < 3) return res.status(400).json({ error: 'Escribe tu nombre y un mensaje.' });
      const h = ipHash(req);
      const [{ n }] = await sql`SELECT count(*)::int AS n FROM mensajes
                                WHERE ip_hash = ${h} AND creado > now() - interval '10 minutes'`;
      if (n >= 3) return res.status(429).json({ error: 'Ya enviaste varios mensajes. Intenta en unos minutos.' });
      await sql`INSERT INTO mensajes (nombre, mensaje, ip_hash) VALUES (${nombre}, ${mensaje}, ${h})`;
      return res.status(201).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'No se pudo conectar con el muro.' });
  }
}
