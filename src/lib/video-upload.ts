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
  // 1. 校验文件大小（最大 100MB）
  const MAX_SIZE = 100 * 1024 * 1024 // 100MB
  if (file.size > MAX_SIZE) {
    throw new Error('视频文件不能超过 100MB')
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
  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`视频上传失败: ${uploadError.message}`)
  }

  // 5. 获取公开 URL
  const { data: { publicUrl } } = supabase.storage
    .from('user-uploads')
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
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
