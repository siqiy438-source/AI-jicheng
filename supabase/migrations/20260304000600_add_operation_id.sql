-- 添加 operation_id 字段用于追踪积分操作
ALTER TABLE video_analysis_sessions
ADD COLUMN IF NOT EXISTS operation_id TEXT;
