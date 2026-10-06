create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('director', 'teacher', 'parent')) default 'parent',
  site_id uuid,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  site_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  display_name text not null,
  encrypted_sensitive jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  site_id uuid not null,
  encrypted_payload text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.children enable row level security;
alter table public.diary_entries enable row level security;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.current_site()
returns uuid language sql stable security definer set search_path = public
as $$ select site_id from public.profiles where id = auth.uid() $$;

create policy "users read own profile" on public.profiles for select using (id = auth.uid());
create policy "staff read site children" on public.children for select
  using (site_id = public.current_site() and public.current_role() in ('director', 'teacher'));
create policy "parents read assigned site children" on public.children for select
  using (site_id = public.current_site() and public.current_role() = 'parent');
create policy "staff manage diary" on public.diary_entries for all
  using (site_id = public.current_site() and public.current_role() in ('director', 'teacher'))
  with check (site_id = public.current_site() and public.current_role() in ('director', 'teacher'));
create policy "site audit is append only" on public.audit_log for insert
  with check (actor_id = auth.uid() and site_id = public.current_site());
create policy "directors read site audit" on public.audit_log for select
  using (site_id = public.current_site() and public.current_role() = 'director');

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_log(actor_id, site_id, action, entity_type, entity_id, details)
  values (auth.uid(), case when tg_op = 'DELETE' then old.site_id else new.site_id end, tg_op, tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end::text, jsonb_build_object('source', 'database_trigger'));
  return coalesce(new, old);
end;
$$;

drop trigger if exists children_audit on public.children;
create trigger children_audit after insert or update or delete on public.children
  for each row execute function public.audit_row_change();

drop trigger if exists diary_audit on public.diary_entries;
create trigger diary_audit after insert or update or delete on public.diary_entries
  for each row execute function public.audit_row_change();