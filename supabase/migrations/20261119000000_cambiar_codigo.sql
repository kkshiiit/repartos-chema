-- Chema Andamios 1.0.3: cambiar el código del equipo.
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
