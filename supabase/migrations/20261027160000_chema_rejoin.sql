-- Fresh one-use invitation may reenable an existing membership; used invitations never do.
create or replace function public.chema_join(p_hash text,p_user uuid,p_name text,p_snapshot jsonb default null,p_fingerprint text default null) returns text
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
 perform 1 from public.chema_spaces where id=sid for update;
 insert into public.chema_members(space_id,user_id,nombre,role) values(sid,p_user,trim(p_name),invitation.role)
 on conflict(space_id,user_id) do update set nombre=excluded.nombre,active=true;
 -- Preserve the existing role: a fresh authorized invitation restores access, never elevates it.
 update public.chema_invitations set used_by=p_user,used_at=now(),space_id=sid where token_hash=p_hash;
 return sid;
end $$;
