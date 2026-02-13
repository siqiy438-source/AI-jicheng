-- Credits system: profiles.credits + payment_orders + atomic functions
-- 积分系统：在 profiles 表加 credits 字段，新建 payment_orders 表，原子扣减/增加函数

-- 1. 给 profiles 表添加 credits 字段
alter table public.profiles
  add column if not exists credits bigint not null default 0;

-- 添加非负约束
alter table public.profiles
  add constraint profiles_credits_non_negative check (credits >= 0);

-- 2. 创建 payment_orders 表
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_no text not null unique,
  amount numeric(10, 2) not null,
  credits_base bigint not null,
  credits_bonus bigint not null default 0,
  credits_total bigint not null,
  status text not null default 'pending',
  payment_method text not null default 'alipay',
  trade_no text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  paid_at timestamptz,
  constraint payment_orders_status_check check (
    status in ('pending', 'paid', 'failed', 'expired')
  ),
  constraint payment_orders_amount_positive check (amount > 0),
  constraint payment_orders_credits_positive check (credits_total > 0)
);

-- 索引
create index if not exists payment_orders_user_status_idx
  on public.payment_orders (user_id, status, created_at desc);
create index if not exists payment_orders_order_no_idx
  on public.payment_orders (order_no);

-- RLS
alter table public.payment_orders enable row level security;

create policy payment_orders_select_own on public.payment_orders
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- updated_at 触发器
drop trigger if exists payment_orders_set_updated_at on public.payment_orders;
create trigger payment_orders_set_updated_at
  before update on public.payment_orders
  for each row execute procedure public.set_updated_at();

-- 3. 原子扣减积分函数
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount bigint,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current bigint;
  v_new bigint;
begin
  -- 锁行防止并发
  select credits into v_current
  from profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  if v_current < p_amount then
    return jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_BALANCE',
      'balance', v_current,
      'required', p_amount
    );
  end if;

  v_new := v_current - p_amount;

  update profiles
  set credits = v_new, updated_at = timezone('utc', now())
  where id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'balance_before', v_current,
    'balance_after', v_new,
    'deducted', p_amount
  );
end;
$$;

-- 4. 原子增加积分函数
create or replace function public.add_credits(
  p_user_id uuid,
  p_amount bigint,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new bigint;
begin
  update profiles
  set credits = credits + p_amount, updated_at = timezone('utc', now())
  where id = p_user_id
  returning credits into v_new;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  return jsonb_build_object(
    'success', true,
    'balance_after', v_new,
    'added', p_amount
  );
end;
$$;

-- 5. 修改新用户注册函数，赠送 100 积分
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits)
  values (new.id, coalesce(new.email, ''), 100)
  on conflict (id)
  do update set
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;
