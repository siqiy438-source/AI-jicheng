-- 允许已登录用户读取 temp/ 目录下的文件
-- 兼容旧数据：Edge Function 上传到 temp/ 的图片需要客户端能生成签名 URL
drop policy if exists works_assets_select_temp on storage.objects;
create policy works_assets_select_temp
on storage.objects
for select
to authenticated
using (bucket_id = 'works-assets' and name like 'temp/%');
