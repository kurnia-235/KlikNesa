import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tidak lagi digunakan setelah migrasi ke Supabase Auth murni.
export const serverUrl = import.meta.env.VITE_SERVER_URL ?? '';
