-- 移除 keyframes 字段（不再需要）
-- 该字段从未被使用，只是浪费存储空间和网络带宽

ALTER TABLE video_analysis_sessions
DROP COLUMN IF EXISTS keyframes;
