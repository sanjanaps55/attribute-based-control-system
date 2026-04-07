create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  course_code text not null,
  slot text not null,
  policy text not null,
  original_file_name text not null,
  mime_type text not null,
  ciphertext_base64 text not null,
  encrypted_key text not null,
  nonce_base64 text not null,
  auth_tag_base64 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_assignments_updated_at on public.assignments;
create trigger trg_assignments_updated_at
before update on public.assignments
for each row
execute function public.set_updated_at();

alter table public.assignments enable row level security;

drop policy if exists "assignments_teacher_insert" on public.assignments;
create policy "assignments_teacher_insert"
on public.assignments
for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "assignments_teacher_select_own" on public.assignments;
create policy "assignments_teacher_select_own"
on public.assignments
for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "assignments_user_read_all" on public.assignments;
create policy "assignments_user_read_all"
on public.assignments
for select
to authenticated
using (true);
