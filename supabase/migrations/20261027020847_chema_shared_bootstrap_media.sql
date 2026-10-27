-- Explicit once-only import into an empty team; no automatic local overwrite or summation.
create table public.chema_imported_history (
 space_id text not null references public.chema_spaces(id),
 position bigint not null,
 event jsonb not null,
 primary key(space_id,position)
);
alter table public.chema_imported_history enable row level security;
revoke all on public.chema_imported_history from anon,authenticated;
grant all on public.chema_imported_history to service_role;
create function public.chema_bootstrap(p_space text,p_user uuid,p_snapshot jsonb,p_fingerprint text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare s public.chema_spaces; item jsonb; idx bigint=0;
begin
 select * into s from public.chema_spaces where id=p_space for update;
 perform 1 from public.chema_members where space_id=p_space and user_id=p_user and role='ADMIN' and active for share;
 if not found then raise exception 'PERMISSION_REQUIRED' using errcode='42501'; end if;
 if s.bootstrap_fingerprint=p_fingerprint then return public.chema_snapshot(p_space,p_user); end if;
 if s.bootstrap_fingerprint is not null or s.revision<>0 or coalesce(jsonb_array_length(s.snapshot#>'{state,obras}'),0)<>0 or coalesce(jsonb_array_length(s.snapshot#>'{state,materiales}'),0)<>0 then raise exception 'BOOTSTRAP_NOT_EMPTY' using errcode='40001'; end if;
 for item in select value from jsonb_array_elements(p_snapshot#>'{state,logs}') loop
  idx=idx+1;insert into public.chema_imported_history(space_id,position,event) values(p_space,idx,item-'payloadInverso');
 end loop;
 update public.chema_spaces set snapshot=jsonb_set(jsonb_set(p_snapshot,'{state,logs}',case when jsonb_array_length(p_snapshot#>'{state,logs}')>0 then jsonb_build_array(p_snapshot#>'{state,logs,0}') else '[]'::jsonb end),'{state,appliedIds}','[]'::jsonb),bootstrap_fingerprint=p_fingerprint where id=p_space;
 return public.chema_snapshot(p_space,p_user);
end $$;
-- Historical imports use negative sequence numbers and never replay as remote inventory operations.
create or replace function public.chema_history(p_space text,p_user uuid,p_before bigint,p_limit integer default 100) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare records jsonb;
begin
 perform public.chema_snapshot(p_space,p_user);
 select coalesce(jsonb_agg(x order by (x->>'sequence')::bigint desc),'[]'::jsonb) into records from
 (select jsonb_build_object('sequence',sequence,'event',event) as x from
  (select sequence,event from public.chema_changes where space_id=p_space
   union all select -position as sequence,event from public.chema_imported_history where space_id=p_space) h
 where sequence<p_before order by sequence desc limit least(greatest(p_limit,1),200)) q;
 return records;
end $$;
revoke execute on function public.chema_bootstrap(text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.chema_bootstrap(text,uuid,jsonb,text) to service_role;

-- Private photo objects, capped at 2 MiB and JPEG only. The Edge validates actual bytes/hash.
do $$begin
 if to_regclass('storage.buckets') is not null then
  insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('chema-photos','chema-photos',false,2097152,array['image/jpeg']) on conflict(id) do nothing;
 end if;
end $$;
