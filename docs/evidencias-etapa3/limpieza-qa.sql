-- Sólo cuatro cuentas QA conocidas y sus dos espacios desechables. No ejecutar sobre datos comerciales.
do $$
declare uids uuid[]; spaces text[];
begin
 select array_agg(id) into uids from auth.users where email in (
 'chema-qa-b371981330a6@example.invalid','chema-qa2-b371981330a6@example.invalid',
 'chema-qa-8ae85d7a0ee7@example.invalid','chema-qa2-8ae85d7a0ee7@example.invalid');
 if coalesce(cardinality(uids),0)<>4 then raise exception 'QA_IDENTITIES_NOT_EXACT'; end if;
 select array_agg(distinct space_id) into spaces from public.chema_members where user_id=any(uids);
 if coalesce(cardinality(spaces),0)<>2 or not (spaces @> array['84c73873-eea9-441d-b671-a7786d2b08a7','2c41f2f2-0024-4a85-8161-8c1a25b95997']::text[]) then raise exception 'QA_SPACES_NOT_EXACT'; end if;
 if exists(select 1 from public.chema_members where space_id=any(spaces) and not(user_id=any(uids))) then raise exception 'NON_QA_MEMBER_ABORT'; end if;
 if exists(select 1 from storage.objects where bucket_id='chema-photos' and split_part(name,'/',1) in (encode(convert_to(spaces[1],'utf8'),'hex'),encode(convert_to(spaces[2],'utf8'),'hex'))) then raise exception 'STORAGE_API_CLEANUP_REQUIRED'; end if;
 delete from public.chema_photo_objects where space_id=any(spaces);
 delete from public.chema_route_history where space_id=any(spaces);
 delete from public.chema_routes where space_id=any(spaces);
 delete from public.chema_imported_history where space_id=any(spaces);
 delete from public.chema_task_fulfillments where space_id=any(spaces);
 delete from public.chema_receipts where space_id=any(spaces);
 delete from public.chema_changes where space_id=any(spaces);
 delete from public.chema_invitations where space_id=any(spaces);
 delete from public.chema_members where space_id=any(spaces);
 delete from public.chema_spaces where id=any(spaces);
 delete from auth.users where id=any(uids);
end $$;
select jsonb_build_object(
 'qaUsersRemaining',(select count(*) from auth.users where email in ('chema-qa-b371981330a6@example.invalid','chema-qa2-b371981330a6@example.invalid','chema-qa-8ae85d7a0ee7@example.invalid','chema-qa2-8ae85d7a0ee7@example.invalid')),
 'qaSpacesRemaining',(select count(*) from public.chema_spaces where id in ('84c73873-eea9-441d-b671-a7786d2b08a7','2c41f2f2-0024-4a85-8161-8c1a25b95997')),
 'objectsRemaining',(select count(*) from storage.objects where bucket_id='chema-photos')) as verification;
