alter table public.chema_changes add column delta jsonb;
-- Business conflicts are terminal, not serialization failures. Avoid infrastructure retries of an unchanged revision.
create or replace function public.chema_commit(p_space text,p_user uuid,p_base bigint,p_epoch text,p_command jsonb,p_result jsonb,p_fulfilled text[]) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare s public.chema_spaces; r public.chema_receipts; m public.chema_members; event jsonb; task text; snap jsonb;
begin
 -- Lock serializes sequence assignment and all inventory/receipt/task effects.
 select * into s from public.chema_spaces where id=p_space for update;
 if not found then raise exception 'SPACE_NOT_FOUND'; end if;
 select * into m from public.chema_members where space_id=p_space and user_id=p_user and active for share;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 if (p_command->>'expectedUserId') is distinct from p_user::text then raise exception 'SESSION_CHANGED' using errcode='42501'; end if;
 select * into r from public.chema_receipts where space_id=p_space and operation_id=p_command->>'operationId';
 if found then
  if r.user_id<>p_user or r.command->'action'<>p_command->'action' or r.command->>'payloadHash'<>p_command->>'payloadHash' then raise exception 'OPERATION_ID_REUSED'; end if;
  return r.result || jsonb_build_object('snapshot',public.chema_snapshot(p_space,p_user));
 end if;
 if s.epoch<>p_epoch then raise exception 'EPOCH_CHANGED' using errcode='P0001'; end if;
 if s.revision<>p_base then raise exception 'REVISION_CHANGED' using errcode='P0001'; end if;
 if p_result->>'kind'<>'CONFIRMED' then raise exception 'INVALID_RESULT'; end if;
 snap=p_result->'snapshot';
 if (snap#>>'{member,role}') is distinct from m.role or (snap#>>'{member,uid}') is distinct from p_user::text then raise exception 'PERMISSION_CHANGED' using errcode='42501'; end if;
 if (snap->>'cursor')::bigint<>s.revision+1 or snap->>'epoch'<>s.epoch or snap->>'spaceId'<>s.id then raise exception 'INVALID_SNAPSHOT'; end if;
 -- Rows are server-generated; no privileged RPC is executable by a client role.
 foreach task in array coalesce(p_fulfilled,array[]::text[]) loop
  insert into public.chema_task_fulfillments(space_id,task_id,operation_id) values(p_space,task,p_command->>'operationId');
 end loop;
 event=coalesce(snap#>'{state,logs,0}','{}'::jsonb)-'payloadInverso';
 -- Keep inverse only in the current snapshot. Historical events/receipts never retain full inverse snapshots.
 update public.chema_spaces set revision=s.revision+1,snapshot=snap where id=p_space;
 insert into public.chema_changes(space_id,sequence,operation_id,event,delta) values(p_space,s.revision+1,p_command->>'operationId',event,p_result->'delta');
 insert into public.chema_receipts(space_id,operation_id,user_id,command,result,sequence)
 values(p_space,p_command->>'operationId',p_user,p_command,p_result-'snapshot'-'delta',s.revision+1);
 return p_result;
end $$;


-- Hold the aggregate and membership stable for the complete observation.
create function public.chema_delta_pull(p_space text,p_user uuid,p_cursor bigint,p_epoch text,p_watermark bigint default null,p_limit integer default 100) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare s public.chema_spaces; w bigint; endpoint bigint; changes jsonb; n bigint;
begin
 select * into s from public.chema_spaces where id=p_space for share;
 if not found then raise exception 'SPACE_NOT_FOUND'; end if;
 perform 1 from public.chema_members where space_id=p_space and user_id=p_user and active for share;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 w=coalesce(p_watermark,s.revision);
 if p_cursor is null or p_cursor<0 or w<p_cursor or w>s.revision then raise exception 'INVALID_CURSOR'; end if;
 endpoint=least(w,p_cursor+least(greatest(coalesce(p_limit,100),1),200));
 select count(*),coalesce(jsonb_agg(delta order by sequence),'[]'::jsonb) into n,changes
 from public.chema_changes where space_id=p_space and sequence>p_cursor and sequence<=endpoint and delta is not null;
 if p_epoch is distinct from s.epoch or n<>endpoint-p_cursor then
  return jsonb_build_object('kind','RESET','snapshot',public.chema_snapshot(p_space,p_user),'watermark',s.revision,'epoch',s.epoch);
 end if;
 return jsonb_build_object('kind','DELTA','changes',changes,'watermark',w,'epoch',s.epoch,'hasMore',endpoint<w) || case when endpoint=w and w=s.revision and s.snapshot#>'{state,logs,0}' is not null then jsonb_build_object('currentLog',s.snapshot#>'{state,logs,0}') else '{}'::jsonb end;
end $$;
revoke execute on function public.chema_delta_pull(text,uuid,bigint,text,bigint,integer) from public,anon,authenticated;
grant execute on function public.chema_delta_pull(text,uuid,bigint,text,bigint,integer) to service_role;
