-- Harden credit RPC functions: service_role only + in-function guard

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
  if auth.role() <> 'service_role' then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

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
  if auth.role() <> 'service_role' then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

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

create or replace function public.begin_credit_operation(
  p_user_id uuid,
  p_operation_id text,
  p_feature_code text,
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
  v_inserted_id uuid;
  v_existing_status text;
  v_existing_amount numeric(12, 2);
  v_deduct_result jsonb;
  v_balance_after numeric(12, 2);
begin
  if auth.role() <> 'service_role' then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  v_amount := round(coalesce(p_amount, 0)::numeric, 2);

  if coalesce(trim(p_operation_id), '') = '' then
    return jsonb_build_object('success', false, 'error', 'INVALID_OPERATION_ID');
  end if;

  if coalesce(trim(p_feature_code), '') = '' then
    return jsonb_build_object('success', false, 'error', 'INVALID_FEATURE_CODE');
  end if;

  if v_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT');
  end if;

  insert into public.credit_operations (
    user_id, operation_id, feature_code, amount, status, description
  ) values (
    p_user_id, p_operation_id, p_feature_code, v_amount, 'pending', p_description
  )
  on conflict (user_id, operation_id, feature_code) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    select status, amount
      into v_existing_status, v_existing_amount
    from public.credit_operations
    where user_id = p_user_id
      and operation_id = p_operation_id
      and feature_code = p_feature_code;

    return jsonb_build_object(
      'success', true,
      'already_exists', true,
      'status', coalesce(v_existing_status, 'unknown'),
      'amount', coalesce(v_existing_amount, v_amount)
    );
  end if;

  v_deduct_result := public.deduct_credits(
    p_user_id,
    v_amount,
    coalesce(p_description, p_feature_code) || '#op:' || p_operation_id
  );

  if not coalesce((v_deduct_result ->> 'success')::boolean, false) then
    delete from public.credit_operations where id = v_inserted_id;
    return v_deduct_result;
  end if;

  update public.credit_operations
  set status = 'charged'
  where id = v_inserted_id;

  v_balance_after := coalesce(
    (v_deduct_result ->> 'balance_after')::numeric,
    (v_deduct_result ->> 'balance')::numeric
  );

  return jsonb_build_object(
    'success', true,
    'already_exists', false,
    'status', 'charged',
    'amount', v_amount,
    'balance_after', v_balance_after,
    'balance', v_balance_after
  );
end;
$$;

create or replace function public.finalize_credit_operation(
  p_user_id uuid,
  p_operation_id text,
  p_feature_code text,
  p_success boolean,
  p_error_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operation public.credit_operations%rowtype;
  v_refund_result jsonb;
begin
  if auth.role() <> 'service_role' then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  select *
    into v_operation
  from public.credit_operations
  where user_id = p_user_id
    and operation_id = p_operation_id
    and feature_code = p_feature_code
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'OPERATION_NOT_FOUND');
  end if;

  if p_success then
    if v_operation.status = 'succeeded' then
      return jsonb_build_object(
        'success', true,
        'already_finalized', true,
        'status', 'succeeded'
      );
    end if;

    if v_operation.status = 'refunded' then
      return jsonb_build_object(
        'success', true,
        'already_finalized', true,
        'status', 'refunded'
      );
    end if;

    if v_operation.status <> 'charged' then
      return jsonb_build_object(
        'success', false,
        'error', 'INVALID_OPERATION_STATE',
        'status', v_operation.status
      );
    end if;

    update public.credit_operations
    set
      status = 'succeeded',
      succeeded_at = timezone('utc', now()),
      error_message = null
    where id = v_operation.id;

    return jsonb_build_object(
      'success', true,
      'status', 'succeeded'
    );
  end if;

  if v_operation.status = 'refunded' then
    return jsonb_build_object(
      'success', true,
      'already_refunded', true,
      'status', 'refunded'
    );
  end if;

  if v_operation.status = 'succeeded' then
    return jsonb_build_object(
      'success', true,
      'already_finalized', true,
      'status', 'succeeded'
    );
  end if;

  if v_operation.status <> 'charged' then
    return jsonb_build_object(
      'success', false,
      'error', 'INVALID_OPERATION_STATE',
      'status', v_operation.status
    );
  end if;

  v_refund_result := public.add_credits(
    p_user_id,
    v_operation.amount,
    '退款-' || p_feature_code || '#op:' || p_operation_id
  );

  if not coalesce((v_refund_result ->> 'success')::boolean, false) then
    return v_refund_result;
  end if;

  update public.credit_operations
  set
    status = 'refunded',
    refunded_at = timezone('utc', now()),
    error_message = coalesce(p_error_message, '')
  where id = v_operation.id;

  return jsonb_build_object(
    'success', true,
    'status', 'refunded',
    'refunded', v_operation.amount
  );
end;
$$;

revoke all on function public.deduct_credits(uuid, numeric, text) from public, anon, authenticated;
revoke all on function public.add_credits(uuid, numeric, text) from public, anon, authenticated;
revoke all on function public.begin_credit_operation(uuid, text, text, numeric, text) from public, anon, authenticated;
revoke all on function public.finalize_credit_operation(uuid, text, text, boolean, text) from public, anon, authenticated;

grant execute on function public.deduct_credits(uuid, numeric, text) to service_role;
grant execute on function public.add_credits(uuid, numeric, text) to service_role;
grant execute on function public.begin_credit_operation(uuid, text, text, numeric, text) to service_role;
grant execute on function public.finalize_credit_operation(uuid, text, text, boolean, text) to service_role;
