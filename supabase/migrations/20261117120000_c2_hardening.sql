-- Chema Andamios 2.1: endurecimiento del acceso por código de equipo.
-- 1) Sólo el rol anónimo (la app) ejecuta las funciones; nadie usa cuentas de Supabase Auth.
-- 2) Límite global de creación de equipos (anti-spam) y topes de almacenamiento por equipo.

revoke execute on function public.c2_create_team(text, text), public.c2_join(text), public.c2_member_add(text, text),
  public.c2_member_remove(text, uuid), public.c2_members(text), public.c2_push(text, jsonb),
  public.c2_pull(text, bigint, integer), public.c2_photo_put(text, text, text), public.c2_photo_get(text, text)
  from public, authenticated;

create or replace function public.c2_create_team(p_code text, p_name text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  if char_length(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g')) < 12 then
    raise exception 'CODIGO_CORTO' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(p_name,''))) < 2 then
    raise exception 'NOMBRE_VACIO' using errcode = '22023';
  end if;
  if (select count(*) from public.c2_teams where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'DEMASIADOS_EQUIPOS' using errcode = '54000';
  end if;
  insert into public.c2_teams(code_hash, name) values (public.c2_hash(p_code), trim(p_name)) returning id into v;
  return jsonb_build_object('teamId', v, 'name', trim(p_name), 'members', '[]'::jsonb, 'lastSeq', 0);
end $$;

create or replace function public.c2_member_add(p_code text, p_name text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; m public.c2_members;
begin
  v := public.c2_team(p_code);
  if char_length(trim(coalesce(p_name,''))) < 2 then raise exception 'NOMBRE_VACIO' using errcode = '22023'; end if;
  select * into m from public.c2_members where team = v and lower(name) = lower(trim(p_name));
  if m.id is null then
    if (select count(*) from public.c2_members where team = v) >= 200 then
      raise exception 'LIMITE_EQUIPO' using errcode = '54000';
    end if;
    insert into public.c2_members(team, name) values (v, trim(p_name)) returning * into m;
  elsif not m.active then
    update public.c2_members set active = true where id = m.id returning * into m;
  end if;
  update public.c2_members set last_seen = now() where id = m.id;
  return jsonb_build_object('id', m.id, 'name', m.name);
end $$;

-- Tope de almacenamiento: 150 MB de operaciones y 300 MB de fotos por equipo (plan gratuito: 500 MB en total).
create or replace function public.c2_push(p_code text, p_ops jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; item jsonb; result jsonb := '[]'::jsonb; s bigint;
begin
  v := public.c2_team(p_code);
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) > 100 then
    raise exception 'LOTE_INVALIDO' using errcode = '22023';
  end if;
  if (select coalesce(sum(pg_column_size(op)), 0) from public.c2_ops where team = v) > 150 * 1024 * 1024 then
    raise exception 'LIMITE_EQUIPO' using errcode = '54000';
  end if;
  for item in select * from jsonb_array_elements(p_ops) loop
    if jsonb_typeof(item->'op') <> 'object' or char_length(coalesce(item->>'opId','')) not between 8 and 100 then
      raise exception 'LOTE_INVALIDO' using errcode = '22023';
    end if;
    if octet_length((item->'op')::text) > 3000000 then raise exception 'OPERACION_GRANDE' using errcode = '22023'; end if;
    insert into public.c2_ops(team, op_id, actor_id, actor_name, device, client_at, op)
    values (v, item->>'opId', left(item->>'actorId', 100), left(coalesce(nullif(item->>'actorName',''), '?'), 60),
            left(item->>'device', 100), nullif(item->>'clientAt','')::timestamptz, item->'op')
    on conflict (team, op_id) do nothing returning seq into s;
    if s is null then select seq into s from public.c2_ops where team = v and op_id = item->>'opId'; end if;
    result := result || jsonb_build_array(jsonb_build_object('opId', item->>'opId', 'seq', s));
    s := null;
  end loop;
  update public.c2_members set last_seen = now()
   where team = v and id::text in (select distinct e->>'actorId' from jsonb_array_elements(p_ops) e);
  return result;
end $$;

create or replace function public.c2_photo_put(p_code text, p_id text, p_data text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  v := public.c2_team(p_code);
  if p_id !~ '^[A-Za-z0-9_-]{1,100}$' or p_data !~ '^[A-Za-z0-9+/]*={0,2}$' then
    raise exception 'FOTO_INVALIDA' using errcode = '22023';
  end if;
  if (select coalesce(sum(length(data)), 0) from public.c2_photos where team = v) > 300 * 1024 * 1024 then
    raise exception 'LIMITE_EQUIPO' using errcode = '54000';
  end if;
  insert into public.c2_photos(team, id, data) values (v, p_id, p_data) on conflict (team, id) do nothing;
  return true;
end $$;

revoke all on function public.c2_create_team(text, text), public.c2_member_add(text, text),
  public.c2_push(text, jsonb), public.c2_photo_put(text, text, text) from public, authenticated;
grant execute on function public.c2_create_team(text, text), public.c2_join(text), public.c2_member_add(text, text),
  public.c2_member_remove(text, uuid), public.c2_members(text), public.c2_push(text, jsonb),
  public.c2_pull(text, bigint, integer), public.c2_photo_put(text, text, text), public.c2_photo_get(text, text)
  to anon;
