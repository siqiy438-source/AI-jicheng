-- 修复：admin积分调整在权限收紧后失效
-- 原因：admin_adjust_credits 依赖 add_credits/deduct_credits，
-- 而这两个函数已限制为 service_role 才可调用。

create or replace function public.admin_adjust_credits(
  p_target_user_id uuid,
  p_type text,
  p_amount numeric(12, 2),
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_amount numeric(12, 2);
  v_balance_before numeric(12, 2);
  v_balance_after numeric(12, 2);
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  if p_type not in ('add', 'deduct') then
    return jsonb_build_object('success', false, 'error', 'INVALID_TYPE');
  end if;

  v_amount := round(coalesce(p_amount, 0)::numeric, 2);
  if v_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  v_admin_id := auth.uid();

  select credits into v_balance_before
  from public.profiles
  where id = p_target_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  if p_type = 'deduct' and v_balance_before < v_amount then
    return jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_BALANCE',
      'balance', v_balance_before,
      'required', v_amount
    );
  end if;

  if p_type = 'add' then
    v_balance_after := round(v_balance_before + v_amount, 2);
  else
    v_balance_after := round(v_balance_before - v_amount, 2);
  end if;

  update public.profiles
  set credits = v_balance_after, updated_at = timezone('utc', now())
  where id = p_target_user_id;

  insert into public.credit_transactions (user_id, type, amount, balance_after, description)
  values (p_target_user_id, p_type, v_amount, v_balance_after, p_reason);

  insert into public.credit_adjustments (
    target_user_id,
    admin_user_id,
    adjustment_type,
    amount,
    balance_before,
    balance_after,
    reason
  ) values (
    p_target_user_id,
    v_admin_id,
    p_type,
    v_amount,
    v_balance_before,
    v_balance_after,
    coalesce(p_reason, '')
  );

  return jsonb_build_object(
    'success', true,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'adjustment_type', p_type,
    'amount', v_amount
  );
end;
$$;
