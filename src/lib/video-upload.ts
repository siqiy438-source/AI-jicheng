import { supabase } from './supabase'

export interface UploadVideoResult {
  url: string
  path: string
}

/**
 * 上传视频文件到 Supabase Storage
 * @param file 视频文件
 * @param userId 用户 ID
 * @returns 视频的公开 URL 和存储路径
 */
export async function uploadVideoForAnalysis(
  file: File,
  userId: string
): Promise<UploadVideoResult> {
  // 1. 校验文件大小（最大 100MB - 超过 50MB 会在上传前自动压缩）
  const MAX_SIZE = 100 * 1024 * 1024 // 100MB

  // 详细日志：记录文件信息
  console.log('[video-upload] 文件信息:', {
    name: file.name,
    size: file.size,
    sizeInMB: (file.size / 1024 / 1024).toFixed(2),
    type: file.type,
    maxSizeInMB: (MAX_SIZE / 1024 / 1024).toFixed(2),
  })

  if (file.size > MAX_SIZE) {
    throw new Error(`视频文件不能超过 100MB，当前文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
  }

  // 2. 校验文件格式
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('只支持 MP4、MOV 格式的视频文件')
  }

  // 3. 生成唯一文件路径
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileExt = file.name.split('.').pop() || 'mp4'
  const filePath = `video-analysis/${userId}/${timestamp}-${randomStr}.${fileExt}`

  // 4. 上传到 Supabase Storage
  console.log('[video-upload] 开始上传到 Supabase Storage:', filePath)

  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('[video-upload] 上传失败:', {
      error: uploadError,
      message: uploadError.message,
      statusCode: uploadError.statusCode,
    })
    throw new Error(`视频上传失败: ${uploadError.message}`)
  }

  console.log('[video-upload] 上传成功:', filePath)

  // 5. 获取签名 URL（有效期 1 小时，供豆包 API 访问）
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('user-uploads')
    .createSignedUrl(filePath, 3600) // 1 小时有效期

  if (signedUrlError || !signedUrlData) {
    console.error('[video-upload] Failed to create signed URL:', signedUrlError)
    // 如果签名 URL 失败，使用公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
    }
  }

  console.log('[video-upload] Created signed URL with 1 hour expiry')

  return {
    url: signedUrlData.signedUrl,
    path: filePath,
  }
}

/**
 * 删除视频文件
 * @param path 视频存储路径
 */
export async function deleteVideo(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('user-uploads')
    .remove([path])

  if (error) {
    console.error('删除视频失败:', error)
    // 不抛出错误，因为删除失败不应该影响主流程
  }
}

/**
 * 获取视频时长（通过创建 video 元素）
 * @param file 视频文件
 * @returns 视频时长（秒）
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(Math.round(video.duration))
    }

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src)
      reject(new Error('无法读取视频信息'))
    }

    video.src = URL.createObjectURL(file)
  })
}
