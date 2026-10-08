-- ═══════════════════════════════════════════════════════════════════════════
-- SPONSORS & PERMISSIONS UPDATE (SIMPLIFIED) — Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Create sponsor tables if they don't exist
create table if not exists public.sponsor_fields (
  id          bigserial   primary key,
  label       text        not null,
  field_key   text        not null unique,
  field_type  text        not null check (field_type in ('text','textarea','number','date','select','file')),
  options     jsonb,
  required    boolean     not null default false,
  sort_order  integer     not null default 0,
  created_at  timestamp with time zone not null default now()
);

create table if not exists public.sponsors (
  id          bigserial   primary key,
  data        jsonb       default '{}',
  created_at  timestamp with time zone not null default now(),
  updated_at  timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.sponsors enable row level security;
alter table public.sponsor_fields enable row level security;

-- Insert default sponsor fields if empty
insert into public.sponsor_fields (label, field_key, field_type, required, sort_order)
values
  ('Sponsor Name', 'sponsor_name', 'text', true, 1),
  ('Sponsor Email', 'sponsor_email', 'text', true, 2),
  ('Sponsor Phone Number', 'sponsor_phone', 'text', false, 3),
  ('Sponsor Address', 'sponsor_address', 'text', false, 4),
  ('Sponsorship Type', 'sponsorship_type', 'select', false, 5)
on conflict (field_key) do nothing;

-- Helper functions
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SPONSORS RLS POLICIES (ADMIN ONLY)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Admin read sponsors" on public.sponsors;
drop policy if exists "Admin create sponsors" on public.sponsors;
drop policy if exists "Admin update sponsors" on public.sponsors;
drop policy if exists "Admin delete sponsors" on public.sponsors;
drop policy if exists "Authenticated users read sponsors" on public.sponsors;
drop policy if exists "Admin and editor create sponsors" on public.sponsors;
drop policy if exists "Admin and editor update sponsors" on public.sponsors;
drop policy if exists "Admin and editor delete sponsors" on public.sponsors;

create policy "Admin read sponsors"
  on public.sponsors for select to authenticated
  using (public.is_admin());

create policy "Admin create sponsors"
  on public.sponsors for insert to authenticated
  with check (public.is_admin());

create policy "Admin update sponsors"
  on public.sponsors for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin delete sponsors"
  on public.sponsors for delete to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- SPONSOR_FIELDS RLS POLICIES (ADMIN ONLY)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Admin read sponsor_fields" on public.sponsor_fields;
drop policy if exists "Admin manage sponsor_fields create" on public.sponsor_fields;
drop policy if exists "Admin manage sponsor_fields update" on public.sponsor_fields;
drop policy if exists "Admin manage sponsor_fields delete" on public.sponsor_fields;
drop policy if exists "Authenticated users read sponsor_fields" on public.sponsor_fields;

create policy "Admin read sponsor_fields"
  on public.sponsor_fields for select to authenticated
  using (public.is_admin());

create policy "Admin manage sponsor_fields create"
  on public.sponsor_fields for insert to authenticated
  with check (public.is_admin());

create policy "Admin manage sponsor_fields update"
  on public.sponsor_fields for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin manage sponsor_fields delete"
  on public.sponsor_fields for delete to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- PROGRAMS RLS POLICIES (ADMIN + EDITOR can do everything)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated read programs" on public.programs;
drop policy if exists "Admin and editor create programs" on public.programs;
drop policy if exists "Admin and editor update programs" on public.programs;
drop policy if exists "Admin and editor delete programs" on public.programs;
drop policy if exists "Admin create programs" on public.programs;
drop policy if exists "Admin update programs" on public.programs;
drop policy if exists "Admin delete programs" on public.programs;
drop policy if exists "authenticated users can view programs" on public.programs;
drop policy if exists "users can manage programs based on role" on public.programs;
drop policy if exists "editors and admins can manage programs" on public.programs;

create policy "Authenticated read programs"
  on public.programs for select to authenticated
  using (true);

create policy "Admin and editor create programs"
  on public.programs for insert to authenticated
  with check (public.is_admin_or_editor());

create policy "Admin and editor update programs"
  on public.programs for update to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "Admin and editor delete programs"
  on public.programs for delete to authenticated
  using (public.is_admin_or_editor());

-- ═══════════════════════════════════════════════════════════════════════════
-- PROGRAM_FIELDS RLS POLICIES (ADMIN + EDITOR)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Admin read program_fields" on public.program_fields;
drop policy if exists "Admin manage program_fields create" on public.program_fields;
drop policy if exists "Admin manage program_fields update" on public.program_fields;
drop policy if exists "Admin manage program_fields delete" on public.program_fields;
drop policy if exists "Admin and editor read program_fields" on public.program_fields;
drop policy if exists "Admin and editor manage program_fields create" on public.program_fields;
drop policy if exists "Admin and editor manage program_fields update" on public.program_fields;
drop policy if exists "Admin and editor manage program_fields delete" on public.program_fields;
drop policy if exists "authenticated users can view program_fields" on public.program_fields;
drop policy if exists "users can manage program_fields based on role" on public.program_fields;
drop policy if exists "editors and admins can manage program_fields" on public.program_fields;

create policy "Admin and editor read program_fields"
  on public.program_fields for select to authenticated
  using (public.is_admin_or_editor());

create policy "Admin and editor manage program_fields create"
  on public.program_fields for insert to authenticated
  with check (public.is_admin_or_editor());

create policy "Admin and editor manage program_fields update"
  on public.program_fields for update to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "Admin and editor manage program_fields delete"
  on public.program_fields for delete to authenticated
  using (public.is_admin_or_editor());

-- ═══════════════════════════════════════════════════════════════════════════
-- CONTACT_FIELDS RLS POLICIES (ADMIN + EDITOR only)
-- ═══════════════════════════════════════════════════════════════════════════
drop policy if exists "Admin read contact_fields" on public.contact_fields;
drop policy if exists "Admin manage contact_fields create" on public.contact_fields;
drop policy if exists "Admin manage contact_fields update" on public.contact_fields;
drop policy if exists "Admin manage contact_fields delete" on public.contact_fields;
drop policy if exists "authenticated users can view contact_fields" on public.contact_fields;
drop policy if exists "users can manage contact_fields based on role" on public.contact_fields;
drop policy if exists "editors and admins can manage contact_fields" on public.contact_fields;

create policy "Admin and editor read contact_fields"
  on public.contact_fields for select to authenticated
  using (public.is_admin_or_editor());

create policy "Admin and editor manage contact_fields create"
  on public.contact_fields for insert to authenticated
  with check (public.is_admin_or_editor());

create policy "Admin and editor manage contact_fields update"
  on public.contact_fields for update to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

create policy "Admin and editor manage contact_fields delete"
  on public.contact_fields for delete to authenticated
  using (public.is_admin_or_editor());

-- Create indexes
create index if not exists sponsor_fields_sort_idx on public.sponsor_fields(sort_order);
create index if not exists sponsors_created_idx on public.sponsors(created_at);
