-- Immutable private-object registration; deleting a photo reference never deletes original bytes.
create table public.chema_photo_objects (
 space_id text not null references public.chema_spaces(id),
 obra_id text not null,
 photo_id text not null,
 author_id text not null,
 hash text not null check(hash ~ '^[a-f0-9]{64}$'),
 primary key(space_id,obra_id,photo_id)
);
alter table public.chema_photo_objects enable row level security;
revoke all on public.chema_photo_objects from anon,authenticated;
grant all on public.chema_photo_objects to service_role;
create function public.chema_photo_access(p_space text,p_user uuid,p_obra text,p_photo text,p_hash text default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare s jsonb; photo jsonb; obj public.chema_photo_objects;
begin
 s=public.chema_snapshot(p_space,p_user);
 select p into photo from jsonb_array_elements(s#>'{state,obras}') o cross join lateral jsonb_array_elements(coalesce(o->'fotos','[]'::jsonb)) p where o->>'id'=p_obra and p->>'id'=p_photo;
 if photo is null then raise exception 'PHOTO_PERMISSION_REQUIRED' using errcode='42501'; end if;
 if p_hash is not null then
  if photo->>'usuarioUid'<>p_user::text and s#>>'{member,role}'<>'ADMIN' then raise exception 'PHOTO_PERMISSION_REQUIRED' using errcode='42501';end if;
  insert into public.chema_photo_objects(space_id,obra_id,photo_id,author_id,hash) values(p_space,p_obra,p_photo,photo->>'usuarioUid',p_hash) on conflict do nothing;
 end if;
 select * into obj from public.chema_photo_objects where space_id=p_space and obra_id=p_obra and photo_id=p_photo;
 if obj.hash is null then raise exception 'PHOTO_PENDING';end if;
 if obj.author_id::text<>photo->>'usuarioUid' or (p_hash is not null and obj.hash<>p_hash) then raise exception 'PHOTO_HASH_CONFLICT';end if;
 return jsonb_build_object('hash',obj.hash,'path',encode(convert_to(p_space,'UTF8'),'hex')||'/'||encode(convert_to(p_obra,'UTF8'),'hex')||'/'||encode(convert_to(p_photo,'UTF8'),'hex')||'/'||obj.hash||'.jpg');
end $$;
revoke execute on function public.chema_photo_access(text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.chema_photo_access(text,uuid,text,text,text) to service_role;
-- Reassert privacy on an existing installation as well as on fresh databases.
do $$begin
 if to_regclass('storage.buckets') is not null then
  update storage.buckets set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg'] where id='chema-photos';
 end if;
end $$;
