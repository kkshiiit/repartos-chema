-- Route plans are separate from commercial inventory and retain every published version.
create table public.chema_route_history (
 space_id text not null references public.chema_spaces(id),
 revision bigint not null,
 route jsonb not null,
 user_id uuid not null,
 updated_at timestamptz not null,
 primary key(space_id,revision)
);
alter table public.chema_route_history enable row level security;
revoke all on public.chema_route_history from public,anon,authenticated;
grant all on public.chema_route_history to service_role;
insert into public.chema_route_history select space_id,revision,route,user_id,updated_at from public.chema_routes on conflict do nothing;
create or replace function public.chema_publish_route(p_space text,p_user uuid,p_expected bigint,p_route jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_route public.chema_routes; snap jsonb; stop_id text; assigned text; stamp timestamptz := clock_timestamp();
begin
 select snapshot into snap from public.chema_spaces where id=p_space for update;
 perform 1 from public.chema_members where space_id=p_space and user_id=p_user and active;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 select * into current_route from public.chema_routes where space_id=p_space;
 if p_expected is null or p_expected < 0 or coalesce(current_route.revision,0)<>p_expected then raise exception 'ROUTE_CHANGED' using errcode='40001'; end if;
 if jsonb_typeof(p_route) is distinct from 'object' or p_route->'schema' is distinct from '1'::jsonb or jsonb_typeof(p_route->'ids') is distinct from 'array' or jsonb_typeof(p_route->'tasks') is distinct from 'object' or jsonb_typeof(p_route->'assignments') is distinct from 'object' or octet_length(p_route::text)>200000 then raise exception 'ROUTE_INVALID'; end if;
 if exists(select 1 from jsonb_array_elements(p_route->'ids') v where jsonb_typeof(v) <> 'string') or exists(select 1 from jsonb_object_keys(p_route) k where k not in ('schema','ids','tasks','assignments')) or jsonb_array_length(p_route->'ids')>500 or (select count(*) from jsonb_object_keys(p_route->'tasks'))<>jsonb_array_length(p_route->'ids') or (select count(distinct v) from jsonb_array_elements(p_route->'ids') v)<>jsonb_array_length(p_route->'ids') then raise exception 'ROUTE_INVALID'; end if;
 for stop_id in select jsonb_array_elements_text(p_route->'ids') loop
  if stop_id !~ '^[a-zA-Z0-9_-]{1,100}$' or jsonb_typeof(p_route->'tasks'->stop_id) is distinct from 'string' or (snap->'tasks'->stop_id->>'id') is null or p_route->'tasks'->>stop_id is distinct from snap->'tasks'->stop_id->>'id' then raise exception 'ROUTE_TASK_CHANGED' using errcode='40001'; end if;
 end loop;
 for stop_id,assigned in select key,value from jsonb_each_text(p_route->'assignments') loop
  if not (p_route->'ids' ? stop_id) or jsonb_typeof(p_route->'assignments'->stop_id) is distinct from 'string' or not exists(select 1 from public.chema_members where space_id=p_space and user_id::text=assigned and active) then raise exception 'ROUTE_ASSIGNMENT_INVALID'; end if;
 end loop;
 insert into public.chema_routes(space_id,revision,route,user_id,updated_at) values(p_space,p_expected+1,p_route,p_user,stamp)
 on conflict(space_id) do update set revision=excluded.revision,route=excluded.route,user_id=excluded.user_id,updated_at=excluded.updated_at;
 insert into public.chema_route_history values(p_space,p_expected+1,p_route,p_user,stamp);
 return jsonb_build_object('revision',p_expected+1,'route',p_route,'userId',p_user,'updatedAt',stamp);
end $$;
create function public.chema_route_versions(p_space text,p_user uuid,p_before bigint default 9223372036854775807) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 perform public.chema_snapshot(p_space,p_user);
 select coalesce(jsonb_agg(v order by (v->>'revision')::bigint desc),'[]'::jsonb) into result from (
 select jsonb_build_object('revision',revision,'route',route,'userId',user_id,'updatedAt',updated_at) v from public.chema_route_history where space_id=p_space and revision<p_before order by revision desc limit 50) history;
 return result;
end $$;
revoke execute on function public.chema_route_versions(text,uuid,bigint) from public,anon,authenticated;
grant execute on function public.chema_route_versions(text,uuid,bigint) to service_role;
