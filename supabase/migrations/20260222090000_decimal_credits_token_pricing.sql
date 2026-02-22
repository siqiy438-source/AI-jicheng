-- Credits 升级为两位小数，支持按 token 计费

alter table if exists public.profiles
  alter column credits type numeric(12, 2) using credits::numeric(12, 2);

alter table if exists public.credit_transactions
  alter column amount type numeric(12, 2) using amount::numeric(12, 2),
  alter column balance_after type numeric(12, 2) using balance_after::numeric(12, 2);

alter table if exists public.credit_adjustments
  alter column amount type numeric(12, 2) using amount::numeric(12, 2),
  alter column balance_before type numeric(12, 2) using balance_before::numeric(12, 2),
  alter column balance_after type numeric(12, 2) using balance_after::numeric(12, 2);

drop function if exists public.deduct_credits(uuid, bigint, text);
drop function if exists public.add_credits(uuid, bigint, text);
drop function if exists public.admin_adjust_credits(uuid, text, bigint, text);

create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount numeric(12, 2),
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric(12, 2);
  v_current numeric(12, 2);
  v_new numeric(12, 2);
begin
  v_amount := round(coalesce(p_amount, 0)::numeric, 2);
  if v_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  select credits into v_current
  from profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  if v_current < v_amount then
    return jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_BALANCE',
      'balance', v_current,
      'required', v_amount
    );
  end if;

  v_new := round(v_current - v_amount, 2);

  update profiles
  set credits = v_new, updated_at = timezone('utc', now())
  where id = p_user_id;

  insert into credit_transactions (user_id, type, amount, balance_after, description)
  values (p_user_id, 'deduct', v_amount, v_new, p_description);

  return jsonb_build_object(
    'success', true,
    'balance_before', v_current,
    'balance_after', v_new,
    'deducted', v_amount
  );
end;
$$;

create or replace function public.add_credits(
  p_user_id uuid,
  p_amount numeric(12, 2),
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric(12, 2);
  v_new numeric(12, 2);
  v_type text;
begin
  v_amount := round(coalesce(p_amount, 0)::numeric, 2);
  if v_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  update profiles
  set credits = round(credits + v_amount, 2), updated_at = timezone('utc', now())
  where id = p_user_id
  returning credits into v_new;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  v_type := case
    when p_description ilike '%退款%' or p_description ilike '%refund%' then 'refund'
    when p_description ilike '%充值%' or p_description ilike '%purchase%' then 'purchase'
    when p_description ilike '%注册%' or p_description ilike '%register%' then 'register'
    else 'add'
  end;

  insert into credit_transactions (user_id, type, amount, balance_after, description)
  values (p_user_id, v_type, v_amount, v_new, p_description);

  return jsonb_build_object(
    'success', true,
    'balance_after', v_new,
    'added', v_amount
  );
end;
$$;

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
  v_result jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  v_admin_id := auth.uid();
  v_amount := round(coalesce(p_amount, 0)::numeric, 2);

  if p_type not in ('add', 'deduct') then
    return jsonb_build_object('success', false, 'error', 'INVALID_TYPE');
  end if;

  if v_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  select credits into v_balance_before
  from profiles
  where id = p_target_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  if p_type = 'add' then
    v_result := public.add_credits(p_target_user_id, v_amount, p_reason);
  else
    v_result := public.deduct_credits(p_target_user_id, v_amount, p_reason);
  end if;

  if not (v_result ->> 'success')::boolean then
    return v_result;
  end if;

  insert into credit_adjustments (
    target_user_id, admin_user_id, adjustment_type,
    amount, balance_before, balance_after, reason
  ) values (
    p_target_user_id, v_admin_id, p_type,
    v_amount, v_balance_before,
    (v_result ->> 'balance_after')::numeric,
    coalesce(p_reason, '')
  );

  return jsonb_build_object(
    'success', true,
    'balance_before', v_balance_before,
    'balance_after', (v_result ->> 'balance_after')::numeric,
    'adjustment_type', p_type,
    'amount', v_amount
  );
end;
$$;
