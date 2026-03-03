import { supabase, getAccessToken, forceRefreshToken } from './supabase'
import { extractKeyframes, type KeyframeData } from './keyframe-extraction'
import { uploadVideoForAnalysis, type UploadVideoResult } from './video-upload'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// 更新后的接口定义
export interface VideoAnalysisSession {
  id: string
  user_id: string
  video_filename: string
  video_duration: number | null
  video_url: string | null
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  analysis_result: VideoAnalysisResult | null
  report_image_url: string | null
  keyframes: KeyframeData[] | null
  credits_cost: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

// 分析结果结构
export interface VideoAnalysisResult {
  basic_info: {
    duration: number
    scene_count: number
    main_characters: string[]
  }
  topic_analysis: {
    topic_type: string
    pain_point: string
    target_audience: string
    score: number
  }
  script_type: {
    primary_type: '晒过程' | '聊观点' | '教知识' | '讲故事'
    confidence: number
  }
  viral_elements: {
    detected: string[]
    missing: string[]
    highlight_moments: Array<{
      element: string
      timestamp: number
      description: string
    }>
  }
  hook_analysis: {
    first_3_seconds: string
    hook_type: string
    effectiveness_score: number
    suggestions: string[]
  }
  completion_prediction: {
    predicted_rate: number
    pacing_score: number
    info_density_score: number
    emotion_curve: string
  }
  strengths: string[]
  weaknesses: string[]
  optimization_suggestions: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    suggestion: string
  }>
  overall_scores: {
    viral_potential: number
    topic_quality: number
    script_structure: number
    visual_presentation: number
    completion_expectation: number
  }
}

/**
 * 分析视频（完整流程）
 * @param videoFile 视频文件
 * @param userId 用户 ID
 * @returns 分析会话
 */
export async function analyzeVideo(
  videoFile: File,
  userId: string
): Promise<VideoAnalysisSession> {
  // 1. 上传视频
  const uploadResult: UploadVideoResult = await uploadVideoForAnalysis(videoFile, userId)

  // 2. 提取关键帧（减少到 3 个以降低数据大小）
  const keyframes: KeyframeData[] = await extractKeyframes(videoFile, 3)

  // 3. 调用 Edge Function 分析
  let token = await getAccessToken()

  const makeRequest = async (authToken: string) => {
    return fetch(`${SUPABASE_URL}/functions/v1/ai-video-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: 'analyze',
        video_url: uploadResult.url,
        video_path: uploadResult.path,
        video_filename: videoFile.name,
        keyframes: keyframes.map(kf => kf.dataUrl),
        feature_code: 'ai_video_analysis',
      }),
    })
  }

  let response = await makeRequest(token)

  // 如果 401，刷新 token 重试
  if (response.status === 401) {
    token = await forceRefreshToken()
    response = await makeRequest(token)
  }

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '分析失败')
  }

  const data = await response.json()
  return data.session
}

/**
 * 获取会话状态
 * @param sessionId 会话 ID
 * @returns 分析会话
 */
export async function getSessionStatus(
  sessionId: string
): Promise<VideoAnalysisSession> {
  const token = await getAccessToken()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-video-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'get_status',
      session_id: sessionId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '获取状态失败')
  }

  const data = await response.json()
  return data.session
}
