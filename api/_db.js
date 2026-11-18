import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';

export const sql = neon(process.env.DATABASE_URL);

let ready = null;
export function setup() {
  if (!ready) ready = sql`CREATE TABLE IF NOT EXISTS mensajes (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente',
      ip_hash TEXT,
      creado TIMESTAMPTZ NOT NULL DEFAULT now()
    )`.catch(e => { ready = null; throw e; });
  return ready;
}

export function ipHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  return crypto.createHash('sha256').update(ip + (process.env.ADMIN_KEY || '')).digest('hex').slice(0, 24);
}

export function isAdmin(req) {
  const k = process.env.ADMIN_KEY;
  const got = String(req.headers['x-admin-key'] || '');
  if (!k || got.length !== k.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(k));
}
