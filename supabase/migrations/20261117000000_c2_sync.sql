-- Repartos Chema 2.0: sincronización simple por código de equipo + nombre.
-- Cada cambio es una operación inmutable y ordenada (seq). Todos los teléfonos
-- aplican la misma secuencia: eso es la sincronización y también la auditoría.
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
