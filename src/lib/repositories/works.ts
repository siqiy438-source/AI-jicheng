import { supabase, getAccessToken } from '@/lib/supabase';

export interface WorkListItem {
  id: string;
  title: string;
  type: string;
  thumbnail: string | null;
  preview: string | null;
  original: string | null;
  content?: string;
  contentJson?: Record<string, unknown>;
  createdAt: string;
  tool: string;
}

interface SaveWorkInput {
  title: string;
  type: string;
  tool: string;
  content?: Record<string, unknown>;
  thumbnailDataUrl?: string | null;
}

interface UpdateWorkInput {
  title?: string;
  type?: string;
  tool?: string;
  content?: Record<string, unknown>;
  thumbnailDataUrl?: string | null;
}

const WORKS_BUCKET = 'works-assets';
const HISTORY_THUMBNAIL_WIDTH = 480;
const HISTORY_THUMBNAIL_HEIGHT = 360;
const HISTORY_THUMBNAIL_QUALITY = 72;
const HISTORY_PREVIEW_WIDTH = 1440;
const HISTORY_PREVIEW_HEIGHT = 1440;
const HISTORY_PREVIEW_QUALITY = 45;

const isDataUrl = (value: string) => value.startsWith('data:');

const formatCreatedAt = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sanitizeFilename = (filename: string) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_');

const getCurrentUserId = async () => {
  // 先确保 session 是最新的（处理 token 过期刷新）
  await getAccessToken();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
};

/** 获取 Storage 文件的公开 URL（bucket 已设为 public） */
const getPublicUrl = (
  bucket: string,
  path: string,
  transform?: {
    width?: number;
    height?: number;
    resize?: 'cover' | 'contain' | 'fill';
    quality?: number;
    format?: 'origin';
  },
): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, transform ? { transform } : undefined);
  return data.publicUrl;
};

const buildHistoryStorageThumbnailUrl = (bucket: string, path: string): string => {
  return getPublicUrl(bucket, path, {
    width: HISTORY_THUMBNAIL_WIDTH,
    height: HISTORY_THUMBNAIL_HEIGHT,
    resize: 'cover',
    quality: HISTORY_THUMBNAIL_QUALITY,
    format: 'origin',
  });
};

const buildHistoryStoragePreviewUrl = (bucket: string, path: string): string => {
  return getPublicUrl(bucket, path, {
    width: HISTORY_PREVIEW_WIDTH,
    height: HISTORY_PREVIEW_HEIGHT,
    resize: 'contain',
    quality: HISTORY_PREVIEW_QUALITY,
    format: 'origin',
  });
};

const resolveWorkImageUrls = (row: {
  storage_bucket: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
}) => {
  let original: string | null = null;
  let preview: string | null = null;
  let thumbnail: string | null = null;

  if (row.storage_bucket && row.storage_path) {
    original = getPublicUrl(row.storage_bucket, row.storage_path);
    preview = buildHistoryStoragePreviewUrl(row.storage_bucket, row.storage_path);
    thumbnail = buildHistoryStorageThumbnailUrl(row.storage_bucket, row.storage_path);
  }

  if (!original && row.thumbnail_url) {
    const path = extractPathFromSignedUrl(row.thumbnail_url);
    if (path) {
      original = getPublicUrl(WORKS_BUCKET, path);
      preview = buildHistoryStoragePreviewUrl(WORKS_BUCKET, path);
      thumbnail = buildHistoryStorageThumbnailUrl(WORKS_BUCKET, path);
    } else {
      original = row.thumbnail_url;
      preview = row.thumbnail_url;
      thumbnail = row.thumbnail_url;
    }
  }

  return { original, preview, thumbnail };
};

/** 从签名 URL 中提取 storage path（兼容旧数据） */
const extractPathFromSignedUrl = (url: string): string | null => {
  try {
    const m = new URL(url).pathname.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
    return m ? m[2] : null;
  } catch { return null; }
};

/** 上传 data URL 到用户目录 */
const uploadBlob = async (userId: string, blob: Blob) => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ext = blob.type.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${yyyy}/${mm}/${crypto.randomUUID()}-${sanitizeFilename(`preview.${ext}`)}`;

  const { error } = await supabase.storage.from(WORKS_BUCKET).upload(path, blob, {
    upsert: false,
    contentType: blob.type || 'image/png',
  });
  if (error) throw error;
  return { bucket: WORKS_BUCKET, path };
};

/** 解析图片输入，返回 storage bucket/path */
const resolveImage = async (userId: string, imageInput: string): Promise<{ bucket: string; path: string } | null> => {
  // data URL → 上传到用户目录
  if (isDataUrl(imageInput)) {
    const resp = await fetch(imageInput);
    const blob = await resp.blob();
    return uploadBlob(userId, blob);
  }
  // 签名 URL → 提取 path（bucket 已公开，无需重新上传）
  const storagePath = extractPathFromSignedUrl(imageInput);
  if (storagePath) {
    return { bucket: WORKS_BUCKET, path: storagePath };
  }
  // 普通 HTTPS URL → 下载后上传到用户目录
  if (imageInput.startsWith('http')) {
    const resp = await fetch(imageInput);
    if (resp.ok) {
      const blob = await resp.blob();
      return uploadBlob(userId, blob);
    }
  }
  return null;
};

// ==================== 列表 ====================

export const WORKS_PAGE_SIZE = 20;

export const listWorks = async (
  offset = 0,
  pageSize = WORKS_PAGE_SIZE,
): Promise<{ items: WorkListItem[]; hasMore: boolean }> => {
  const userId = await getCurrentUserId();
  if (!userId) return { items: [], hasMore: false };

  const { data, error } = await supabase
    .from('works')
    .select('id, title, type, tool, thumbnail_url, created_at, storage_bucket, storage_path, content_text:content_json->>text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize); // 多取 1 条用于判断 hasMore

  if (error) throw error;

  const items = (data ?? []).map((row) => {
    const { original, preview, thumbnail } = resolveWorkImageUrls(row);

    return {
      id: row.id,
      title: row.title || '未命名作品',
      type: row.type,
      tool: row.tool || 'AI 创作',
      content: typeof row.content_text === 'string' ? row.content_text : undefined,
      thumbnail,
      preview,
      original,
      createdAt: formatCreatedAt(row.created_at),
    };
  });

  const hasMore = items.length > pageSize;
  return { items: hasMore ? items.slice(0, pageSize) : items, hasMore };
};

export const getWorkDetail = async (workId: string): Promise<WorkListItem | null> => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('works')
    .select('id, title, type, tool, content_json, thumbnail_url, created_at, storage_bucket, storage_path')
    .eq('id', workId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { original, preview, thumbnail } = resolveWorkImageUrls(data);

  return {
    id: data.id,
    title: data.title || '未命名作品',
    type: data.type,
    tool: data.tool || 'AI 创作',
    content: typeof data.content_json?.text === 'string' ? data.content_json.text : undefined,
    contentJson: data.content_json ?? undefined,
    thumbnail,
    preview,
    original,
    createdAt: formatCreatedAt(data.created_at),
  };
};

// ==================== 保存 ====================

export const saveWork = async (input: SaveWorkInput) => {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('[works] saveWork 失败: 用户未登录 (userId=null)');
    return null;
  }

  let storageBucket: string | null = null;
  let storagePath: string | null = null;
  let thumbnailUrl: string | null = null;

  if (input.thumbnailDataUrl) {
    try {
      const result = await resolveImage(userId, input.thumbnailDataUrl);
      if (result) {
        storageBucket = result.bucket;
        storagePath = result.path;
      } else {
        // resolveImage 返回 null，直接把原始 URL 存到 thumbnail_url 兜底
        thumbnailUrl = input.thumbnailDataUrl;
      }
    } catch (error) {
      console.warn('[works] resolveImage failed, saving thumbnail_url as fallback', error);
      thumbnailUrl = input.thumbnailDataUrl;
    }
  }

  console.log('[works] saveWork inserting:', { userId, title: input.title, storageBucket, storagePath, hasThumbnailUrl: !!thumbnailUrl });

  const { data, error } = await supabase
    .from('works')
    .insert({
      user_id: userId,
      title: input.title,
      type: input.type,
      tool: input.tool,
      content_json: input.content || null,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      thumbnail_url: thumbnailUrl,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[works] saveWork insert 失败:', error);
    throw error;
  }
  console.log('[works] saveWork 成功:', data.id);
  return data;
};

// ==================== 更新 ====================

export const updateWork = async (workId: string, input: UpdateWorkInput) => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.title !== undefined) payload.title = input.title;
  if (input.type !== undefined) payload.type = input.type;
  if (input.tool !== undefined) payload.tool = input.tool;
  if (input.content !== undefined) payload.content_json = input.content || null;

  if (input.thumbnailDataUrl !== undefined) {
    if (input.thumbnailDataUrl === null) {
      payload.storage_bucket = null;
      payload.storage_path = null;
      payload.thumbnail_url = null;
    } else {
      try {
        const result = await resolveImage(userId, input.thumbnailDataUrl);
        if (result) {
          payload.storage_bucket = result.bucket;
          payload.storage_path = result.path;
          payload.thumbnail_url = null;
        }
      } catch (error) {
        console.warn('resolveImage failed in updateWork', error);
        payload.thumbnail_url = input.thumbnailDataUrl;
      }
    }
  }

  const { data, error } = await supabase
    .from('works')
    .update(payload)
    .eq('id', workId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) throw error;
  return data;
};

// ==================== 删除 ====================

export const deleteWork = async (workId: string) => {
  const { data: workRow, error: fetchError } = await supabase
    .from('works')
    .select('id, storage_bucket, storage_path')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (workRow?.storage_bucket && workRow.storage_path) {
    await supabase.storage.from(workRow.storage_bucket).remove([workRow.storage_path]);
  }

  const { error } = await supabase.from('works').delete().eq('id', workId);
  if (error) throw error;
};

// ==================== 便捷方法 ====================

export const saveGeneratedImageWork = async (params: {
  title: string;
  type: string;
  tool: string;
  prompt: string;
  imageDataUrl: string;
  metadata?: Record<string, unknown>;
}) => {
  return saveWork({
    title: params.title,
    type: params.type,
    tool: params.tool,
    thumbnailDataUrl: params.imageDataUrl,
    content: { text: params.prompt, ...params.metadata },
  });
};

export const saveTextWork = async (params: {
  title: string;
  type: string;
  tool: string;
  text: string;
  metadata?: Record<string, unknown>;
}) => {
  return saveWork({
    title: params.title,
    type: params.type,
    tool: params.tool,
    content: { text: params.text, ...params.metadata },
  });
};
