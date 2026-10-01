-- ═══════════════════════════════════════════════════════════════════════════
-- PATCH: Fix user_profiles RLS using a security-definer helper function
-- Run this ONCE in Supabase SQL Editor.
--
-- The helper function breaks the recursive policy loop by running as the
-- database owner (security definer), bypassing RLS when checking the role.
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Create the is_admin() helper (security definer = runs as DB owner,
-- bypasses RLS so no infinite loop)
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

-- Step 2: Drop old/conflicting policies
drop policy if exists "Users read own profile"          on public.user_profiles;
drop policy if exists "Admins read all profiles"        on public.user_profiles;
drop policy if exists "User profiles select"            on public.user_profiles;
drop policy if exists "Admins can update user profiles" on public.user_profiles;

-- Step 3: Recreate clean policies using the helper
create policy "Users read own profile"
  on public.user_profiles for select to authenticated
  using (id = auth.uid());

create policy "Admins read all profiles"
  on public.user_profiles for select to authenticated
  using (public.is_admin());

create policy "Admins can update user profiles"
  on public.user_profiles for update to authenticated
  using (public.is_admin())
  with check (true);
