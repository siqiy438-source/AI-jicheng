-- =============================================================
-- Admin Dashboard RPCs
-- 在 Supabase SQL Editor 中执行此文件
-- =============================================================

-- 1. 数据看板：核心运营指标
create or replace function public.admin_get_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today_start timestamptz := date_trunc('day', timezone('utc', now()));
  v_month_start timestamptz := date_trunc('month', timezone('utc', now()));
  v_total_users bigint;
  v_today_users bigint;
  v_month_users bigint;
  v_total_revenue numeric;
  v_today_revenue numeric;
  v_month_revenue numeric;
  v_total_deduct numeric;
  v_today_deduct numeric;
begin
  if not public.is_admin() then
    return jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  end if;

  select count(*) into v_total_users from profiles;
  select count(*) into v_today_users from profiles where created_at >= v_today_start;
  select count(*) into v_month_users from profiles where created_at >= v_month_start;

  select coalesce(sum(amount), 0) into v_total_revenue
    from payment_orders where status = 'paid';
  select coalesce(sum(amount), 0) into v_today_revenue
    from payment_orders where status = 'paid' and paid_at >= v_today_start;
  select coalesce(sum(amount), 0) into v_month_revenue
    from payment_orders where status = 'paid' and paid_at >= v_month_start;

  select coalesce(sum(amount), 0) into v_total_deduct
    from credit_transactions where type = 'deduct';
  select coalesce(sum(amount), 0) into v_today_deduct
    from credit_transactions where type = 'deduct' and created_at >= v_today_start;

  return jsonb_build_object(
    'success', true,
    'total_users', v_total_users,
    'today_users', v_today_users,
    'month_users', v_month_users,
    'total_revenue', v_total_revenue,
    'today_revenue', v_today_revenue,
    'month_revenue', v_month_revenue,
    'total_deduct', v_total_deduct,
    'today_deduct', v_today_deduct
  );
end;
$$;

-- 2. 近 30 天注册趋势
create or replace function public.admin_get_registration_trend()
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

  select coalesce(jsonb_agg(t order by t.day asc), '[]'::jsonb)
  into v_rows
  from (
    select
      date_trunc('day', created_at) as day,
      to_char(date_trunc('day', created_at), 'MM-DD') as date,
      count(*)::int as count
    from profiles
    where created_at >= now() - interval '30 days'
    group by date_trunc('day', created_at)
  ) t;

  return jsonb_build_object('success', true, 'data', v_rows);
end;
$$;

-- 3. 近 30 天收入趋势
create or replace function public.admin_get_revenue_trend()
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

  select coalesce(jsonb_agg(t order by t.day asc), '[]'::jsonb)
  into v_rows
  from (
    select
      date_trunc('day', paid_at) as day,
      to_char(date_trunc('day', paid_at), 'MM-DD') as date,
      coalesce(sum(amount), 0)::numeric as revenue
    from payment_orders
    where status = 'paid'
      and paid_at >= now() - interval '30 days'
    group by date_trunc('day', paid_at)
  ) t;

  return jsonb_build_object('success', true, 'data', v_rows);
end;
$$;

-- 4. 功能积分消耗分布（top 10，中文名）
create or replace function public.admin_get_feature_usage()
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

  select coalesce(jsonb_agg(t), '[]'::jsonb)
  into v_rows
  from (
    select
      case split_part(coalesce(description, ''), '#', 1)
        when 'ai_image_standard'         then '标准绘图'
        when 'ai_image_premium'          then 'Pro绘图'
        when 'ai_display_analysis'       then '陈列分析'
        when 'ai_display_standard'       then '陈列图(标准)'
        when 'ai_display_premium'        then '陈列图(Pro)'
        when 'ai_outfit_standard'        then '挂搭图(标准)'
        when 'ai_outfit_premium'         then '挂搭图(Pro)'
        when 'ai_fashion_standard'       then '模特图(标准)'
        when 'ai_fashion_premium'        then '模特图(Pro)'
        when 'ai_detail_standard'        then '细节特写(标准)'
        when 'ai_detail_premium'         then '细节特写(Pro)'
        when 'ai_flatlay_standard'       then '平铺摆拍(标准)'
        when 'ai_flatlay_premium'        then '平铺摆拍(Pro)'
        when 'ai_copywriting'            then 'AI文案生成'
        when 'ai_ppt_outline'            then 'PPT大纲'
        when 'ai_ppt_slide'              then 'PPT页面描述'
        when 'ai_ppt_image_standard'     then 'PPT图片生成'
        when 'ai_report_page'            then '报告生成'
        when 'ai_outfit_recommend'       then '专业搭配师'
        when 'ai_outfit_visual_standard' then '搭配师模特图'
        when 'ai_fabric_analysis'        then '面料说明生成器'
        else coalesce(nullif(split_part(description, '#', 1), ''), '其他')
      end as feature,
      sum(amount)::numeric as total_credits
    from credit_transactions
    where type = 'deduct'
    group by split_part(coalesce(description, ''), '#', 1)
    order by sum(amount) desc
    limit 10
  ) t;

  return jsonb_build_object('success', true, 'data', v_rows);
end;
$$;

-- 5. 订单管理：分页 + 状态筛选
create or replace function public.admin_list_orders(
  p_page integer default 1,
  p_page_size integer default 20,
  p_status text default null
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
  from payment_orders po
  where (p_status is null or po.status = p_status);

  select coalesce(jsonb_agg(t), '[]'::jsonb)
  into v_rows
  from (
    select
      po.id,
      po.order_no,
      po.amount,
      po.credits_total,
      po.status,
      po.created_at,
      po.paid_at,
      p.email as user_email
    from payment_orders po
    join profiles p on p.id = po.user_id
    where (p_status is null or po.status = p_status)
    order by po.created_at desc
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

-- 6. 调整记录：分页查询所有管理员操作历史
create or replace function public.admin_list_adjustments(
  p_page integer default 1,
  p_page_size integer default 20
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

  select count(*) into v_total from credit_adjustments;

  select coalesce(jsonb_agg(t), '[]'::jsonb)
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
      admin_p.email as admin_email,
      target_p.email as target_email
    from credit_adjustments ca
    join profiles admin_p on admin_p.id = ca.admin_user_id
    join profiles target_p on target_p.id = ca.target_user_id
    order by ca.created_at desc
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

-- 7. 用户使用排行榜（按积分消耗 top 20）
create or replace function public.admin_get_user_leaderboard(
  p_limit integer default 20
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

  select coalesce(jsonb_agg(t), '[]'::jsonb)
  into v_rows
  from (
    select
      p.email,
      p.credits as current_balance,
      coalesce(ct.total_deduct, 0) as total_deduct,
      coalesce(ct.deduct_count, 0) as deduct_count
    from profiles p
    left join (
      select
        user_id,
        sum(amount) as total_deduct,
        count(*) as deduct_count
      from credit_transactions
      where type = 'deduct'
      group by user_id
    ) ct on ct.user_id = p.id
    order by coalesce(ct.total_deduct, 0) desc
    limit p_limit
  ) t;

  return jsonb_build_object('success', true, 'data', v_rows);
end;
$$;
