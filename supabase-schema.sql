-- ═══════════════════════════════════════════════════════════════════════════
-- CRM Schema — run in Supabase SQL Editor
-- https://app.supabase.com → your project → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. User profiles + roles ─────────────────────────────────────────────────
-- Mirrors auth.users; role = 'admin' | 'user'
create table if not exists public.user_profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'viewer'
                check (role in ('admin','editor','viewer')),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. Contacts (base fields) ────────────────────────────────────────────────
create table if not exists public.contacts (
  id                   bigserial   primary key,
  -- Personal Information
  first_name           text        not null,
  last_name            text        not null,
  other_names          text,
  gender               text        check (gender in ('male','female','other')),
  date_of_birth        date,
  place_of_birth       text,
  -- Contact Details
  email                text        not null unique,
  phone                text,
  address              text,
  -- System
  status               text        not null default 'lead'
                         check (status in ('lead','active','inactive')),
  is_staff             boolean     not null default false,
  profile_picture_url  text,
  related_contact_id   bigint      references public.contacts(id) on delete set null,
  created_at           timestamptz not null default now()
);

-- ── 2b. Staff profiles (one-to-one with contacts where is_staff = true) ──────
create table if not exists public.staff_profiles (
  id                      bigserial   primary key,
  contact_id              bigint      not null unique references public.contacts(id) on delete cascade,
  -- Employment & Identification
  ssnit_number            text,
  national_id_number      text,
  national_id_photo_url   text,
  stanbic_account_number  text,
  certification_url       text,
  -- Status
  marital_status          text        check (marital_status in ('single','married','divorced','widowed')),
  employment_status       text        check (employment_status in ('contract','permanent','ambassador')),
  start_date              date,
  end_date                date,
  emergency_contact       text,
  -- Screening
  arrested_before         boolean,
  dismissed_for_stealing  boolean,
  accused_of_abuse        boolean,
  created_at              timestamptz not null default now()
);

-- ── 3. Admin-defined extra fields for contacts ───────────────────────────────
create table if not exists public.contact_fields (
  id          bigserial   primary key,
  label       text        not null,
  field_key   text        not null unique,
  field_type  text        not null
                check (field_type in ('text','textarea','number','date','select','file')),
  options     jsonb,           -- string array for 'select' type
  required    boolean     not null default false,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Stores the answers per contact for each extra field
create table if not exists public.contact_field_values (
  id          bigserial   primary key,
  contact_id  bigint      not null references public.contacts(id) on delete cascade,
  field_id    bigint      not null references public.contact_fields(id) on delete cascade,
  value       text,
  created_at  timestamptz not null default now(),
  unique (contact_id, field_id)
);

-- ── 4. Programs ───────────────────────────────────────────────────────────────
create table if not exists public.programs (
  id          bigserial   primary key,
  name        text        not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Admin-defined fields per program
create table if not exists public.program_fields (
  id          bigserial   primary key,
  program_id  bigint      not null references public.programs(id) on delete cascade,
  label       text        not null,
  field_key   text        not null,
  field_type  text        not null
                check (field_type in ('text','textarea','number','date','select','file')),
  options     jsonb,
  required    boolean     not null default false,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  unique (program_id, field_key)
);

-- ── 5. Enrollments — links a contact to a program ────────────────────────────
create table if not exists public.enrollments (
  id          bigserial   primary key,
  contact_id  bigint      not null references public.contacts(id) on delete cascade,
  program_id  bigint      not null references public.programs(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (contact_id, program_id)
);

-- Answers for each program field per enrollment
create table if not exists public.enrollment_values (
  id            bigserial primary key,
  enrollment_id bigint    not null references public.enrollments(id) on delete cascade,
  field_id      bigint    not null references public.program_fields(id) on delete cascade,
  value         text,
  created_at    timestamptz not null default now(),
  unique (enrollment_id, field_id)
);

-- ── 6. Notes ──────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id          bigserial   primary key,
  contact_id  bigint      not null references public.contacts(id) on delete cascade,
  content     text        not null,
  created_at  timestamptz not null default now()
);

-- ── 7. Indexes ────────────────────────────────────────────────────────────────
create index if not exists contact_field_values_contact_idx on public.contact_field_values(contact_id);
create index if not exists enrollments_contact_idx          on public.enrollments(contact_id);
create index if not exists enrollment_values_enrollment_idx on public.enrollment_values(enrollment_id);
create index if not exists notes_contact_id_idx             on public.notes(contact_id);
create index if not exists program_fields_program_idx       on public.program_fields(program_id);

-- ── 8. Row Level Security ─────────────────────────────────────────────────────
alter table public.user_profiles        enable row level security;
alter table public.contacts             enable row level security;
alter table public.contact_fields       enable row level security;
alter table public.contact_field_values enable row level security;
alter table public.programs             enable row level security;
alter table public.program_fields       enable row level security;
alter table public.enrollments          enable row level security;
alter table public.enrollment_values    enable row level security;
alter table public.notes                enable row level security;
alter table public.staff_profiles       enable row level security;

-- Helper function: breaks the recursive RLS loop by running as DB owner
-- (security definer bypasses RLS when checking the caller's own role)
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

-- Each user can always read their own profile row
create policy "Users read own profile"
  on public.user_profiles for select to authenticated
  using (id = auth.uid());

-- Admins can read ALL profiles (needed for User Management page)
create policy "Admins read all profiles"
  on public.user_profiles for select to authenticated
  using (public.is_admin());

-- Admins can update any user's role
create policy "Admins can update user profiles"
  on public.user_profiles for update to authenticated
  using (public.is_admin())
  with check (true);

-- All authenticated users can read/write contacts, notes, enrollments, programs
-- (Admin-only restrictions on field builder enforced in the frontend by role check)
create policy "Authenticated full access: contacts"
  on public.contacts for all to authenticated using (true) with check (true);

create policy "Authenticated full access: notes"
  on public.notes for all to authenticated using (true) with check (true);

create policy "Authenticated full access: programs"
  on public.programs for all to authenticated using (true) with check (true);

create policy "Authenticated full access: program_fields"
  on public.program_fields for all to authenticated using (true) with check (true);

create policy "Authenticated full access: contact_fields"
  on public.contact_fields for all to authenticated using (true) with check (true);

create policy "Authenticated full access: contact_field_values"
  on public.contact_field_values for all to authenticated using (true) with check (true);

create policy "Authenticated full access: enrollments"
  on public.enrollments for all to authenticated using (true) with check (true);

create policy "Authenticated full access: enrollment_values"
  on public.enrollment_values for all to authenticated using (true) with check (true);

-- ── 9. Supabase Storage bucket for file uploads ───────────────────────────────
-- Run this separately in the Storage tab, or via SQL:
insert into storage.buckets (id, name, public)
values ('crm-files', 'crm-files', false)
on conflict do nothing;

create policy "Authenticated users can upload files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'crm-files');

create policy "Authenticated users can read files"
  on storage.objects for select to authenticated
  using (bucket_id = 'crm-files');

-- ── 10. Make first user an admin (run after your first sign-up) ───────────────
-- Replace the email below with your own:
-- update public.user_profiles set role = 'admin' where email = 'you@example.com';


-- ── 11. Make first user an admin (run after your first sign-up) ───────────────
-- Replace the email below with your own:
-- update public.user_profiles set role = 'admin' where email = 'you@example.com';

-- ── 12. Staff profiles RLS ────────────────────────────────────────────────────
create policy "Authenticated full access: staff_profiles"
  on public.staff_profiles for all to authenticated using (true) with check (true);

-- ── 13. Migration: add new contact columns if upgrading existing DB ───────────
-- Run these if you already have the contacts table from an earlier schema version.
alter table public.contacts add column if not exists other_names text;
alter table public.contacts add column if not exists gender text check (gender in ('male','female','other'));
alter table public.contacts add column if not exists date_of_birth date;
alter table public.contacts add column if not exists place_of_birth text;
alter table public.contacts add column if not exists address text;
alter table public.contacts add column if not exists is_staff boolean not null default false;
alter table public.contacts add column if not exists related_contact_id bigint references public.contacts(id) on delete set null;
