-- Migration 004: Push subscription storage for Web Push notifications
-- Each row = one browser/device subscription endpoint

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth_key      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (endpoint)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users manage only their own subscriptions; anonymous subscriptions (user_id IS NULL)
-- are inserted without auth and readable only via service role.
CREATE POLICY "users_own_subscriptions"
  ON push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
