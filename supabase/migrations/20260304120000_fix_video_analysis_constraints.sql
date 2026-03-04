-- 修复 video_analysis_sessions 表的约束问题
-- 删除旧的 CHECK 约束（如果存在）

-- 删除 current_round 相关的约束
ALTER TABLE video_analysis_sessions
DROP CONSTRAINT IF EXISTS video_analysis_sessions_current_round_check;

-- 确保 status 约束正确
ALTER TABLE video_analysis_sessions
DROP CONSTRAINT IF EXISTS video_analysis_sessions_status_check;

ALTER TABLE video_analysis_sessions
ADD CONSTRAINT video_analysis_sessions_status_check CHECK (
  status IN ('pending', 'analyzing', 'completed', 'failed')
);

-- 添加注释说明
COMMENT ON TABLE video_analysis_sessions IS '视频分析会话表 - 单次综合分析模式';
COMMENT ON COLUMN video_analysis_sessions.status IS '分析状态: pending(待处理), analyzing(分析中), completed(已完成), failed(失败)';
