-- ═══════════════════════════════════════════════════════════════════════════
-- Sponsors Migration — Add to supabase-schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Sponsors table ───────────────────────────────────────────────────────────
-- Base sponsors table with dynamic fields stored as JSON columns
create table if not exists public.sponsors (
  id          bigserial   primary key,
  -- Built-in fields
  name        text,
  email       text,
  phone       text,
  address     text,
  sponsorship_type text,
  -- Admin-defined custom fields stored as JSONB
  custom_fields jsonb default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Sponsor field definitions (configurable by admin)
-- Same structure as contact_fields - admin defines what fields appear on sponsor forms
create table if not exists public.sponsor_fields (
  id          bigserial   primary key,
  label       text        not null,
  field_key   text        not null unique,
  field_type  text        not null
                check (field_type in ('text','textarea','number','date','select','file')),
  options     jsonb,           -- string array for 'select' type, e.g. ["Option A", "Option B"]
  required    boolean     not null default false,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Insert default sponsor fields
insert into public.sponsor_fields (label, field_key, field_type, required, sort_order)
values
  ('Sponsor Name', 'name', 'text', true, 1),
  ('Sponsor Email', 'email', 'text', true, 2),
  ('Sponsor Phone Number', 'phone', 'text', false, 3),
  ('Sponsor Address', 'address', 'text', false, 4),
  ('Sponsorship Type', 'sponsorship_type', 'select', false, 5)
on conflict (field_key) do nothing;

-- ── Indexes ────────────────────────────────────────────────────────────────
create index if not exists sponsors_email_idx on public.sponsors(email);
create index if not exists sponsor_fields_sort_idx on public.sponsor_fields(sort_order);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.sponsors enable row level security;
alter table public.sponsor_fields enable row level security;

-- Sponsors: All authenticated users can read
create policy "Authenticated users read sponsors"
  on public.sponsors for select to authenticated
  using (true);

-- Sponsors: Admin and editor can create
create policy "Admin and editor create sponsors"
  on public.sponsors for insert to authenticated
  using (auth.uid() in (
    select id from public.user_profiles
    where role in ('admin', 'editor')
  ));

-- Sponsors: Admin and editor can update
create policy "Admin and editor update sponsors"
  on public.sponsors for update to authenticated
  using (auth.uid() in (
    select id from public.user_profiles
    where role in ('admin', 'editor')
  ));

-- Sponsors: Admin and editor can delete
create policy "Admin and editor delete sponsors"
  on public.sponsors for delete to authenticated
  using (auth.uid() in (
    select id from public.user_profiles
    where role in ('admin', 'editor')
  ));

-- Sponsor fields: All authenticated users can read
create policy "Authenticated users read sponsor_fields"
  on public.sponsor_fields for select to authenticated
  using (true);

-- Sponsor fields: Only admin can manage
create policy "Admin manage sponsor_fields"
  on public.sponsor_fields for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
