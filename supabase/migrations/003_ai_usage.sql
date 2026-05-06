-- Track daily AI feature usage per authenticated user
-- Edge functions use service role to read/write; users read their own rows via RLS.

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id   UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature   TEXT    NOT NULL CHECK (feature IN ('mentor', 'diagnosis')),
  date      DATE    NOT NULL DEFAULT CURRENT_DATE,
  count     INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, feature, date)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own usage (for client-side display)
CREATE POLICY "read own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts/updates only via service role (edge functions)
-- No client INSERT/UPDATE policy needed.
