-- 积分流水表：记录每一笔积分变动（消费、充值、退款、注册赠送）
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount bigint not null,
  balance_after bigint not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint credit_transactions_type_check check (
    type in ('deduct', 'add', 'purchase', 'refund', 'register')
  )
);

-- 索引
create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions (user_id, created_at desc);

-- RLS：用户只能查看自己的记录
alter table public.credit_transactions enable row level security;

create policy credit_transactions_select_own on public.credit_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- 重建 deduct_credits：扣减后自动写流水
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

  -- 写入流水
  insert into credit_transactions (user_id, type, amount, balance_after, description)
  values (p_user_id, 'deduct', p_amount, v_new, p_description);

  return jsonb_build_object(
    'success', true,
    'balance_before', v_current,
    'balance_after', v_new,
    'deducted', p_amount
  );
end;
$$;

-- 重建 add_credits：增加后自动写流水
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
  v_type text;
begin
  update profiles
  set credits = credits + p_amount, updated_at = timezone('utc', now())
  where id = p_user_id
  returning credits into v_new;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  -- 根据 description 推断类型
  v_type := case
    when p_description ilike '%退款%' or p_description ilike '%refund%' then 'refund'
    when p_description ilike '%充值%' or p_description ilike '%purchase%' then 'purchase'
    when p_description ilike '%注册%' or p_description ilike '%register%' then 'register'
    else 'add'
  end;

  insert into credit_transactions (user_id, type, amount, balance_after, description)
  values (p_user_id, v_type, p_amount, v_new, p_description);

  return jsonb_build_object(
    'success', true,
    'balance_after', v_new,
    'added', p_amount
  );
end;
$$;
