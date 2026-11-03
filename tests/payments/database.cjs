const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '../..');
const migration = resolve(root, 'supabase/migrations/020_atomic_mp_payment.sql');
const user = '00000000-0000-4000-8000-000000000001';
const url = process.env.NQ_PAYMENTS_DATABASE_URL;

async function database() {
  let db;
  if (url) {
    const target = new URL(url);
    if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.pathname !== '/nq_payments_test') {
      throw new Error('Payment tests require a disposable local nq_payments_test database');
    }
    const { Client } = require('pg');
    db = new Client({ connectionString: url });
    await db.connect();
    db.exec = sql => db.query(sql);
    db.close = () => db.end();
  } else {
    const { PGlite } = require('@electric-sql/pglite');
    db = new PGlite();
  }
  await db.exec(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role; END IF;
    END $$;
    CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid PRIMARY KEY, is_premium boolean DEFAULT false, premium_plan text,
      premium_expires_at timestamptz, premium_updated_at timestamptz, mp_payment_id text
    );
    CREATE TABLE IF NOT EXISTS public.processed_payments (
      payment_id text PRIMARY KEY, user_id uuid NOT NULL, plan text NOT NULL,
      processed_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  if (existsSync(migration)) await db.exec(readFileSync(migration, 'utf8'));
  return db;
}

async function reset(db, values = {}) {
  await db.exec('DROP TRIGGER IF EXISTS reject_test_grant ON public.profiles; TRUNCATE public.processed_payments, public.profiles;');
  await db.query('INSERT INTO public.profiles(id,is_premium,premium_plan,premium_expires_at,mp_payment_id) VALUES($1,$2,$3,$4,$5)',
    [user, values.is_premium ?? false, values.premium_plan ?? null, values.premium_expires_at ?? null, values.mp_payment_id ?? null]);
}

async function processPayment(db, id, status = 'approved', plan = 'monthly', amount = 14.9, currency = 'BRL') {
  return (await db.query('SELECT public.process_mp_payment($1,$2,$3,$4,$5,$6) AS result',
    [id, user, plan, status, amount, currency])).rows[0].result;
}

async function profile(db) { return (await db.query('SELECT * FROM public.profiles WHERE id=$1', [user])).rows[0]; }
module.exports = { database, reset, processPayment, profile, user, root, url };
