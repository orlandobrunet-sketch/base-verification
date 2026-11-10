BEGIN;

-- GoTrue removes the account and its sessions. Make the two remaining
-- account-owned relations follow that same transaction.
ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.leaderboard
  DROP CONSTRAINT leaderboard_user_id_fkey,
  ADD CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- processed_payments deliberately has no auth.users FK. Its transaction
-- identifiers remain available for transaction reconciliation.
COMMIT;
