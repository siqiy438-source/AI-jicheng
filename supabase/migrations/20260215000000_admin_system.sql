-- =============================================================
-- Admin system: role column, is_admin helper, RLS policies,
-- credit_adjustments audit table, admin RPC functions
-- 管理员系统：角色字段、权限校验、审计日志、管理员 RPC
-- =============================================================

-- 1. 给 profiles 表添加 role 字段
alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- 2. 辅助函数：当前用户是否为管理员
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. 积分调整审计表
create table if not exists public.credit_adjustments (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  adjustment_type text not null,
  amount bigint not null,
  balance_before bigint not null,
  balance_after bigint not null,
  reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  constraint credit_adjustments_type_check check (
    adjustment_type in ('add', 'deduct')
  ),
  constraint credit_adjustments_amount_positive check (amount > 0)
);

create index if not exists credit_adjustments_target_idx
  on public.credit_adjustments (target_user_id, created_at desc);
create index if not exists credit_adjustments_admin_idx
  on public.credit_adjustments (admin_user_id, created_at desc);

alter table public.credit_adjustments enable row level security;

-- 仅管理员可查看审计日志，无 INSERT/UPDATE/DELETE 策略（只能通过 RPC 写入）
create policy credit_adjustments_admin_select
  on public.credit_adjustments
  for select to authenticated
  using (public.is_admin());

-- 4. 管理员可查看所有用户的 profiles（与现有 select_own 策略并存，Postgres RLS 默认 OR 语义）
create policy profiles_admin_select_all
  on public.profiles
  for select to authenticated
  using (public.is_admin());

-- 5. 管理员 RPC：分页查询用户列表
create or replace function public.admin_list_users(
  p_page integer default 1,
  p_page_size integer default 50,
  p_search text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offset integer;
  v_total bigint;
  v_rows jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  v_offset := (p_page - 1) * p_page_size;

  select count(*) into v_total
  from profiles
  where (p_search is null or email ilike '%' || p_search || '%');

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_rows
  from (
    select
      p.id,
      p.email,
      p.credits,
      p.role,
      p.plan_tier,
      p.subscription_status,
      p.created_at,
      p.updated_at
    from profiles p
    where (p_search is null or p.email ilike '%' || p_search || '%')
    order by p.created_at desc
    limit p_page_size offset v_offset
  ) t;

  return jsonb_build_object(
    'success', true,
    'data', v_rows,
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size
  );
end;
$$;

-- 6. 管理员 RPC：调整积分（复用现有 add_credits/deduct_credits + 审计日志）
create or replace function public.admin_adjust_credits(
  p_target_user_id uuid,
  p_type text,
  p_amount bigint,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_balance_before bigint;
  v_result jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  v_admin_id := auth.uid();

  if p_type not in ('add', 'deduct') then
    return jsonb_build_object('success', false, 'error', 'INVALID_TYPE');
  end if;

  if p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  -- 先锁行拿到操作前余额（add_credits 不返回 balance_before）
  select credits into v_balance_before
  from profiles
  where id = p_target_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  if p_type = 'add' then
    v_result := public.add_credits(p_target_user_id, p_amount, p_reason);
  else
    v_result := public.deduct_credits(p_target_user_id, p_amount, p_reason);
  end if;

  if not (v_result ->> 'success')::boolean then
    return v_result;
  end if;

  -- 写审计日志
  insert into credit_adjustments (
    target_user_id, admin_user_id, adjustment_type,
    amount, balance_before, balance_after, reason
  ) values (
    p_target_user_id, v_admin_id, p_type,
    p_amount, v_balance_before,
    (v_result ->> 'balance_after')::bigint,
    coalesce(p_reason, '')
  );

  return jsonb_build_object(
    'success', true,
    'balance_before', v_balance_before,
    'balance_after', (v_result ->> 'balance_after')::bigint,
    'adjustment_type', p_type,
    'amount', p_amount
  );
end;
$$;

-- 7. 管理员 RPC：查询某用户的积分调整历史
create or replace function public.admin_get_credit_history(
  p_target_user_id uuid,
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_rows
  from (
    select
      ca.id,
      ca.adjustment_type,
      ca.amount,
      ca.balance_before,
      ca.balance_after,
      ca.reason,
      ca.created_at,
      admin_p.email as admin_email
    from credit_adjustments ca
    join profiles admin_p on admin_p.id = ca.admin_user_id
    where ca.target_user_id = p_target_user_id
    order by ca.created_at desc
    limit p_limit
  ) t;

  return jsonb_build_object('success', true, 'data', v_rows);
end;
$$;
