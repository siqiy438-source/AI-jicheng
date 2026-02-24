-- 知识库表：存储用户的文字知识条目（店铺信息、产品优势等）
-- 不设 expires_at，知识库是用户长期资产

create table if not exists public.knowledge_base (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
               references auth.users(id) on delete cascade,
  title      text not null,
  category   text not null default 'general',
  content    text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint kb_title_not_empty check (char_length(trim(title)) > 0),
  constraint kb_content_not_empty check (char_length(trim(content)) > 0)
);

create trigger knowledge_base_set_updated_at
before update on public.knowledge_base
for each row execute procedure public.set_updated_at();

create index if not exists knowledge_base_user_category_idx
  on public.knowledge_base (user_id, category, sort_order);

alter table public.knowledge_base enable row level security;

create policy kb_select_own on public.knowledge_base
  for select to authenticated using ((select auth.uid()) = user_id);

create policy kb_insert_own on public.knowledge_base
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy kb_update_own on public.knowledge_base
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy kb_delete_own on public.knowledge_base
  for delete to authenticated using ((select auth.uid()) = user_id);
