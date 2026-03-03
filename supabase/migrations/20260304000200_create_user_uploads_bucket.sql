-- 创建 user-uploads storage bucket
-- 用于存储用户上传的视频文件

-- 1. 创建 bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  104857600,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png'];

-- 2. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all files" ON storage.objects;

-- 3. 创建新策略：允许认证用户上传到自己的文件夹
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. 创建新策略：允许认证用户读取自己的文件
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. 创建新策略：允许认证用户删除自己的文件
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. 创建新策略：允许公开读取（因为视频需要被豆包 API 访问）
CREATE POLICY "Public can read all files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');
