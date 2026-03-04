-- 增加 user-uploads bucket 的大小限制到 500MB
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'user-uploads';
