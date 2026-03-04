import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null
let isLoading = false

/**
 * 获取或初始化 FFmpeg 实例（带超时）
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance
  }

  if (isLoading) {
    // 等待加载完成（最多 30 秒）
    const startTime = Date.now()
    while (isLoading) {
      if (Date.now() - startTime > 30000) {
        throw new Error('FFmpeg 加载超时，请检查网络连接')
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return ffmpegInstance!
  }

  isLoading = true
  ffmpegInstance = new FFmpeg()

  try {
    console.log('[video-compressor] 开始加载 FFmpeg...')

    // 使用 jsdelivr CDN（国内访问更快）
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd'

    // 添加超时控制
    const loadPromise = ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    // 30 秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FFmpeg 加载超时（30秒），请检查网络连接或使用更小的视频文件')), 30000)
    })

    await Promise.race([loadPromise, timeoutPromise])
    console.log('[video-compressor] FFmpeg 加载成功')
  } catch (error) {
    console.error('[video-compressor] FFmpeg 加载失败:', error)
    ffmpegInstance = null
    throw error
  } finally {
    isLoading = false
  }

  return ffmpegInstance
}

export interface CompressionProgress {
  phase: 'loading' | 'compressing' | 'done'
  percentage: number
  message: string
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

/**
 * 压缩视频文件
 * @param file 原始视频文件
 * @param targetSizeMB 目标大小（MB），默认 45MB（留 5MB 余量）
 * @param onProgress 进度回调
 * @returns 压缩后的文件
 */
export async function compressVideo(
  file: File,
  targetSizeMB: number = 45,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const originalSize = file.size
  const originalSizeMB = originalSize / 1024 / 1024

  console.log('[video-compressor] 开始压缩:', {
    fileName: file.name,
    originalSizeMB: originalSizeMB.toFixed(2),
    targetSizeMB,
  })

  // 如果文件已经小于目标大小，直接返回
  if (originalSizeMB <= targetSizeMB) {
    console.log('[video-compressor] 文件已小于目标大小，跳过压缩')
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    }
  }

  onProgress?.({
    phase: 'loading',
    percentage: 0,
    message: '正在加载压缩工具...',
  })

  // 加载 FFmpeg
  const ffmpeg = await getFFmpeg()

  onProgress?.({
    phase: 'loading',
    percentage: 20,
    message: '压缩工具加载完成',
  })

  // 监听 FFmpeg 进度
  ffmpeg.on('progress', ({ progress }) => {
    const percentage = Math.min(Math.round(progress * 100), 99)
    onProgress?.({
      phase: 'compressing',
      percentage: 20 + percentage * 0.75, // 20-95%
      message: `正在压缩视频... ${percentage}%`,
    })
  })

  try {
    // 写入输入文件
    const inputFileName = 'input.mp4'
    const outputFileName = 'output.mp4'
    await ffmpeg.writeFile(inputFileName, await fetchFile(file))

    onProgress?.({
      phase: 'compressing',
      percentage: 25,
      message: '开始压缩...',
    })

    // 计算目标比特率
    // 假设视频时长，通过文件大小估算
    // 使用两遍编码以获得更好的质量
    const compressionRatio = targetSizeMB / originalSizeMB
    const targetBitrate = Math.floor(compressionRatio * 8000) // 估算比特率 (kbps)

    console.log('[video-compressor] 压缩参数:', {
      compressionRatio: compressionRatio.toFixed(2),
      targetBitrate: `${targetBitrate}k`,
    })

    // FFmpeg 压缩命令
    // -c:v libx264: 使用 H.264 编码
    // -b:v: 视频比特率
    // -maxrate: 最大比特率
    // -bufsize: 缓冲区大小
    // -c:a aac: 音频编码
    // -b:a 128k: 音频比特率
    // -movflags +faststart: 优化网络播放
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '28', // 质量参数，越大压缩率越高（18-28 是合理范围）
      '-b:v', `${targetBitrate}k`,
      '-maxrate', `${targetBitrate * 1.5}k`,
      '-bufsize', `${targetBitrate * 2}k`,
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      '-y',
      outputFileName,
    ])

    onProgress?.({
      phase: 'compressing',
      percentage: 95,
      message: '压缩完成，正在生成文件...',
    })

    // 读取输出文件
    const data = await ffmpeg.readFile(outputFileName)
    const compressedBlob = new Blob([data], { type: 'video/mp4' })
    const compressedSize = compressedBlob.size
    const compressedSizeMB = compressedSize / 1024 / 1024

    // 创建新的 File 对象
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '_compressed.mp4'),
      { type: 'video/mp4' }
    )

    // 清理文件
    await ffmpeg.deleteFile(inputFileName)
    await ffmpeg.deleteFile(outputFileName)

    const actualCompressionRatio = compressedSize / originalSize

    console.log('[video-compressor] 压缩完成:', {
      originalSizeMB: originalSizeMB.toFixed(2),
      compressedSizeMB: compressedSizeMB.toFixed(2),
      compressionRatio: (actualCompressionRatio * 100).toFixed(1) + '%',
    })

    onProgress?.({
      phase: 'done',
      percentage: 100,
      message: `压缩完成！从 ${originalSizeMB.toFixed(1)}MB 压缩到 ${compressedSizeMB.toFixed(1)}MB`,
    })

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: actualCompressionRatio,
    }
  } catch (error) {
    console.error('[video-compressor] 压缩失败:', error)
    throw new Error(`视频压缩失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 卸载 FFmpeg 实例（释放内存）
 */
export function unloadFFmpeg() {
  if (ffmpegInstance) {
    ffmpegInstance.terminate()
    ffmpegInstance = null
    console.log('[video-compressor] FFmpeg 已卸载')
  }
}
