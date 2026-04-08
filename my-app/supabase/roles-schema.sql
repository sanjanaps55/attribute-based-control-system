-- Secure File Sharing System
-- Role + attribute tables for admin-managed teacher/user accounts.

-- 1) Role enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'teacher', 'user');
  end if;
end $$;

-- 2) Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) Profiles table (single source of truth for role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.app_role not null default 'user',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 4) Teacher-specific attributes
create table if not exists public.teacher_attributes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  course_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_teacher_attributes_updated_at on public.teacher_attributes;
create trigger trg_teacher_attributes_updated_at
before update on public.teacher_attributes
for each row
execute function public.set_updated_at();

-- 5) User-specific attributes (student-equivalent in your UX)
create table if not exists public.user_attributes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  year text not null,
  department text not null,
  course_codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_attributes_updated_at on public.user_attributes;
create trigger trg_user_attributes_updated_at
before update on public.user_attributes
for each row
execute function public.set_updated_at();

-- 6) Admin check helper used by RLS policies
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- 7) Enable RLS
alter table public.profiles enable row level security;
alter table public.teacher_attributes enable row level security;
alter table public.user_attributes enable row level security;

-- profiles: admin full control, users can read their own profile
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- teacher attributes: admin manage, owner read
drop policy if exists "teacher_attributes_admin_all" on public.teacher_attributes;
create policy "teacher_attributes_admin_all"
on public.teacher_attributes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "teacher_attributes_select_own" on public.teacher_attributes;
create policy "teacher_attributes_select_own"
on public.teacher_attributes
for select
to authenticated
using (auth.uid() = user_id);

-- user attributes: admin manage, owner read
drop policy if exists "user_attributes_admin_all" on public.user_attributes;
create policy "user_attributes_admin_all"
on public.user_attributes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "user_attributes_select_own" on public.user_attributes;
create policy "user_attributes_select_own"
on public.user_attributes
for select
to authenticated
using (auth.uid() = user_id);

-- 8) Sync profile/attributes from auth.users on account creation
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
  teacher_codes text[];
  user_codes text[];
begin
  role_text := lower(
    coalesce(
      new.raw_user_meta_data ->> 'role',
      new.raw_app_meta_data ->> 'role',
      'user'
    )
  );

  if role_text not in ('admin', 'teacher', 'user') then
    role_text := 'user';
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, role_text::public.app_role)
  on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      updated_at = now();

  if role_text = 'teacher' then
    teacher_codes := coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(new.raw_user_meta_data -> 'attributes' -> 'courseCodes', '[]'::jsonb)
        )
      ),
      '{}'::text[]
    );

    insert into public.teacher_attributes (user_id, course_codes)
    values (new.id, teacher_codes)
    on conflict (user_id) do update
    set course_codes = excluded.course_codes,
        updated_at = now();
  elsif role_text = 'user' then
    user_codes := coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(new.raw_user_meta_data -> 'attributes' -> 'courseCodes', '[]'::jsonb)
        )
      ),
      '{}'::text[]
    );

    insert into public.user_attributes (user_id, year, department, course_codes)
    values (
      new.id,
      coalesce(new.raw_user_meta_data -> 'attributes' ->> 'year', ''),
      coalesce(new.raw_user_meta_data -> 'attributes' ->> 'department', ''),
      user_codes
    )
    on conflict (user_id) do update
    set year = excluded.year,
        department = excluded.department,
        course_codes = excluded.course_codes,
        updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

-- 9) Optional bootstrap:
-- After running this script, ensure your admin user has role='admin' in metadata,
-- then upsert a profile row once:
-- insert into public.profiles (id, email, role)
-- values ('<admin-user-id>', '<admin-email>', 'admin')
-- on conflict (id) do update set role='admin', email=excluded.email, updated_at=now();
