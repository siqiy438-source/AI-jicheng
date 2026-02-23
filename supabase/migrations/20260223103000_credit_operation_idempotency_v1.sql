-- V1: 积分扣费/退款幂等操作表 + 原子 begin/finalize RPC

create table if not exists public.credit_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null,
  feature_code text not null,
  amount numeric(12, 2) not null,
  status text not null default 'pending',
  description text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  succeeded_at timestamptz,
  refunded_at timestamptz,
  constraint credit_operations_amount_positive check (amount > 0),
  constraint credit_operations_status_check check (
    status in ('pending', 'charged', 'succeeded', 'refunded')
  ),
  constraint credit_operations_user_op_feature_unique unique (user_id, operation_id, feature_code)
);

create index if not exists credit_operations_user_created_idx
  on public.credit_operations (user_id, created_at desc);

create index if not exists credit_operations_status_idx
  on public.credit_operations (status, updated_at desc);

alter table public.credit_operations enable row level security;

drop trigger if exists credit_operations_set_updated_at on public.credit_operations;
create trigger credit_operations_set_updated_at
  before update on public.credit_operations
  for each row execute procedure public.set_updated_at();

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
begin
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

  return jsonb_build_object(
    'success', true,
    'already_exists', false,
    'status', 'charged',
    'amount', v_amount,
    'balance_after', (v_deduct_result ->> 'balance')::numeric
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
