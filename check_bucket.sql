-- 查询当前存储桶配置
SELECT id, name, file_size_limit, file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id = 'user-uploads';

-- 强制更新存储桶大小限制为 500MB
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'user-uploads';

-- 再次查询确认
SELECT id, name, file_size_limit, file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id = 'user-uploads';
