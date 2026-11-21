-- Chema Andamios 1.1.0: copias de seguridad (semanal automática y previa a restaurar).
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
