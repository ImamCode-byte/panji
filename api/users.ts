import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DOMAIN = 'panji.local';
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!url || !key) return res.status(500).json({ error: 'Server belum dikonfigurasi (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const { data: au } = await sb.auth.getUser(token);
  if (!au.user) return res.status(401).json({ error: 'Belum masuk.' });
  const { data: me } = await sb.from('profiles').select('role').eq('id', au.user.id).maybeSingle();
  if (me?.role !== 'admin') return res.status(403).json({ error: 'Khusus admin.' });

  const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {};
  const fail = (code: number, error: string) => res.status(code).json({ error });

  try {
    if (req.method === 'GET') {
      const { data, error } = await sb.from('profiles').select('*').order('created_at');
      if (error) return fail(500, error.message);
      return res.json({ users: data });
    }
    if (req.method === 'POST') {
      const username = String(body.username ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      if (!/^[a-z0-9._-]{3,24}$/.test(username)) return fail(400, 'Username 3–24 karakter: huruf kecil, angka, titik, strip.');
      if (password.length < 6) return fail(400, 'Kata sandi minimal 6 karakter.');
      const role = body.role === 'admin' ? 'admin' : 'juri';
      const { data, error } = await sb.auth.admin.createUser({
        email: `${username}@${DOMAIN}`, password, email_confirm: true,
        user_metadata: { username, name: body.name ?? username },
      });
      if (error || !data.user) return fail(400, error?.message?.includes('already') ? 'Username sudah dipakai.' : error?.message ?? 'Gagal membuat akun.');
      const { error: e2 } = await sb.from('profiles').upsert({
        id: data.user.id, username, name: String(body.name ?? username), role,
        contests: Array.isArray(body.contests) ? body.contests : [],
      });
      if (e2) return fail(500, e2.message);
      return res.json({ ok: true, id: data.user.id });
    }
    if (req.method === 'PATCH') {
      const id = String(body.id ?? '');
      if (!id) return fail(400, 'id wajib.');
      if (body.password) {
        if (String(body.password).length < 6) return fail(400, 'Kata sandi minimal 6 karakter.');
        const { error } = await sb.auth.admin.updateUserById(id, { password: String(body.password) });
        if (error) return fail(400, error.message);
      }
      const patch: Record<string, unknown> = {};
      if (typeof body.name === 'string') patch.name = body.name;
      if (Array.isArray(body.contests)) patch.contests = body.contests;
      if (body.role === 'admin' || body.role === 'juri') {
        if (id === au.user.id && body.role !== 'admin') return fail(400, 'Tidak bisa menurunkan peran akun sendiri.');
        patch.role = body.role;
      }
      if (Object.keys(patch).length) {
        const { error } = await sb.from('profiles').update(patch).eq('id', id);
        if (error) return fail(500, error.message);
      }
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const id = String(req.query.id ?? body.id ?? '');
      if (!id) return fail(400, 'id wajib.');
      if (id === au.user.id) return fail(400, 'Tidak bisa menghapus akun sendiri.');
      const { error } = await sb.auth.admin.deleteUser(id);
      if (error) return fail(400, error.message);
      return res.json({ ok: true });
    }
    return fail(405, 'Metode tidak didukung.');
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : 'Kesalahan server.');
  }
}
