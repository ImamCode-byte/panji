import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const DEMO = import.meta.env.VITE_DEMO === '1' || !url || !anon;
export const sb = DEMO ? null : createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true } });
export const EMAIL_DOMAIN = 'panji.local';
