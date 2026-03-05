import { useState, useCallback, useEffect, useRef } from 'react'
import { VideoAnalysisSession, analyzeVideo, getSessionStatus } from '../lib/video-analysis'
import { useAuth } from '../contexts/AuthContext'

export function useVideoAnalysis() {
  const { user } = useAuth()
  const [session, setSession] = useState<VideoAnalysisSession | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState<{
    stage: 'compressing' | 'uploading' | 'analyzing' | 'completed'
    percentage: number
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 轮询获取会话状态
  const startPolling = useCallback((sessionId: string) => {
    // 清除之前的轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // 每 3 秒轮询一次
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const updatedSession = await getSessionStatus(sessionId)
        setSession(updatedSession)

        // 根据状态更新进度
        if (updatedSession.status === 'analyzing') {
          setProgress({
            stage: 'analyzing',
            percentage: 50,
            message: '正在分析视频内容，这可能需要几分钟...',
          })
        } else if (updatedSession.status === 'completed') {
          setProgress({
            stage: 'completed',
            percentage: 100,
            message: '分析完成！',
          })
          setIsAnalyzing(false)
          // 停止轮询
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        } else if (updatedSession.status === 'failed') {
          setError('分析失败，积分已退回')
          setIsAnalyzing(false)
          // 停止轮询
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } catch (err) {
        console.error('[use-video-analysis] Polling error:', err)
      }
    }, 3000)
  }, [])

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  /**
   * 开始分析视频（完整流程）
   */
  const startAnalysis = useCallback(async (file: File) => {
    if (!user) {
      setError('请先登录')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      let videoFile = file
      const fileSizeMB = file.size / 1024 / 1024

      // 检查文件大小（最大 50MB）
      if (fileSizeMB > 50) {
        throw new Error(`视频文件不能超过 50MB，当前文件大小: ${fileSizeMB.toFixed(2)}MB。请使用视频编辑软件压缩后再上传。`)
      }

      // 如果文件大于 40MB，建议用户压缩（但仍允许上传）
      if (fileSizeMB > 40) {
        console.warn('[use-video-analysis] 文件较大，可能影响分析速度:', fileSizeMB.toFixed(2) + 'MB')
      }

      setProgress({ stage: 'uploading', percentage: 30, message: '正在上传视频...' })

      // 调用分析函数（立即返回会话，后台处理）
      const result = await analyzeVideo(videoFile, user.id)

      setSession(result)
      setProgress({
        stage: 'analyzing',
        percentage: 40,
        message: '分析已开始，正在后台处理...',
      })

      // 开始轮询获取状态
      startPolling(result.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
      setProgress(null)
      setIsAnalyzing(false)
    }
  }, [user, startPolling])

  /**
   * 刷新会话状态
   */
  const refreshStatus = useCallback(async () => {
    if (!session) return

    try {
      const updatedSession = await getSessionStatus(session.id)
      setSession(updatedSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新状态失败')
    }
  }, [session])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setSession(null)
    setError(null)
    setProgress(null)
    setIsAnalyzing(false)
    // 清除轮询
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  return {
    session,
    isAnalyzing,
    progress,
    error,
    startAnalysis,
    refreshStatus,
    reset,
  }
}
