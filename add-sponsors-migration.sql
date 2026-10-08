-- ═══════════════════════════════════════════════════════════════════════════
-- Add Sponsors Tables — Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Sponsor field definitions (configurable by admin) ─────────────────────
-- Same structure as contact_fields - admin defines what fields appear on sponsor forms
create table if not exists public.sponsor_fields (
  id          bigserial   primary key,
  label       text        not null,
  field_key   text        not null unique,
  field_type  text        not null
                check (field_type in ('text','textarea','number','date','select','file')),
  options     jsonb,           -- string array for 'select' type
  required    boolean     not null default false,
  sort_order  integer     not null default 0,
  created_at  timestamp with time zone not null default now()
);

-- ── 2. Sponsors table ─────────────────────────────────────────────────────────
-- Base sponsors table with dynamic field data stored as JSONB
create table if not exists public.sponsors (
  id          bigserial   primary key,
  data        jsonb       default '{}',  -- stores all dynamic field values
  created_at  timestamp with time zone not null default now(),
  updated_at  timestamp with time zone not null default now()
);

-- ── 3. Insert default sponsor fields ──────────────────────────────────────────
-- These match your requirement: Name, Email, Phone, Address, Sponsorship Type
insert into public.sponsor_fields (label, field_key, field_type, required, sort_order)
values
  ('Sponsor Name', 'sponsor_name', 'text', true, 1),
  ('Sponsor Email', 'sponsor_email', 'text', true, 2),
  ('Sponsor Phone Number', 'sponsor_phone', 'text', false, 3),
  ('Sponsor Address', 'sponsor_address', 'text', false, 4),
  ('Sponsorship Type', 'sponsorship_type', 'select', false, 5)
on conflict (field_key) do nothing;

-- ── 4. Enable Row Level Security ──────────────────────────────────────────────
alter table public.sponsors enable row level security;
alter table public.sponsor_fields enable row level security;

-- ── 5. Add RLS Policies ───────────────────────────────────────────────────────
-- Helper function for admin check (already exists, but being safe)
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

-- Sponsors: Only admin can read
create policy "Admin read sponsors"
  on public.sponsors for select to authenticated
  using (public.is_admin());

-- Sponsors: Only admin can create
create policy "Admin create sponsors"
  on public.sponsors for insert to authenticated
  with check (public.is_admin());

-- Sponsors: Only admin can update
create policy "Admin update sponsors"
  on public.sponsors for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sponsors: Only admin can delete
create policy "Admin delete sponsors"
  on public.sponsors for delete to authenticated
  using (public.is_admin());

-- Sponsor fields: Only admin can read
create policy "Admin read sponsor_fields"
  on public.sponsor_fields for select to authenticated
  using (public.is_admin());

-- Sponsor fields: Only admin can create/update/delete
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

-- ── 6. Create indexes ────────────────────────────────────────────────────────
create index if not exists sponsor_fields_sort_idx on public.sponsor_fields(sort_order);
create index if not exists sponsors_created_idx on public.sponsors(created_at);

-- ── 7. Update program_fields RLS to admin-only ───────────────────────────────
-- Drop old program_fields policies
drop policy if exists "authenticated users can view program_fields" on public.program_fields;
drop policy if exists "users can manage program_fields based on role" on public.program_fields;
drop policy if exists "editors and admins can manage program_fields" on public.program_fields;

-- New admin-only policies for program_fields
create policy if not exists "Admin read program_fields"
  on public.program_fields for select to authenticated
  using (public.is_admin());

create policy if not exists "Admin manage program_fields create"
  on public.program_fields for insert to authenticated
  with check (public.is_admin());

create policy if not exists "Admin manage program_fields update"
  on public.program_fields for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "Admin manage program_fields delete"
  on public.program_fields for delete to authenticated
  using (public.is_admin());

-- ── 8. Update programs RLS to restrict create/update to admin ─────────────────
-- Drop old programs policies
drop policy if exists "authenticated users can view programs" on public.programs;
drop policy if exists "users can manage programs based on role" on public.programs;
drop policy if exists "editors and admins can manage programs" on public.programs;

-- New admin-only create/update/delete, but all can read
create policy if not exists "Authenticated read programs"
  on public.programs for select to authenticated
  using (true);

create policy if not exists "Admin create programs"
  on public.programs for insert to authenticated
  with check (public.is_admin());

create policy if not exists "Admin update programs"
  on public.programs for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "Admin delete programs"
  on public.programs for delete to authenticated
  using (public.is_admin());

-- ── 9. Update contact_fields RLS to admin-only ───────────────────────────────
-- Drop old contact_fields policies
drop policy if exists "authenticated users can view contact_fields" on public.contact_fields;
drop policy if exists "users can manage contact_fields based on role" on public.contact_fields;
drop policy if exists "editors and admins can manage contact_fields" on public.contact_fields;

-- New admin-only policies for contact_fields
create policy if not exists "Admin read contact_fields"
  on public.contact_fields for select to authenticated
  using (public.is_admin());

create policy if not exists "Admin manage contact_fields create"
  on public.contact_fields for insert to authenticated
  with check (public.is_admin());

create policy if not exists "Admin manage contact_fields update"
  on public.contact_fields for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy if not exists "Admin manage contact_fields delete"
  on public.contact_fields for delete to authenticated
  using (public.is_admin());
