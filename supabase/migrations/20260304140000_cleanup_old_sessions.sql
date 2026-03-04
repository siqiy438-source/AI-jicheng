-- 清理可能导致约束错误的旧会话数据
-- 这个迁移会删除所有旧的、可能不符合新表结构的会话记录

-- 1. 删除所有状态不在允许列表中的会话
DELETE FROM video_analysis_sessions
WHERE status NOT IN ('pending', 'analyzing', 'completed', 'failed');

-- 2. 删除所有超过7天的失败或已完成的会话（清理旧数据）
DELETE FROM video_analysis_sessions
WHERE status IN ('completed', 'failed')
AND created_at < NOW() - INTERVAL '7 days';

-- 3. 确保所有必需字段都有值
-- 如果video_url为NULL，设置为空字符串
UPDATE video_analysis_sessions
SET video_url = ''
WHERE video_url IS NULL;

-- 如果video_path为NULL，设置为空字符串
UPDATE video_analysis_sessions
SET video_path = ''
WHERE video_path IS NULL;

-- 4. 添加注释
COMMENT ON TABLE video_analysis_sessions IS '视频分析会话表 - 已清理旧数据和约束';
