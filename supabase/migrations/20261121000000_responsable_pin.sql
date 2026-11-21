-- Chema Andamios 1.2.0: responsable con PIN.
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
