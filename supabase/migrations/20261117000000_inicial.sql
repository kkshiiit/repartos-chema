-- Chema Andamios 1.0.0 — esquema inicial: equipos por código, personas, registro de operaciones (sincronización + auditoría) y fotos.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.c2_teams (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
create table if not exists public.c2_members (
  id uuid primary key default gen_random_uuid(),
  team uuid not null references public.c2_teams(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);
create unique index if not exists c2_members_name on public.c2_members(team, lower(name));
create table if not exists public.c2_ops (
  seq bigserial primary key,
  team uuid not null references public.c2_teams(id) on delete cascade,
  op_id text not null,
  actor_id text,
  actor_name text not null,
  device text,
  client_at timestamptz,
  server_at timestamptz not null default now(),
  op jsonb not null,
  unique (team, op_id)
);
create index if not exists c2_ops_team_seq on public.c2_ops(team, seq);
create table if not exists public.c2_photos (
  team uuid not null references public.c2_teams(id) on delete cascade,
  id text not null,
  data text not null check (length(data) < 1500000),
  created_at timestamptz not null default now(),
  primary key (team, id)
);
alter table public.c2_teams enable row level security;
alter table public.c2_members enable row level security;
alter table public.c2_ops enable row level security;
alter table public.c2_photos enable row level security;
revoke all on public.c2_teams, public.c2_members, public.c2_ops, public.c2_photos from anon, authenticated;

create or replace function public.c2_hash(p_code text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(upper(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex')
$$;

create or replace function public.c2_team(p_code text) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare v uuid;
begin
  select id into v from public.c2_teams where code_hash = public.c2_hash(p_code);
  if v is null then raise exception 'EQUIPO_NO_ENCONTRADO' using errcode = 'P0002'; end if;
  return v;
end $$;

create or replace function public.c2_members_json(p_team uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'lastSeen', last_seen) order by lower(name)), '[]'::jsonb)
  from public.c2_members where team = p_team and active
$$;

create or replace function public.c2_create_team(p_code text, p_name text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  if char_length(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g')) < 8 then
    raise exception 'CODIGO_CORTO' using errcode = '22023';
  end if;
  insert into public.c2_teams(code_hash, name) values (public.c2_hash(p_code), trim(p_name)) returning id into v;
  return jsonb_build_object('teamId', v, 'name', trim(p_name), 'members', '[]'::jsonb, 'lastSeq', 0);
end $$;

create or replace function public.c2_join(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v uuid; n text;
begin
  v := public.c2_team(p_code);
  select name into n from public.c2_teams where id = v;
  return jsonb_build_object('teamId', v, 'name', n, 'members', public.c2_members_json(v),
    'lastSeq', coalesce((select max(seq) from public.c2_ops where team = v), 0));
end $$;

create or replace function public.c2_member_add(p_code text, p_name text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; m public.c2_members;
begin
  v := public.c2_team(p_code);
  if char_length(trim(coalesce(p_name,''))) < 1 then raise exception 'NOMBRE_VACIO' using errcode = '22023'; end if;
  select * into m from public.c2_members where team = v and lower(name) = lower(trim(p_name));
  if m.id is null then
    insert into public.c2_members(team, name) values (v, trim(p_name)) returning * into m;
  elsif not m.active then
    update public.c2_members set active = true where id = m.id returning * into m;
  end if;
  update public.c2_members set last_seen = now() where id = m.id;
  return jsonb_build_object('id', m.id, 'name', m.name);
end $$;

create or replace function public.c2_member_remove(p_code text, p_member uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  v := public.c2_team(p_code);
  update public.c2_members set active = false where id = p_member and team = v;
  return public.c2_members_json(v);
end $$;

create or replace function public.c2_members(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  return public.c2_members_json(public.c2_team(p_code));
end $$;

create or replace function public.c2_push(p_code text, p_ops jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; item jsonb; result jsonb := '[]'::jsonb; s bigint;
begin
  v := public.c2_team(p_code);
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) > 100 then
    raise exception 'LOTE_INVALIDO' using errcode = '22023';
  end if;
  for item in select * from jsonb_array_elements(p_ops) loop
    if octet_length(item->>'op') > 3000000 then raise exception 'OPERACION_GRANDE' using errcode = '22023'; end if;
    insert into public.c2_ops(team, op_id, actor_id, actor_name, device, client_at, op)
    values (v, item->>'opId', item->>'actorId', coalesce(nullif(item->>'actorName',''), '?'),
            item->>'device', nullif(item->>'clientAt','')::timestamptz, item->'op')
    on conflict (team, op_id) do nothing returning seq into s;
    if s is null then select seq into s from public.c2_ops where team = v and op_id = item->>'opId'; end if;
    result := result || jsonb_build_array(jsonb_build_object('opId', item->>'opId', 'seq', s));
    s := null;
  end loop;
  update public.c2_members set last_seen = now()
   where team = v and id::text in (select distinct e->>'actorId' from jsonb_array_elements(p_ops) e);
  return result;
end $$;

create or replace function public.c2_pull(p_code text, p_after bigint, p_limit integer default 300) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v uuid;
begin
  v := public.c2_team(p_code);
  return jsonb_build_object(
    'ops', coalesce((select jsonb_agg(jsonb_build_object('seq', seq, 'op', op, 'serverAt', server_at) order by seq)
      from (select seq, op, server_at from public.c2_ops where team = v and seq > coalesce(p_after, 0)
            order by seq limit least(greatest(coalesce(p_limit, 300), 1), 500)) x), '[]'::jsonb),
    'lastSeq', coalesce((select max(seq) from public.c2_ops where team = v), 0));
end $$;

create or replace function public.c2_photo_put(p_code text, p_id text, p_data text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  v := public.c2_team(p_code);
  insert into public.c2_photos(team, id, data) values (v, p_id, p_data) on conflict (team, id) do nothing;
  return true;
end $$;

create or replace function public.c2_photo_get(p_code text, p_id text) returns text
language plpgsql stable security definer set search_path = '' as $$
begin
  return (select data from public.c2_photos where team = public.c2_team(p_code) and id = p_id);
end $$;

revoke all on function public.c2_team(text), public.c2_members_json(uuid), public.c2_hash(text) from public, anon, authenticated;
grant execute on function public.c2_create_team(text, text), public.c2_join(text), public.c2_member_add(text, text),
  public.c2_member_remove(text, uuid), public.c2_members(text), public.c2_push(text, jsonb),
  public.c2_pull(text, bigint, integer), public.c2_photo_put(text, text, text), public.c2_photo_get(text, text)
  to anon, authenticated;

-- Endurecimiento: sólo anon, límites anti-abuso y de espacio, validación de fotos.

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

-- Cambiar el código del equipo (si se filtró). El código anterior deja de funcionar al instante.
create or replace function public.c2_rotate_code(p_code text, p_new_code text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid;
begin
  v := public.c2_team(p_code);
  if char_length(regexp_replace(coalesce(p_new_code,''), '[^A-Za-z0-9]', '', 'g')) < 12 then
    raise exception 'CODIGO_CORTO' using errcode = '22023';
  end if;
  update public.c2_teams set code_hash = public.c2_hash(p_new_code) where id = v;
  return true;
end $$;
revoke all on function public.c2_rotate_code(text, text) from public, authenticated;
grant execute on function public.c2_rotate_code(text, text) to anon;

-- Copias de seguridad del inventario (automáticas semanales y previas a restaurar).
create table if not exists public.c2_backups (
  id bigserial primary key,
  team uuid not null references public.c2_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  reason text not null check (reason in ('auto', 'antes-de-restaurar')),
  last_seq bigint not null,
  obras integer not null default 0,
  materiales integer not null default 0,
  created_by text,
  data jsonb not null
);
create index if not exists c2_backups_team on public.c2_backups(team, created_at desc);
alter table public.c2_backups enable row level security;
revoke all on public.c2_backups from anon, authenticated;

-- Guarda una copia. Las automáticas: como máximo una cada 6 días; se conservan las 8 más nuevas.
create or replace function public.c2_backup_put(p_code text, p_seq bigint, p_data jsonb, p_reason text, p_by text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; b public.c2_backups;
begin
  v := public.c2_team(p_code);
  if coalesce(p_reason, '') not in ('auto', 'antes-de-restaurar') or coalesce(jsonb_typeof(p_data), '') <> 'object'
     or coalesce(jsonb_typeof(p_data->'obras'), '') <> 'array' or coalesce(jsonb_typeof(p_data->'materiales'), '') <> 'array' then
    raise exception 'COPIA_INVALIDA' using errcode = '22023';
  end if;
  if octet_length(p_data::text) > 20 * 1024 * 1024 then raise exception 'OPERACION_GRANDE' using errcode = '22023'; end if;
  if p_reason = 'auto' and exists (select 1 from public.c2_backups where team = v and reason = 'auto' and created_at > now() - interval '6 days') then
    return jsonb_build_object('saved', false);
  end if;
  if (select count(*) from public.c2_backups where team = v and reason = 'antes-de-restaurar' and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'DEMASIADAS_COPIAS' using errcode = '54000';
  end if;
  insert into public.c2_backups(team, reason, last_seq, obras, materiales, created_by, data)
  values (v, p_reason, greatest(p_seq, 0), jsonb_array_length(p_data->'obras'), jsonb_array_length(p_data->'materiales'), left(p_by, 60), p_data)
  returning * into b;
  delete from public.c2_backups where team = v and reason = p_reason and id not in
    (select id from public.c2_backups where team = v and reason = p_reason order by created_at desc limit 8);
  return jsonb_build_object('saved', true, 'id', b.id);
end $$;

create or replace function public.c2_backup_list(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v uuid;
begin
  v := public.c2_team(p_code);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'createdAt', created_at, 'reason', reason, 'lastSeq', last_seq,
    'obras', obras, 'materiales', materiales, 'createdBy', created_by) order by created_at desc)
    from public.c2_backups where team = v), '[]'::jsonb);
end $$;

create or replace function public.c2_backup_get(p_code text, p_id bigint) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  return (select data from public.c2_backups where team = public.c2_team(p_code) and id = p_id);
end $$;

revoke all on function public.c2_backup_put(text, bigint, jsonb, text, text), public.c2_backup_list(text), public.c2_backup_get(text, bigint) from public, authenticated;
grant execute on function public.c2_backup_put(text, bigint, jsonb, text, text), public.c2_backup_list(text), public.c2_backup_get(text, bigint) to anon;

-- ===== Responsable con PIN =====
-- Protege las acciones que afectan a todo el equipo: importar/restaurar/empezar vacío (IMPORT_SNAPSHOT),
-- cambiar el código y sacar personas. El PIN se guarda con bcrypt; 5 fallos bloquean 15 minutos.
-- Los errores de PIN se DEVUELVEN como {"error": "..."} (no como excepción) para que el conteo de
-- intentos fallidos quede guardado: una excepción desharía la transacción completa.
alter table public.c2_teams add column if not exists pin_hash text;
alter table public.c2_teams add column if not exists responsable text;
alter table public.c2_teams add column if not exists pin_fails integer not null default 0;
alter table public.c2_teams add column if not exists pin_locked_until timestamptz;

drop function if exists public.c2_pin_check(uuid, text);
-- null si el PIN es correcto (o el equipo no tiene PIN); si no, el código de error.
create or replace function public.c2_pin_check(p_team uuid, p_pin text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare t public.c2_teams;
begin
  select * into t from public.c2_teams where id = p_team for update;
  if t.pin_hash is null then return null; end if;
  if t.pin_locked_until is not null and t.pin_locked_until > now() then return 'PIN_BLOQUEADO'; end if;
  if coalesce(p_pin, '') = '' then return 'PIN_REQUERIDO'; end if;
  if extensions.crypt(p_pin, t.pin_hash) = t.pin_hash then
    update public.c2_teams set pin_fails = 0, pin_locked_until = null where id = p_team;
    return null;
  end if;
  update public.c2_teams set
    pin_locked_until = case when pin_fails + 1 >= 5 then now() + interval '15 minutes' else null end,
    pin_fails = case when pin_fails + 1 >= 5 then 0 else pin_fails + 1 end
  where id = p_team;
  return case when t.pin_fails + 1 >= 5 then 'PIN_BLOQUEADO' else 'PIN_INCORRECTO' end;
end $$;

create or replace function public.c2_pin_status(p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare t public.c2_teams;
begin
  select * into t from public.c2_teams where id = public.c2_team(p_code);
  return jsonb_build_object('hasPin', t.pin_hash is not null, 'responsable', t.responsable,
    'lockedUntil', case when t.pin_locked_until > now() then t.pin_locked_until end);
end $$;

-- Crea o cambia el PIN. Si ya hay uno, hace falta el actual.
create or replace function public.c2_pin_set(p_code text, p_new_pin text, p_responsable text, p_current_pin text default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; err text;
begin
  v := public.c2_team(p_code);
  err := public.c2_pin_check(v, p_current_pin);
  if err is not null then return jsonb_build_object('error', err); end if;
  if coalesce(p_new_pin, '') !~ '^[0-9]{4,8}$' then return jsonb_build_object('error', 'PIN_FORMATO'); end if;
  if char_length(trim(coalesce(p_responsable, ''))) < 2 then return jsonb_build_object('error', 'NOMBRE_VACIO'); end if;
  update public.c2_teams set pin_hash = extensions.crypt(p_new_pin, extensions.gen_salt('bf', 8)),
    responsable = left(trim(p_responsable), 60), pin_fails = 0, pin_locked_until = null where id = v;
  return public.c2_pin_status(p_code);
end $$;

-- Envía UNA operación protegida (IMPORT_SNAPSHOT) validando el PIN. Requiere conexión.
create or replace function public.c2_protected_push(p_code text, p_pin text, p_item jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; s bigint; err text;
begin
  v := public.c2_team(p_code);
  err := public.c2_pin_check(v, p_pin);
  if err is not null then return jsonb_build_object('error', err); end if;
  if jsonb_typeof(p_item->'op') <> 'object' or char_length(coalesce(p_item->>'opId','')) not between 8 and 100 then
    raise exception 'LOTE_INVALIDO' using errcode = '22023';
  end if;
  if octet_length((p_item->'op')::text) > 3000000 then raise exception 'OPERACION_GRANDE' using errcode = '22023'; end if;
  insert into public.c2_ops(team, op_id, actor_id, actor_name, device, client_at, op)
  values (v, p_item->>'opId', left(p_item->>'actorId', 100), left(coalesce(nullif(p_item->>'actorName',''), '?'), 60),
          left(p_item->>'device', 100), nullif(p_item->>'clientAt','')::timestamptz, p_item->'op')
  on conflict (team, op_id) do nothing returning seq into s;
  if s is null then select seq into s from public.c2_ops where team = v and op_id = p_item->>'opId'; end if;
  return jsonb_build_object('opId', p_item->>'opId', 'seq', s);
end $$;

-- c2_push: si el equipo tiene PIN, las operaciones protegidas que lleguen por acá se ignoran
-- (sólo entran por c2_protected_push). Sin PIN, todo funciona como antes.
create or replace function public.c2_push(p_code text, p_ops jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; item jsonb; result jsonb := '[]'::jsonb; s bigint; locked boolean;
begin
  v := public.c2_team(p_code);
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) > 100 then
    raise exception 'LOTE_INVALIDO' using errcode = '22023';
  end if;
  if (select coalesce(sum(pg_column_size(op)), 0) from public.c2_ops where team = v) > 150 * 1024 * 1024 then
    raise exception 'LIMITE_EQUIPO' using errcode = '54000';
  end if;
  locked := (select pin_hash is not null from public.c2_teams where id = v);
  for item in select * from jsonb_array_elements(p_ops) loop
    if jsonb_typeof(item->'op') <> 'object' or char_length(coalesce(item->>'opId','')) not between 8 and 100 then
      raise exception 'LOTE_INVALIDO' using errcode = '22023';
    end if;
    if octet_length((item->'op')::text) > 3000000 then raise exception 'OPERACION_GRANDE' using errcode = '22023'; end if;
    if locked and item->'op'->'action'->>'type' = 'IMPORT_SNAPSHOT' then
      result := result || jsonb_build_array(jsonb_build_object('opId', item->>'opId', 'seq', null, 'rejected', 'PIN_REQUERIDO'));
      continue;
    end if;
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

-- Cambiar código y sacar personas: con PIN si el equipo lo tiene.
drop function if exists public.c2_rotate_code(text, text);
drop function if exists public.c2_rotate_code(text, text, text);
create or replace function public.c2_rotate_code(p_code text, p_new_code text, p_pin text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; err text;
begin
  v := public.c2_team(p_code);
  err := public.c2_pin_check(v, p_pin);
  if err is not null then return jsonb_build_object('error', err); end if;
  if char_length(regexp_replace(coalesce(p_new_code,''), '[^A-Za-z0-9]', '', 'g')) < 12 then
    raise exception 'CODIGO_CORTO' using errcode = '22023';
  end if;
  update public.c2_teams set code_hash = public.c2_hash(p_new_code) where id = v;
  return jsonb_build_object('ok', true);
end $$;
drop function if exists public.c2_member_remove(text, uuid);
drop function if exists public.c2_member_remove(text, uuid, text);
create or replace function public.c2_member_remove(p_code text, p_member uuid, p_pin text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare v uuid; err text;
begin
  v := public.c2_team(p_code);
  err := public.c2_pin_check(v, p_pin);
  if err is not null then return jsonb_build_object('error', err); end if;
  update public.c2_members set active = false where id = p_member and team = v;
  return public.c2_members_json(v);
end $$;

-- Sólo comprueba el PIN (cuenta los intentos fallidos igual que las demás).
create or replace function public.c2_pin_verify(p_code text, p_pin text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare err text;
begin
  err := public.c2_pin_check(public.c2_team(p_code), p_pin);
  if err is not null then return jsonb_build_object('error', err); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.c2_pin_verify(text, text) from public, authenticated;
grant execute on function public.c2_pin_verify(text, text) to anon;

revoke all on function public.c2_pin_check(uuid, text) from public, anon, authenticated;
revoke all on function public.c2_pin_status(text), public.c2_pin_set(text, text, text, text), public.c2_protected_push(text, text, jsonb),
  public.c2_push(text, jsonb), public.c2_rotate_code(text, text, text), public.c2_member_remove(text, uuid, text) from public, authenticated;
grant execute on function public.c2_pin_status(text), public.c2_pin_set(text, text, text, text), public.c2_protected_push(text, text, jsonb),
  public.c2_push(text, jsonb), public.c2_rotate_code(text, text, text), public.c2_member_remove(text, uuid, text) to anon;
