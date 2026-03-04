-- 彻底清理 video_analysis_sessions 表的旧约束
-- 确保所有旧的 CHECK 约束都被删除

-- 1. 删除所有可能存在的旧约束
ALTER TABLE video_analysis_sessions
DROP CONSTRAINT IF EXISTS video_analysis_sessions_current_round_check CASCADE;

ALTER TABLE video_analysis_sessions
DROP CONSTRAINT IF EXISTS video_analysis_sessions_status_check CASCADE;

-- 2. 重新添加正确的 status 约束
ALTER TABLE video_analysis_sessions
ADD CONSTRAINT video_analysis_sessions_status_check CHECK (
  status IN ('pending', 'analyzing', 'completed', 'failed')
);

-- 3. 确保所有必需的列都存在且可为空（除了明确需要 NOT NULL 的）
-- video_duration 应该可以为 NULL
ALTER TABLE video_analysis_sessions
ALTER COLUMN video_duration DROP NOT NULL;

-- 4. 添加注释说明
COMMENT ON CONSTRAINT video_analysis_sessions_status_check ON video_analysis_sessions
IS '状态约束：只允许 pending, analyzing, completed, failed';
