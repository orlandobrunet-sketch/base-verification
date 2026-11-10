import { createClient } from 'npm:@supabase/supabase-js@2.106.0';
import { handleDeleteAccount } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const client = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

Deno.serve(req => handleDeleteAccount(req, client?.auth ?? null));
