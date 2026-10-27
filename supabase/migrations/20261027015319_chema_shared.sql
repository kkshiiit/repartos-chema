-- Chema shared protocol v1. Server-only mutations; public clients never write stock.
create schema if not exists chema_private;
revoke all on schema chema_private from public, anon, authenticated;
create table public.chema_spaces (
 id text primary key default gen_random_uuid()::text,
 nombre text not null check(length(nombre) between 1 and 100),
 epoch text not null default gen_random_uuid()::text,
 revision bigint not null default 0 check(revision>=0),
 snapshot jsonb not null,
 bootstrap_fingerprint text,
 created_at timestamptz not null default now()
);
create table public.chema_members (
 space_id text not null references public.chema_spaces(id),
 user_id uuid not null references auth.users(id),
 nombre text not null check(length(nombre) between 1 and 80),
 role text not null check(role in ('ADMIN','OPERADOR')),
 active boolean not null default true,
 primary key(space_id,user_id)
);
create table public.chema_receipts (
 space_id text not null references public.chema_spaces(id),
 operation_id text not null,
 user_id uuid not null,
 command jsonb not null,
 result jsonb not null,
 sequence bigint not null,
 created_at timestamptz not null default now(),
 primary key(space_id,operation_id)
);
create table public.chema_changes (
 space_id text not null references public.chema_spaces(id),
 sequence bigint not null,
 operation_id text not null,
 event jsonb not null,
 created_at timestamptz not null default now(),
 primary key(space_id,sequence)
);
create table public.chema_task_fulfillments (
 space_id text not null references public.chema_spaces(id),
 task_id text not null,
 operation_id text not null,
 primary key(space_id,task_id)
);
create table public.chema_invitations (
 token_hash text primary key,
 space_id text references public.chema_spaces(id),
 role text not null check(role in ('ADMIN','OPERADOR')),
 created_by uuid,
 expires_at timestamptz not null,
 used_by uuid,
 used_at timestamptz,
 revoked boolean not null default false
);
create table public.chema_routes (
 space_id text primary key references public.chema_spaces(id),
 revision bigint not null default 0,
 route jsonb not null,
 user_id uuid not null,
 updated_at timestamptz not null default now()
);
alter table public.chema_spaces enable row level security;
alter table public.chema_members enable row level security;
alter table public.chema_receipts enable row level security;
alter table public.chema_changes enable row level security;
alter table public.chema_task_fulfillments enable row level security;
alter table public.chema_invitations enable row level security;
alter table public.chema_routes enable row level security;
revoke all on public.chema_spaces,public.chema_members,public.chema_receipts,public.chema_changes,public.chema_task_fulfillments,public.chema_invitations,public.chema_routes from anon,authenticated;
grant select on public.chema_members to authenticated;
create policy chema_own_membership on public.chema_members for select to authenticated using (user_id=(select auth.uid()) and active);
grant all on public.chema_spaces,public.chema_members,public.chema_receipts,public.chema_changes,public.chema_task_fulfillments,public.chema_invitations,public.chema_routes to service_role;

create function public.chema_snapshot(p_space text,p_user uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare s public.chema_spaces; m public.chema_members;
begin
 select * into m from public.chema_members where space_id=p_space and user_id=p_user and active;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 select * into s from public.chema_spaces where id=p_space;
 return s.snapshot || jsonb_build_object('spaceId',s.id,'epoch',s.epoch,'cursor',s.revision,'member',jsonb_build_object('uid',m.user_id,'nombre',m.nombre,'role',m.role));
end $$;

create function public.chema_receipt(p_space text,p_user uuid,p_operation text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.chema_receipts;
begin
 perform public.chema_snapshot(p_space,p_user);
 select * into r from public.chema_receipts where space_id=p_space and operation_id=p_operation and user_id=p_user;
 if not found then return null; end if;
 return r.result || jsonb_build_object('snapshot',public.chema_snapshot(p_space,p_user));
end $$;

create function public.chema_commit(p_space text,p_user uuid,p_base bigint,p_epoch text,p_command jsonb,p_result jsonb,p_fulfilled text[]) returns jsonb
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
 if s.epoch<>p_epoch then raise exception 'EPOCH_CHANGED' using errcode='40001'; end if;
 if s.revision<>p_base then raise exception 'REVISION_CHANGED' using errcode='40001'; end if;
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

create function public.chema_pull(p_space text,p_user uuid,p_cursor bigint,p_limit integer default 100) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare snap jsonb; events jsonb;
begin
 snap=public.chema_snapshot(p_space,p_user);
 select coalesce(jsonb_agg(x order by (x->>'sequence')::bigint),'[]'::jsonb) into events
 from (select jsonb_build_object('sequence',sequence,'event',event,'operationId',operation_id) as x from public.chema_changes
 where space_id=p_space and sequence>p_cursor and sequence<=(snap->>'cursor')::bigint order by sequence limit least(greatest(p_limit,1),200)) q;
 return jsonb_build_object('snapshot',snap,'events',events,'watermark',(snap->>'cursor')::bigint,'epoch',snap->>'epoch');
end $$;

create function public.chema_join(p_hash text,p_user uuid,p_name text,p_snapshot jsonb default null,p_fingerprint text default null) returns text
language plpgsql security invoker set search_path='' as $$
declare invitation public.chema_invitations; sid text; eph text;
begin
 select * into invitation from public.chema_invitations where token_hash=p_hash for update;
 if not found or invitation.revoked or invitation.expires_at<=now() then raise exception 'INVITATION_INVALID' using errcode='42501'; end if;
 if invitation.used_by is not null then
  if invitation.used_by=p_user then return invitation.space_id; end if;
  raise exception 'INVITATION_USED' using errcode='42501';
 end if;
 if length(trim(p_name))<1 or length(p_name)>80 then raise exception 'NAME_INVALID'; end if;
 sid=invitation.space_id;
 if sid is null then
  if invitation.role<>'ADMIN' or p_snapshot is null then raise exception 'BOOTSTRAP_REQUIRED'; end if;
  sid=gen_random_uuid()::text; eph=gen_random_uuid()::text;
  insert into public.chema_spaces(id,nombre,epoch,snapshot,bootstrap_fingerprint)
  values(sid,'Grupo Chema',eph,p_snapshot || jsonb_build_object('spaceId',sid,'epoch',eph,'cursor',0),p_fingerprint);
 end if;
 insert into public.chema_members(space_id,user_id,nombre,role) values(sid,p_user,trim(p_name),invitation.role);
 update public.chema_invitations set used_by=p_user,used_at=now(),space_id=sid where token_hash=p_hash;
 return sid;
end $$;

create function public.chema_publish_route(p_space text,p_user uuid,p_expected bigint,p_route jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_route public.chema_routes; member public.chema_members;
begin
 perform 1 from public.chema_spaces where id=p_space for update;
 select * into member from public.chema_members where space_id=p_space and user_id=p_user and active;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 select * into current_route from public.chema_routes where space_id=p_space;
 if coalesce(current_route.revision,0)<>p_expected then raise exception 'ROUTE_CHANGED' using errcode='40001'; end if;
 insert into public.chema_routes(space_id,revision,route,user_id) values(p_space,p_expected+1,p_route,p_user)
 on conflict(space_id) do update set revision=excluded.revision,route=excluded.route,user_id=excluded.user_id,updated_at=now();
 return jsonb_build_object('revision',p_expected+1,'route',p_route,'userId',p_user,'updatedAt',now());
end $$;
revoke execute on function public.chema_snapshot(text,uuid),public.chema_receipt(text,uuid,text),public.chema_commit(text,uuid,bigint,text,jsonb,jsonb,text[]),public.chema_pull(text,uuid,bigint,integer),public.chema_join(text,uuid,text,jsonb,text),public.chema_publish_route(text,uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.chema_snapshot(text,uuid),public.chema_receipt(text,uuid,text),public.chema_commit(text,uuid,bigint,text,jsonb,jsonb,text[]),public.chema_pull(text,uuid,bigint,integer),public.chema_join(text,uuid,text,jsonb,text),public.chema_publish_route(text,uuid,bigint,jsonb) to service_role;
create function public.chema_verify_receipt(p_space text,p_user uuid,p_command jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.chema_receipts;
begin
 perform public.chema_snapshot(p_space,p_user);
 if (p_command->>'expectedUserId') is distinct from p_user::text then raise exception 'SESSION_CHANGED' using errcode='42501'; end if;
 select * into r from public.chema_receipts where space_id=p_space and operation_id=p_command->>'operationId';
 if not found then return null; end if;
 if r.user_id<>p_user or r.command->'action'<>p_command->'action' or r.command->>'payloadHash'<>p_command->>'payloadHash' then raise exception 'OPERATION_ID_REUSED'; end if;
 return r.result || jsonb_build_object('snapshot',public.chema_snapshot(p_space,p_user));
end $$;
create function public.chema_history(p_space text,p_user uuid,p_before bigint,p_limit integer default 100) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare records jsonb;
begin
 perform public.chema_snapshot(p_space,p_user);
 select coalesce(jsonb_agg(x order by (x->>'sequence')::bigint desc),'[]'::jsonb) into records from
 (select jsonb_build_object('sequence',sequence,'event',event) as x from public.chema_changes where space_id=p_space and sequence<p_before order by sequence desc limit least(greatest(p_limit,1),200)) q;
 return records;
end $$;
create function public.chema_invite(p_space text,p_user uuid,p_hash text) returns void
language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.chema_members where space_id=p_space and user_id=p_user and active and role='ADMIN';
 if not found then raise exception 'PERMISSION_REQUIRED' using errcode='42501'; end if;
 insert into public.chema_invitations(token_hash,space_id,role,created_by,expires_at) values(p_hash,p_space,'OPERADOR',p_user,now()+interval '48 hours');
end $$;
create function public.chema_revoke(p_space text,p_user uuid,p_target uuid) returns void
language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.chema_spaces where id=p_space for update;
 perform 1 from public.chema_members where space_id=p_space and user_id=p_user and active and role='ADMIN';
 if not found then raise exception 'PERMISSION_REQUIRED' using errcode='42501'; end if;
 if p_target=p_user then raise exception 'OWNER_CANNOT_REVOKE_SELF'; end if;
 update public.chema_members set active=false where space_id=p_space and user_id=p_target and role<>'ADMIN';
end $$;
revoke execute on function public.chema_verify_receipt(text,uuid,jsonb),public.chema_history(text,uuid,bigint,integer),public.chema_invite(text,uuid,text),public.chema_revoke(text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.chema_verify_receipt(text,uuid,jsonb),public.chema_history(text,uuid,bigint,integer),public.chema_invite(text,uuid,text),public.chema_revoke(text,uuid,uuid) to service_role;
alter table public.chema_invitations add column enrollment_attempts integer not null default 0;
create function public.chema_enrollment_check(p_hash text) returns void
language plpgsql security invoker set search_path='' as $$
declare i public.chema_invitations;
begin
 select * into i from public.chema_invitations where token_hash=p_hash for update;
 if not found or i.revoked or i.expires_at<=now() or i.enrollment_attempts>=10 then raise exception 'INVITATION_INVALID' using errcode='42501'; end if;
 update public.chema_invitations set enrollment_attempts=enrollment_attempts+1 where token_hash=p_hash;
end $$;
revoke execute on function public.chema_enrollment_check(text) from public,anon,authenticated;
grant execute on function public.chema_enrollment_check(text) to service_role;
create index chema_members_user_idx on public.chema_members(user_id) where active;
create function public.chema_spaces_for_user(p_user uuid) returns jsonb
language sql security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('spaceId',s.id,'nombre',s.nombre,'role',m.role,'uid',m.user_id)),'[]'::jsonb)
 from public.chema_members m join public.chema_spaces s on s.id=m.space_id where m.user_id=p_user and m.active;
$$;
create function public.chema_members_for_space(p_space text,p_user uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform public.chema_snapshot(p_space,p_user);
 select coalesce(jsonb_agg(jsonb_build_object('uid',user_id,'nombre',nombre,'role',role,'active',active)),'[]'::jsonb) into result from public.chema_members where space_id=p_space;
 return result;
end $$;
create function public.chema_get_route(p_space text,p_user uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform public.chema_snapshot(p_space,p_user);
 select jsonb_build_object('route',route,'revision',revision,'userId',user_id,'updatedAt',updated_at) into result from public.chema_routes where space_id=p_space;
 return result;
end $$;
revoke execute on function public.chema_spaces_for_user(uuid),public.chema_members_for_space(text,uuid),public.chema_get_route(text,uuid) from public,anon,authenticated;
grant execute on function public.chema_spaces_for_user(uuid),public.chema_members_for_space(text,uuid),public.chema_get_route(text,uuid) to service_role;
