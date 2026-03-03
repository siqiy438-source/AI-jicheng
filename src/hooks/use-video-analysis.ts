import { useState, useCallback } from 'react'
import { VideoAnalysisSession, analyzeVideo, getSessionStatus } from '../lib/video-analysis'
import { useAuth } from '../contexts/AuthContext'

export function useVideoAnalysis() {
  const { user } = useAuth()
  const [session, setSession] = useState<VideoAnalysisSession | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState<{
    stage: 'uploading' | 'extracting' | 'analyzing' | 'generating' | 'completed'
    percentage: number
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setProgress({ stage: 'uploading', percentage: 10, message: '正在上传视频...' })

    try {
      // 调用分析函数（内部会处理上传、提取关键帧、分析、生成报告）
      setProgress({ stage: 'extracting', percentage: 30, message: '正在提取关键帧...' })
      
      const result = await analyzeVideo(file, user.id)
      
      setProgress({ stage: 'analyzing', percentage: 60, message: '正在分析视频内容...' })
      setProgress({ stage: 'generating', percentage: 90, message: '正在生成可视化报告...' })
      
      setSession(result)
      setProgress({ stage: 'completed', percentage: 100, message: '分析完成！' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
      setProgress(null)
    } finally {
      setIsAnalyzing(false)
    }
  }, [user])

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
