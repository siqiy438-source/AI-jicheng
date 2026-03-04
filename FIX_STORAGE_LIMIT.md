# 修复 Supabase Storage 大小限制问题

## 问题
视频上传时出现 "The object exceeded the maximum allowed size" 错误。

## 根本原因
Supabase Storage bucket 的 `file_size_limit` 配置可能没有正确更新到 500MB。

## 解决方案

### 方法 1: 通过 Supabase 仪表板 SQL 编辑器（推荐）

1. 打开 Supabase 仪表板: https://supabase.com/dashboard/project/kzdjqqinkonqlclbwleh
2. 进入 SQL Editor
3. 执行以下 SQL:

```sql
-- 查看当前配置
SELECT id, name, file_size_limit, file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id = 'user-uploads';

-- 更新为 500MB
UPDATE storage.buckets
SET file_size_limit = 524288000
WHERE id = 'user-uploads';

-- 验证更新
SELECT id, name, file_size_limit, file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id = 'user-uploads';
```

### 方法 2: 通过 Storage 设置页面

1. 打开 Supabase 仪表板
2. 进入 Storage → Buckets
3. 找到 `user-uploads` bucket
4. 点击设置图标
5. 将 "File size limit" 更新为 `524288000` (500MB)
6. 保存

### 方法 3: 删除并重新创建 bucket（最后手段）

如果上述方法都不行，可以：

1. 备份现有数据（如果有）
2. 删除 `user-uploads` bucket
3. 重新运行迁移: `supabase db push`

## 验证

更新后，在 SQL Editor 中运行：

```sql
SELECT id, name, file_size_limit, file_size_limit / 1024 / 1024 as size_mb
FROM storage.buckets
WHERE id = 'user-uploads';
```

应该看到 `size_mb` 列显示 `500`。

## 额外检查

如果问题仍然存在，可能是 Supabase 免费套餐的限制。检查：

1. 项目设置 → Billing → 查看当前套餐限制
2. Storage 使用量是否接近配额上限
