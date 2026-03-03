-- 更新 video_analysis_sessions 表结构
-- 从多轮分析模式改为单次综合分析模式

-- 1. 添加新字段
ALTER TABLE video_analysis_sessions
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS analysis_result JSONB,
ADD COLUMN IF NOT EXISTS report_image_url TEXT,
ADD COLUMN IF NOT EXISTS keyframes JSONB,
ADD COLUMN IF NOT EXISTS credits_cost INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 2. 删除不再需要的字段
ALTER TABLE video_analysis_sessions
DROP COLUMN IF EXISTS current_round,
DROP COLUMN IF EXISTS total_rounds;

-- 3. 删除 video_analysis_rounds 表（不再需要多轮分析）
DROP TABLE IF EXISTS video_analysis_rounds;

-- 4. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_user_id
ON video_analysis_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_status
ON video_analysis_sessions(status);

CREATE INDEX IF NOT EXISTS idx_video_analysis_sessions_created_at
ON video_analysis_sessions(created_at DESC);

-- 5. 添加注释
COMMENT ON COLUMN video_analysis_sessions.video_url IS '视频 URL（临时，分析后删除）';
COMMENT ON COLUMN video_analysis_sessions.analysis_result IS '完整分析结果（JSONB 格式）';
COMMENT ON COLUMN video_analysis_sessions.report_image_url IS '生成的报告图片 URL';
COMMENT ON COLUMN video_analysis_sessions.keyframes IS '关键帧信息数组 [{timestamp, data_url}]';
COMMENT ON COLUMN video_analysis_sessions.credits_cost IS '积分消耗（固定 200）';
