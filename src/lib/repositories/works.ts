import { supabase } from '@/lib/supabase';

export interface WorkListItem {
  id: string;
  title: string;
  type: string;
  thumbnail: string | null;
  content?: string;
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

const isDataUrl = (value: string) => value.startsWith('data:');
const isHttpUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://');

const formatCreatedAt = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sanitizeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, '_');

const getCurrentUserId = async () => {
  if (!supabase.auth || typeof supabase.auth.getUser !== 'function') {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
};

const uploadWorkPreview = async (userId: string, dataUrl: string) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const path = `${userId}/${yyyy}/${mm}/${crypto.randomUUID()}-${sanitizeFilename('preview.png')}`;

  const { error } = await supabase.storage.from(WORKS_BUCKET).upload(path, blob, {
    upsert: false,
    contentType: blob.type || 'image/png',
  });

  if (error) {
    throw error;
  }

  return {
    bucket: WORKS_BUCKET,
    path,
  };
};

/** 从 URL 下载图片并上传到用户目录（解决 temp/ 路径 RLS 不可访问的问题） */
const downloadAndUpload = async (userId: string, imageUrl: string) => {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  const blob = await resp.blob();
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ext = blob.type.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${yyyy}/${mm}/${crypto.randomUUID()}-preview.${ext}`;

  const { error } = await supabase.storage.from(WORKS_BUCKET).upload(path, blob, {
    upsert: false,
    contentType: blob.type || 'image/png',
  });
  if (error) throw error;

  return { bucket: WORKS_BUCKET, path };
};

const getSignedPreviewUrl = async (bucket: string | null, path: string | null) => {
  if (!bucket || !path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
};

const getSignedPreviewUrlMap = async (rows: Array<{ storage_bucket: string | null; storage_path: string | null }>) => {
  const bucketPathMap = new Map<string, string[]>();

  rows.forEach((row) => {
    if (!row.storage_bucket || !row.storage_path) return;
    const list = bucketPathMap.get(row.storage_bucket) || [];
    list.push(row.storage_path);
    bucketPathMap.set(row.storage_bucket, list);
  });

  const signedMap = new Map<string, string | null>();

  for (const [bucket, paths] of bucketPathMap.entries()) {
    if (paths.length === 0) continue;

    const uniquePaths = [...new Set(paths)];
    const storage = supabase.storage.from(bucket);
    const { data, error } = await storage.createSignedUrls(uniquePaths, 60 * 60);

    if (error) {
      await Promise.all(
        uniquePaths.map(async (path) => {
          const singleUrl = await getSignedPreviewUrl(bucket, path);
          const mapKey = `${bucket}:${path}`;
          signedMap.set(mapKey, singleUrl);
        })
      );
      continue;
    }

    (data || []).forEach((item, index) => {
      const path = uniquePaths[index];
      const mapKey = `${bucket}:${path}`;
      signedMap.set(mapKey, item?.signedUrl || null);
    });
  }

  return (row: { storage_bucket: string | null; storage_path: string | null }) => {
    if (!row.storage_bucket || !row.storage_path) return null;
    const mapKey = `${row.storage_bucket}:${row.storage_path}`;
    return signedMap.get(mapKey) || null;
  };
};

export const listWorks = async (): Promise<WorkListItem[]> => {
  const { data, error } = await supabase
    .from('works')
    .select('id, title, type, tool, content_json, thumbnail_url, created_at, storage_bucket, storage_path')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const getSignedUrlFromMap = await getSignedPreviewUrlMap(rows);
  const mapped = rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    tool: row.tool || 'AI 创作',
    content: typeof row.content_json?.text === 'string' ? row.content_json.text : undefined,
    thumbnail: getSignedUrlFromMap(row) || row.thumbnail_url || null,
    createdAt: formatCreatedAt(row.created_at),
  }));

  return mapped;
};

export const saveWork = async (input: SaveWorkInput) => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  let storageBucket: string | null = null;
  let storagePath: string | null = null;
  let thumbnailUrl: string | null = null;

  if (input.thumbnailDataUrl) {
    if (isDataUrl(input.thumbnailDataUrl)) {
      try {
        const uploaded = await uploadWorkPreview(userId, input.thumbnailDataUrl);
        storageBucket = uploaded.bucket;
        storagePath = uploaded.path;
      } catch (error) {
        // 缩略图上传失败不阻断作品保存，避免作品"消失"
        console.warn('uploadWorkPreview failed, saving work without uploaded thumbnail', error);
      }
    } else if (isHttpUrl(input.thumbnailDataUrl)) {
      // URL（如签名 URL）→ 下载后重新上传到用户目录，确保 RLS 可访问
      try {
        const uploaded = await downloadAndUpload(userId, input.thumbnailDataUrl);
        storageBucket = uploaded.bucket;
        storagePath = uploaded.path;
      } catch (error) {
        console.warn('downloadAndUpload failed, saving URL as fallback', error);
        thumbnailUrl = input.thumbnailDataUrl;
      }
    }
  }

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
    throw error;
  }

  return data;
};

export const updateWork = async (workId: string, input: UpdateWorkInput) => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  let storageBucket: string | null | undefined = undefined;
  let storagePath: string | null | undefined = undefined;
  let thumbnailUrl: string | null | undefined = undefined;

  if (input.thumbnailDataUrl !== undefined) {
    if (input.thumbnailDataUrl && isDataUrl(input.thumbnailDataUrl)) {
      try {
        const uploaded = await uploadWorkPreview(userId, input.thumbnailDataUrl);
        storageBucket = uploaded.bucket;
        storagePath = uploaded.path;
        thumbnailUrl = null;
      } catch (error) {
        console.warn('uploadWorkPreview failed while updating work thumbnail', error);
      }
    } else {
      if (input.thumbnailDataUrl === null) {
        thumbnailUrl = null;
        storageBucket = null;
        storagePath = null;
      } else if (isHttpUrl(input.thumbnailDataUrl)) {
        try {
          const uploaded = await downloadAndUpload(userId, input.thumbnailDataUrl);
          storageBucket = uploaded.bucket;
          storagePath = uploaded.path;
          thumbnailUrl = null;
        } catch (error) {
          console.warn('downloadAndUpload failed in updateWork', error);
          thumbnailUrl = input.thumbnailDataUrl;
        }
      } else {
        thumbnailUrl = input.thumbnailDataUrl;
      }
    }
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) payload.title = input.title;
  if (input.type !== undefined) payload.type = input.type;
  if (input.tool !== undefined) payload.tool = input.tool;
  if (input.content !== undefined) payload.content_json = input.content || null;
  if (storageBucket !== undefined) payload.storage_bucket = storageBucket;
  if (storagePath !== undefined) payload.storage_path = storagePath;
  if (thumbnailUrl !== undefined) payload.thumbnail_url = thumbnailUrl;

  const { data, error } = await supabase
    .from('works')
    .update(payload)
    .eq('id', workId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteWork = async (workId: string) => {
  const { data: workRow, error: fetchError } = await supabase
    .from('works')
    .select('id, storage_bucket, storage_path')
    .eq('id', workId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (workRow?.storage_bucket && workRow.storage_path) {
    await supabase.storage.from(workRow.storage_bucket).remove([workRow.storage_path]);
  }

  const { error } = await supabase.from('works').delete().eq('id', workId);
  if (error) {
    throw error;
  }
};

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
    content: {
      text: params.prompt,
      ...params.metadata,
    },
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
    content: {
      text: params.text,
      ...params.metadata,
    },
  });
};
