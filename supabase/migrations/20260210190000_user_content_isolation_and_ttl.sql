-- Core user-content schema for isolated works/materials + 30-day rolling cleanup

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.extend_expiration_on_write()
returns trigger
language plpgsql
as $$
begin
  new.expires_at = timezone('utc', now()) + interval '30 days';
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  plan_tier text not null default 'free',
  subscription_status text not null default 'inactive',
  payment_customer_id text,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  type text not null,
  tool text,
  content_json jsonb,
  thumbnail_url text,
  storage_bucket text,
  storage_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  constraint works_expiry_after_create check (expires_at > created_at)
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  file_type text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  folder_name text,
  storage_bucket text not null default 'materials-assets',
  storage_path text not null,
  preview_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  constraint materials_size_non_negative check (size_bytes >= 0),
  constraint materials_expiry_after_create check (expires_at > created_at),
  constraint materials_storage_unique unique (storage_bucket, storage_path)
);

create table if not exists public.material_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint material_folders_unique_name_per_user unique (user_id, name)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_type text not null,
  quantity integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint usage_events_quantity_positive check (quantity > 0)
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id)
  do update set
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at
before update on public.works
for each row execute procedure public.set_updated_at();

drop trigger if exists works_extend_expiration_on_write on public.works;
create trigger works_extend_expiration_on_write
before update on public.works
for each row execute procedure public.extend_expiration_on_write();

drop trigger if exists materials_set_updated_at on public.materials;
create trigger materials_set_updated_at
before update on public.materials
for each row execute procedure public.set_updated_at();

drop trigger if exists material_folders_set_updated_at on public.material_folders;
create trigger material_folders_set_updated_at
before update on public.material_folders
for each row execute procedure public.set_updated_at();

drop trigger if exists materials_extend_expiration_on_write on public.materials;
create trigger materials_extend_expiration_on_write
before update on public.materials
for each row execute procedure public.extend_expiration_on_write();

create index if not exists works_user_created_at_idx on public.works (user_id, created_at desc);
create index if not exists works_user_type_created_at_idx on public.works (user_id, type, created_at desc);
create index if not exists works_expires_at_idx on public.works (expires_at);

create index if not exists materials_user_created_at_idx on public.materials (user_id, created_at desc);
create index if not exists materials_user_folder_created_at_idx on public.materials (user_id, folder_name, created_at desc);
create index if not exists materials_expires_at_idx on public.materials (expires_at);
create index if not exists material_folders_user_created_at_idx on public.material_folders (user_id, created_at desc);

create index if not exists usage_events_user_created_at_idx on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_type_created_at_idx on public.usage_events (event_type, created_at desc);

alter table public.profiles enable row level security;
alter table public.works enable row level security;
alter table public.materials enable row level security;
alter table public.material_folders enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists works_select_own on public.works;
create policy works_select_own
on public.works
for select
to authenticated
using ((select auth.uid()) = user_id and expires_at > timezone('utc', now()));

drop policy if exists works_insert_own on public.works;
create policy works_insert_own
on public.works
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists works_update_own on public.works;
create policy works_update_own
on public.works
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists works_delete_own on public.works;
create policy works_delete_own
on public.works
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists materials_select_own on public.materials;
create policy materials_select_own
on public.materials
for select
to authenticated
using ((select auth.uid()) = user_id and expires_at > timezone('utc', now()));

drop policy if exists materials_insert_own on public.materials;
create policy materials_insert_own
on public.materials
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists materials_update_own on public.materials;
create policy materials_update_own
on public.materials
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists materials_delete_own on public.materials;
create policy materials_delete_own
on public.materials
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists material_folders_select_own on public.material_folders;
create policy material_folders_select_own
on public.material_folders
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists material_folders_insert_own on public.material_folders;
create policy material_folders_insert_own
on public.material_folders
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists material_folders_update_own on public.material_folders;
create policy material_folders_update_own
on public.material_folders
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists material_folders_delete_own on public.material_folders;
create policy material_folders_delete_own
on public.material_folders
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists usage_events_select_own on public.usage_events;
create policy usage_events_select_own
on public.usage_events
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists usage_events_insert_own on public.usage_events;
create policy usage_events_insert_own
on public.usage_events
for insert
to authenticated
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('works-assets', 'works-assets', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('materials-assets', 'materials-assets', false)
on conflict (id) do nothing;

drop policy if exists works_assets_select_own on storage.objects;
create policy works_assets_select_own
on storage.objects
for select
to authenticated
using (bucket_id = 'works-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists works_assets_insert_own on storage.objects;
create policy works_assets_insert_own
on storage.objects
for insert
to authenticated
with check (bucket_id = 'works-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists works_assets_update_own on storage.objects;
create policy works_assets_update_own
on storage.objects
for update
to authenticated
using (bucket_id = 'works-assets' and split_part(name, '/', 1) = (select auth.uid())::text)
with check (bucket_id = 'works-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists works_assets_delete_own on storage.objects;
create policy works_assets_delete_own
on storage.objects
for delete
to authenticated
using (bucket_id = 'works-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists materials_assets_select_own on storage.objects;
create policy materials_assets_select_own
on storage.objects
for select
to authenticated
using (bucket_id = 'materials-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists materials_assets_insert_own on storage.objects;
create policy materials_assets_insert_own
on storage.objects
for insert
to authenticated
with check (bucket_id = 'materials-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists materials_assets_update_own on storage.objects;
create policy materials_assets_update_own
on storage.objects
for update
to authenticated
using (bucket_id = 'materials-assets' and split_part(name, '/', 1) = (select auth.uid())::text)
with check (bucket_id = 'materials-assets' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists materials_assets_delete_own on storage.objects;
create policy materials_assets_delete_own
on storage.objects
for delete
to authenticated
using (bucket_id = 'materials-assets' and split_part(name, '/', 1) = (select auth.uid())::text);
