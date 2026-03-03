-- 视频分析会话表：记录每次视频分析的会话信息
create table if not exists public.video_analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_filename text not null,
  video_duration integer,
  status text not null default 'pending',
  current_round integer not null default 0,
  total_rounds integer not null default 6,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint video_analysis_sessions_status_check check (
    status in ('pending', 'analyzing', 'completed', 'failed')
  ),
  constraint video_analysis_sessions_current_round_check check (
    current_round >= 0 and current_round <= total_rounds
  )
);

-- 视频分析轮次表：记录每一轮分析的结果
create table if not exists public.video_analysis_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.video_analysis_sessions(id) on delete cascade,
  round_number integer not null,
  round_name text not null,
  status text not null default 'pending',
  result jsonb,
  credits_cost integer not null default 50,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint video_analysis_rounds_status_check check (
    status in ('pending', 'analyzing', 'completed', 'failed')
  ),
  constraint video_analysis_rounds_round_number_check check (
    round_number >= 1 and round_number <= 6
  ),
  constraint video_analysis_rounds_unique_session_round unique (session_id, round_number)
);

-- 索引：按用户和创建时间查询会话
create index if not exists video_analysis_sessions_user_created_idx
  on public.video_analysis_sessions (user_id, created_at desc);

-- 索引：按会话查询轮次
create index if not exists video_analysis_rounds_session_idx
  on public.video_analysis_rounds (session_id, round_number);

-- RLS：用户只能查看自己的分析会话
alter table public.video_analysis_sessions enable row level security;

drop policy if exists video_analysis_sessions_select_own on public.video_analysis_sessions;
create policy video_analysis_sessions_select_own on public.video_analysis_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- RLS：用户只能查看自己的分析轮次
alter table public.video_analysis_rounds enable row level security;

drop policy if exists video_analysis_rounds_select_own on public.video_analysis_rounds;
create policy video_analysis_rounds_select_own on public.video_analysis_rounds
  for select to authenticated
  using (
    exists (
      select 1 from public.video_analysis_sessions
      where id = video_analysis_rounds.session_id
      and user_id = (select auth.uid())
    )
  );
