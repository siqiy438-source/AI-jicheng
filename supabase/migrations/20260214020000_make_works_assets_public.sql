-- 将 works-assets bucket 改为公开读取
-- AI 生成的图片不是敏感数据，公开读取可以彻底避免签名 URL 过期问题
update storage.buckets
set public = true
where id = 'works-assets';
