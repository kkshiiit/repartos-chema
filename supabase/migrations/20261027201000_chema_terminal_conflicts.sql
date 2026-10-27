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
 insert into public.chema_changes(space_id,sequence,operation_id,event) values(p_space,s.revision+1,p_command->>'operationId',event);
 insert into public.chema_receipts(space_id,operation_id,user_id,command,result,sequence)
 values(p_space,p_command->>'operationId',p_user,p_command,p_result-'snapshot',s.revision+1);
 return p_result;
end $$;

create or replace function public.chema_publish_route(p_space text,p_user uuid,p_expected bigint,p_route jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_route public.chema_routes; snap jsonb; stop_id text; assigned text; stamp timestamptz := clock_timestamp();
begin
 select snapshot into snap from public.chema_spaces where id=p_space for update;
 perform 1 from public.chema_members where space_id=p_space and user_id=p_user and active;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 select * into current_route from public.chema_routes where space_id=p_space;
 if p_expected is null or p_expected < 0 or coalesce(current_route.revision,0)<>p_expected then raise exception 'ROUTE_CHANGED' using errcode='P0001'; end if;
 if jsonb_typeof(p_route) is distinct from 'object' or p_route->'schema' is distinct from '1'::jsonb or jsonb_typeof(p_route->'ids') is distinct from 'array' or jsonb_typeof(p_route->'tasks') is distinct from 'object' or jsonb_typeof(p_route->'assignments') is distinct from 'object' or octet_length(p_route::text)>200000 then raise exception 'ROUTE_INVALID'; end if;
 if exists(select 1 from jsonb_array_elements(p_route->'ids') v where jsonb_typeof(v) <> 'string') or exists(select 1 from jsonb_object_keys(p_route) k where k not in ('schema','ids','tasks','assignments')) or jsonb_array_length(p_route->'ids')>500 or (select count(*) from jsonb_object_keys(p_route->'tasks'))<>jsonb_array_length(p_route->'ids') or (select count(distinct v) from jsonb_array_elements(p_route->'ids') v)<>jsonb_array_length(p_route->'ids') then raise exception 'ROUTE_INVALID'; end if;
 for stop_id in select jsonb_array_elements_text(p_route->'ids') loop
  if stop_id !~ '^[a-zA-Z0-9_-]{1,100}$' or jsonb_typeof(p_route->'tasks'->stop_id) is distinct from 'string' or (snap->'tasks'->stop_id->>'id') is null or p_route->'tasks'->>stop_id is distinct from snap->'tasks'->stop_id->>'id' then raise exception 'ROUTE_TASK_CHANGED' using errcode='P0001'; end if;
 end loop;
 for stop_id,assigned in select key,value from jsonb_each_text(p_route->'assignments') loop
  if not (p_route->'ids' ? stop_id) or jsonb_typeof(p_route->'assignments'->stop_id) is distinct from 'string' or not exists(select 1 from public.chema_members where space_id=p_space and user_id::text=assigned and active) then raise exception 'ROUTE_ASSIGNMENT_INVALID'; end if;
 end loop;
 insert into public.chema_routes(space_id,revision,route,user_id,updated_at) values(p_space,p_expected+1,p_route,p_user,stamp)
 on conflict(space_id) do update set revision=excluded.revision,route=excluded.route,user_id=excluded.user_id,updated_at=excluded.updated_at;
 insert into public.chema_route_history values(p_space,p_expected+1,p_route,p_user,stamp);
 return jsonb_build_object('revision',p_expected+1,'route',p_route,'userId',p_user,'updatedAt',stamp);
end $$;
