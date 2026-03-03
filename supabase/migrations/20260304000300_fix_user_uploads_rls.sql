-- 修复 user-uploads bucket 的 RLS 策略
-- 文件路径格式：video-analysis/[userId]/[filename]
-- 所以应该检查 (storage.foldername(name))[2] 而不是 [1]

-- 1. 删除旧策略
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all files" ON storage.objects;

-- 2. 创建新策略：允许认证用户上传
CREATE POLICY "Users can upload to user-uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
);

-- 3. 创建新策略：允许认证用户读取
CREATE POLICY "Users can read from user-uploads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads'
);

-- 4. 创建新策略：允许认证用户删除
CREATE POLICY "Users can delete from user-uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads'
);

-- 5. 创建新策略：允许公开读取（因为视频需要被豆包 API 访问）
CREATE POLICY "Public can read from user-uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');
