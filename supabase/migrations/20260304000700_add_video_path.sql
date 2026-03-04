-- 添加 video_path 字段用于存储 Supabase Storage 路径
ALTER TABLE video_analysis_sessions
ADD COLUMN IF NOT EXISTS video_path TEXT;
