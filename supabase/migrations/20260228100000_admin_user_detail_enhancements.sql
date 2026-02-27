-- =============================================================
-- Admin user detail enhancements: add nickname to queries
-- 管理员用户查询增强：返回昵称字段
-- =============================================================

-- 1. admin_list_users 加入 nickname
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
  where (p_search is null or email ilike '%' || p_search || '%' or nickname ilike '%' || p_search || '%');

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_rows
  from (
    select
      p.id, p.email, p.nickname, p.credits, p.role, p.plan_tier,
      p.subscription_status, p.created_at, p.updated_at,
      coalesce(au.banned_until is not null
        and (au.banned_until = 'infinity'::timestamptz or au.banned_until > now()), false) as banned
    from profiles p
    left join auth.users au on au.id = p.id
    where (p_search is null or p.email ilike '%' || p_search || '%' or p.nickname ilike '%' || p_search || '%')
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

-- 2. admin_get_user_detail 加入 nickname
create or replace function public.admin_get_user_detail(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
  v_works_count bigint;
  v_materials_count bigint;
  v_kb_count bigint;
  v_recent_transactions jsonb;
  v_usage_summary jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  select row_to_json(p)::jsonb into v_profile
  from (
    select id, email, nickname, credits, role, plan_tier,
           subscription_status, created_at, updated_at
    from profiles where id = p_user_id
  ) p;

  if v_profile is null then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  select count(*) into v_works_count from works where user_id = p_user_id;
  select count(*) into v_materials_count from materials where user_id = p_user_id;
  select count(*) into v_kb_count from knowledge_base where user_id = p_user_id;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_recent_transactions
  from (
    select id, type, amount, balance_after, description, created_at
    from credit_transactions
    where user_id = p_user_id
    order by created_at desc
    limit 20
  ) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_usage_summary
  from (
    select event_type, count(*) as count, max(created_at) as last_used
    from usage_events
    where user_id = p_user_id
    group by event_type
    order by count(*) desc
    limit 10
  ) t;

  return jsonb_build_object(
    'success', true,
    'profile', v_profile,
    'works_count', v_works_count,
    'materials_count', v_materials_count,
    'knowledge_count', v_kb_count,
    'recent_transactions', v_recent_transactions,
    'usage_summary', v_usage_summary
  );
end;
$$;
