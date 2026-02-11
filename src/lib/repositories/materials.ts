import { supabase } from '@/lib/supabase';

export interface MaterialListItem {
  id: string;
  name: string;
  type: string;
  thumbnail: string | null;
  size: string;
  uploadedAt: string;
  folder: string | null;
  storageBucket: string;
  storagePath: string;
}

export interface MaterialFolderItem {
  id: string;
  name: string;
  count: number;
}

const MATERIALS_BUCKET = 'materials-assets';

const formatUploadedAt = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const digits = value >= 100 || index === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[index]}`;
};

const sanitizeFilename = (filename: string) => filename.replace(/[^a-zA-Z0-9._-]/g, '_');

const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
};

const getFileType = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
};

const getSignedUrl = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
};

const getSignedUrlMapByBucket = async (
  rows: Array<{ storage_bucket: string | null; storage_path: string; file_type: string; preview_url: string | null }>
) => {
  const bucketPathMap = new Map<string, string[]>();

  rows.forEach((row) => {
    if (row.file_type !== 'image') return;
    const bucket = row.storage_bucket || MATERIALS_BUCKET;
    const list = bucketPathMap.get(bucket) || [];
    list.push(row.storage_path);
    bucketPathMap.set(bucket, list);
  });

  const signedMap = new Map<string, string | null>();

  for (const [bucket, paths] of bucketPathMap.entries()) {
    const uniquePaths = [...new Set(paths)];
    if (uniquePaths.length === 0) continue;

    const storage = supabase.storage.from(bucket);
    const { data, error } = await storage.createSignedUrls(uniquePaths, 60 * 60);

    if (error) {
      await Promise.all(
        uniquePaths.map(async (path) => {
          const singleUrl = await getSignedUrl(bucket, path);
          signedMap.set(`${bucket}:${path}`, singleUrl);
        })
      );
      continue;
    }

    (data || []).forEach((item, index) => {
      const path = uniquePaths[index];
      signedMap.set(`${bucket}:${path}`, item?.signedUrl || null);
    });
  }

  return (bucket: string, path: string) => signedMap.get(`${bucket}:${path}`) || null;
};

export const listMaterials = async (): Promise<MaterialListItem[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, file_type, size_bytes, folder_name, created_at, storage_bucket, storage_path, mime_type, preview_url')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const getSignedUrlFromMap = await getSignedUrlMapByBucket(rows);
  const mapped = rows.map((row) => {
    const bucket = row.storage_bucket || MATERIALS_BUCKET;
    const thumbnail = row.file_type === 'image'
      ? getSignedUrlFromMap(bucket, row.storage_path)
      : row.preview_url || null;

    return {
      id: row.id,
      name: row.name,
      type: row.file_type,
      thumbnail,
      size: formatBytes(row.size_bytes || 0),
      uploadedAt: formatUploadedAt(row.created_at),
      folder: row.folder_name || null,
      storageBucket: bucket,
      storagePath: row.storage_path,
    };
  });

  return mapped;
};

export const listMaterialFolders = async (): Promise<MaterialFolderItem[]> => {
  const { data: folders, error: folderError } = await supabase
    .from('material_folders')
    .select('id, name')
    .order('created_at', { ascending: true });

  if (folderError) {
    throw folderError;
  }

  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select('folder_name')
    .not('folder_name', 'is', null);

  if (materialsError) {
    throw materialsError;
  }

  const countMap = new Map<string, number>();
  (materials ?? []).forEach((row) => {
    const folderName = row.folder_name as string;
    countMap.set(folderName, (countMap.get(folderName) || 0) + 1);
  });

  return (folders ?? []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    count: countMap.get(folder.name) || 0,
  }));
};

export const createMaterialFolder = async (name: string) => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const normalizedName = name.trim();
  if (!normalizedName) return null;

  const { data, error } = await supabase
    .from('material_folders')
    .insert({
      user_id: userId,
      name: normalizedName,
    })
    .select('id, name')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const uploadMaterials = async (files: FileList | File[], folderName?: string | null) => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const list = Array.from(files);
  const folder = folderName ? folderName.trim() : null;
  const insertedIds: string[] = [];

  for (const file of list) {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const path = `${userId}/${yyyy}/${mm}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage.from(MATERIALS_BUCKET).upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data, error } = await supabase
      .from('materials')
      .insert({
        user_id: userId,
        name: file.name,
        file_type: getFileType(file.type),
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        folder_name: folder,
        storage_bucket: MATERIALS_BUCKET,
        storage_path: path,
      })
      .select('id')
      .single();

    if (error) {
      await supabase.storage.from(MATERIALS_BUCKET).remove([path]);
      throw error;
    }

    insertedIds.push(data.id);
  }

  return insertedIds;
};

export const deleteMaterial = async (materialId: string) => {
  const { data: materialRow, error: fetchError } = await supabase
    .from('materials')
    .select('id, storage_bucket, storage_path')
    .eq('id', materialId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (materialRow?.storage_bucket && materialRow.storage_path) {
    await supabase.storage.from(materialRow.storage_bucket).remove([materialRow.storage_path]);
  }

  const { error } = await supabase.from('materials').delete().eq('id', materialId);
  if (error) {
    throw error;
  }
};

export const getMaterialDownloadUrl = async (bucket: string, path: string) => {
  if (!bucket || !path) return null;
  return getSignedUrl(bucket, path);
};
