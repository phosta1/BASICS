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
  first_name           text        not null,
  last_name            text        not null,
  email                text        not null unique,
  phone                text,
  company              text,
  status               text        not null default 'lead'
                         check (status in ('lead','active','inactive')),
  profile_picture_url  text,
  created_at           timestamptz not null default now()
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

-- Everyone authenticated can read their own profile
create policy "Users read own profile"
  on public.user_profiles for select to authenticated
  using (id = auth.uid());

-- Admins can read all profiles (needed to manage users)
create policy "Admins read all profiles"
  on public.user_profiles for select to authenticated
  using (exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

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


-- ── 11. Allow admins to update any user's role ────────────────────────────────
-- Run this if you did not run the full schema refresh above.
create policy "Admins can update user profiles"
  on public.user_profiles for update to authenticated
  using (exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (true);

-- ── 12. Migration: add 'editor' role (run if upgrading from earlier schema) ───
-- Drop the old check constraint and add a new one with all three roles.
-- Safe to run even if you haven't deployed yet — alter is idempotent here.
alter table public.user_profiles
  drop constraint if exists user_profiles_role_check;

alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in ('admin','editor','viewer'));

-- Rename any existing 'user' rows to 'viewer' (old default → new default)
update public.user_profiles set role = 'viewer' where role = 'user';
