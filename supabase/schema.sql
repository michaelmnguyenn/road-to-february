-- Road to February: sync storage.
-- One row per sync key. The key itself is never stored, only its SHA-256 hash, and the table has
-- row level security on with no policies, so the anon role cannot touch it directly. The two
-- security-definer functions below are the only way in, and both require the key.

create table if not exists public.rtf_docs (
  id          text primary key,              -- sha256(sync key), hex
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.rtf_docs enable row level security;
revoke all on public.rtf_docs from anon, authenticated;

create or replace function public.rtf_get(p_key text)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select d.data
  from public.rtf_docs d
  where length(p_key) >= 32
    and d.id = encode(sha256(convert_to(p_key, 'UTF8')), 'hex');
$$;

create or replace function public.rtf_put(p_key text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz := now();
begin
  if length(p_key) < 32 then
    raise exception 'sync key too short';
  end if;
  if pg_column_size(p_data) > 4 * 1024 * 1024 then
    raise exception 'document too large';
  end if;
  insert into public.rtf_docs (id, data, updated_at)
  values (encode(sha256(convert_to(p_key, 'UTF8')), 'hex'), p_data, v_at)
  on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at;
  return v_at;
end;
$$;

revoke all on function public.rtf_get(text) from public;
revoke all on function public.rtf_put(text, jsonb) from public;
grant execute on function public.rtf_get(text) to anon, authenticated;
grant execute on function public.rtf_put(text, jsonb) to anon, authenticated;
