-- LOCAL CANDIDATE ONLY. Not applied to a remote database.
-- Requires profiles.game_progress_version CAS migration already installed.
CREATE OR REPLACE FUNCTION public.guard_owner_authority_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE old_env jsonb; new_env jsonb; prior jsonb; next_state jsonb; parent_state jsonb;
 old_epoch bigint; new_epoch bigint; receipt jsonb; successor jsonb; item jsonb;
 old_rank integer; new_rank integer; path_states jsonb;
BEGIN
 old_env := OLD.game_progress->'ownerAuthority';
 new_env := NEW.game_progress->'ownerAuthority';
 IF old_env IS NOT NULL AND new_env IS NULL THEN
  RAISE EXCEPTION 'Owner authority downgrade' USING ERRCODE='40001';
 END IF;
 IF new_env IS NULL THEN RETURN NEW; END IF;
 -- A path is evidence, not a second state to merge. Validate its exact end
 -- before checking every edge with the same rules as a single snapshot.
 IF new_env ? 'transitionPath' THEN
  IF jsonb_typeof(new_env->'transitionPath') IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Invalid transition path' USING ERRCODE='22023'; END IF;
  path_states:=new_env->'transitionPath';
  IF jsonb_array_length(path_states)<1 OR jsonb_array_length(path_states)>129 OR
     path_states->-1 IS DISTINCT FROM new_env->'state' THEN
   RAISE EXCEPTION 'Invalid transition path bounds or final state' USING ERRCODE='22023'; END IF;
  IF old_env IS NULL THEN
   RAISE EXCEPTION 'Transition path requires existing authority' USING ERRCODE='40001'; END IF;
 ELSE
  path_states:=jsonb_build_array(new_env->'state');
 END IF;
 prior:=old_env->'state';
 IF old_env IS NOT NULL AND (new_env ? 'transitionPath' OR new_env->'state' IS DISTINCT FROM prior) THEN
  BEGIN parent_state:=(new_env->>'base')::jsonb;
  EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Invalid ancestor' USING ERRCODE='40001'; END;
  IF parent_state IS DISTINCT FROM prior THEN
   -- Exact replay of the stored, already verified envelope is harmless.
   -- Recheck its original edges, not a fabricated parent for a new branch.
   IF new_env ? 'transitionPath' AND new_env=old_env THEN prior:=parent_state;
   ELSE RAISE EXCEPTION 'Divergent authority' USING ERRCODE='40001'; END IF;
  END IF;
 END IF;
 FOR next_state IN SELECT value FROM jsonb_array_elements(path_states) LOOP
 IF new_env->>'format' IS DISTINCT FROM 'nq-owner-authority-v1' OR
    next_state->'protocol' IS DISTINCT FROM '1'::jsonb OR
    jsonb_typeof(next_state->'resetEpoch') IS DISTINCT FROM 'number' OR
    jsonb_typeof(next_state#>'{collections,knowledge}') IS DISTINCT FROM 'number' OR next_state->>'owner' IS DISTINCT FROM NEW.id::text OR
    jsonb_typeof(next_state->'collections') IS DISTINCT FROM 'object' OR
    jsonb_typeof(next_state#>'{collections,articles}') IS DISTINCT FROM 'array' OR
    jsonb_typeof(next_state->'receipts') IS DISTINCT FROM 'array' OR
    NOT (next_state ? 'save') OR jsonb_typeof(next_state->'save') NOT IN ('object','null') OR
    coalesce(next_state->>'resetEpoch','') !~ '^(0|[1-9][0-9]{0,15})$' OR
    coalesce(next_state#>>'{collections,knowledge}','') !~ '^(0|[1-9][0-9]{0,15})$' THEN
  RAISE EXCEPTION 'Invalid owner authority' USING ERRCODE='22023';
 END IF;
 new_epoch:=(next_state->>'resetEpoch')::bigint;
 IF new_epoch>9007199254740991 OR (next_state#>>'{collections,knowledge}')::bigint>9007199254740991 OR
  (next_state->'save'<>'null'::jsonb AND next_state#>>'{save,saveOwner}' IS DISTINCT FROM NEW.id::text) THEN
  RAISE EXCEPTION 'Invalid authority owner or amount' USING ERRCODE='22023';
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(next_state#>'{collections,articles}') LOOP
  IF jsonb_typeof(item)<>'number' OR item::text !~ '^(0|[1-9][0-9]{0,15})$' OR item::text::bigint>9007199254740991 THEN
   RAISE EXCEPTION 'Invalid article id' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM jsonb_array_elements(next_state#>'{collections,articles}')) <>
    (SELECT count(DISTINCT value) FROM jsonb_array_elements(next_state#>'{collections,articles}')) THEN
  RAISE EXCEPTION 'Duplicate articles' USING ERRCODE='22023'; END IF;
 FOR receipt IN SELECT value FROM jsonb_array_elements(next_state->'receipts') LOOP
  IF jsonb_typeof(receipt)<>'object' OR jsonb_typeof(receipt->'id') IS DISTINCT FROM 'string' OR
     jsonb_typeof(receipt->'journeyId') IS DISTINCT FROM 'string' OR coalesce(receipt->>'id','')='' OR coalesce(receipt->>'journeyId','')='' OR
     coalesce(receipt->>'phase','') NOT IN ('earned','prepared','consumed') OR
     (receipt->>'phase'<>'earned' AND jsonb_typeof(receipt->'reward') IS DISTINCT FROM 'object') THEN
   RAISE EXCEPTION 'Invalid receipt' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM jsonb_array_elements(next_state->'receipts')) <>
    (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(next_state->'receipts')) THEN
  RAISE EXCEPTION 'Duplicate receipts' USING ERRCODE='22023'; END IF;
 IF prior IS NULL THEN prior:=next_state; CONTINUE; END IF;
 IF next_state=prior THEN CONTINUE; END IF;
 old_epoch:=(prior->>'resetEpoch')::bigint;
 IF new_epoch<old_epoch THEN RAISE EXCEPTION 'Stale reset epoch' USING ERRCODE='40001'; END IF;
 IF new_epoch=old_epoch THEN
  IF next_state->'tombstone' IS DISTINCT FROM prior->'tombstone' OR
     next_state#>'{save,journeyId}' IS DISTINCT FROM prior#>'{save,journeyId}' OR
     next_state#>'{save,classBenefits,journeyId}' IS DISTINCT FROM prior#>'{save,classBenefits,journeyId}' OR
     next_state#>'{save,character}' IS DISTINCT FROM prior#>'{save,character}' OR
     next_state#>'{save,difficulty}' IS DISTINCT FROM prior#>'{save,difficulty}' OR
     (prior->'save'='null'::jsonb AND next_state->'save'<>'null'::jsonb) OR
     NOT ((next_state#>'{collections,articles}') @> (prior#>'{collections,articles}')) OR
     (next_state#>>'{collections,knowledge}')::bigint<(prior#>>'{collections,knowledge}')::bigint THEN
   RAISE EXCEPTION 'Authority regression' USING ERRCODE='40001'; END IF;
  FOR receipt IN SELECT value FROM jsonb_array_elements(prior->'receipts') LOOP
   SELECT value INTO successor FROM jsonb_array_elements(next_state->'receipts') WHERE value->>'id'=receipt->>'id';
   old_rank:=CASE receipt->>'phase' WHEN 'earned' THEN 0 WHEN 'prepared' THEN 1 ELSE 2 END;
   new_rank:=CASE successor->>'phase' WHEN 'earned' THEN 0 WHEN 'prepared' THEN 1 ELSE 2 END;
   IF successor IS NULL OR successor->>'journeyId' IS DISTINCT FROM receipt->>'journeyId' OR new_rank<old_rank OR
      (receipt ? 'reward' AND successor->'reward' IS DISTINCT FROM receipt->'reward') OR
      (old_rank=2 AND successor IS DISTINCT FROM receipt) THEN
    RAISE EXCEPTION 'Receipt regression' USING ERRCODE='40001'; END IF;
  END LOOP;
 ELSE
  IF new_epoch<>old_epoch+1 OR next_state#>>'{tombstone,epoch}' IS DISTINCT FROM new_epoch::text OR
     next_state->'receipts'<>'[]'::jsonb THEN RAISE EXCEPTION 'Unverified epoch transition' USING ERRCODE='40001'; END IF;
  IF next_state#>>'{tombstone,reason}'='reset' THEN
   IF next_state->'save'<>'null'::jsonb OR next_state->'collections'<>'{"articles":[],"knowledge":0}'::jsonb THEN
    RAISE EXCEPTION 'Invalid reset' USING ERRCODE='40001'; END IF;
  ELSIF next_state#>>'{tombstone,reason}'='journey' THEN
   IF next_state->'save'='null'::jsonb OR next_state->'collections' IS DISTINCT FROM prior->'collections' THEN
    RAISE EXCEPTION 'Invalid journey transition' USING ERRCODE='40001'; END IF;
  ELSE RAISE EXCEPTION 'Invalid epoch reason' USING ERRCODE='40001'; END IF;
 END IF;
 prior:=next_state;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER owner_authority_progress_guard BEFORE UPDATE OF game_progress ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION public.guard_owner_authority_progress();
REVOKE ALL ON FUNCTION public.guard_owner_authority_progress() FROM PUBLIC, anon, authenticated;
