import { supabase, getAccessToken, forceRefreshToken, supabaseUrl } from './supabase'
import { uploadVideoForAnalysis, type UploadVideoResult } from './video-upload'

const SUPABASE_URL = supabaseUrl

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
 * 将视频上传到阿里云 OSS
 */
async function uploadToOSS(supabasePath: string): Promise<string> {
  const token = await getAccessToken()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-to-oss`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      supabase_path: supabasePath,
    }),
  })

  if (!response.ok) {
    let error: any = {}
    try {
      const responseText = await response.text()
      console.error('[video-analysis] OSS upload error response:', responseText)
      if (responseText) {
        error = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('[video-analysis] Failed to parse OSS error response:', parseError)
    }
    throw new Error(error.error || `上传到 OSS 失败 (${response.status}): ${response.statusText}`)
  }

  const data = await response.json()
  return data.oss_url
}

/**
 * 创建分析会话（立即返回，不等待分析完成）
 * @param videoFile 视频文件
 * @param userId 用户 ID
 * @returns 分析会话
 */
export async function createAnalysisSession(
  videoFile: File,
  userId: string
): Promise<VideoAnalysisSession> {
  // 1. 上传视频到 Supabase Storage
  const uploadResult: UploadVideoResult = await uploadVideoForAnalysis(videoFile, userId)

  // 2. 临时方案：直接使用 Supabase Storage URL，跳过 OSS 上传
  // 原因：大文件上传到 OSS 容易超时
  console.log('[video-analysis] Using Supabase Storage URL directly (skipping OSS)')
  const videoUrl = uploadResult.url

  // 3. 创建会话（使用 Supabase Storage URL）
  let token = await getAccessToken()

  const makeRequest = async (authToken: string) => {
    return fetch(`${SUPABASE_URL}/functions/v1/ai-video-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        action: 'create_session',
        video_url: videoUrl, // 使用 Supabase Storage URL
        video_path: uploadResult.path,
        video_filename: videoFile.name,
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
    let error: any = {}
    try {
      const responseText = await response.text()
      console.log('[video-analysis] Error response text:', responseText)
      if (responseText) {
        error = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('[video-analysis] Failed to parse error response:', parseError)
    }
    console.error('[video-analysis] Create session error:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
    })
    throw new Error(error.error || `创建会话失败 (${response.status}): ${response.statusText}`)
  }

  const data = await response.json()
  return data.session
}

/**
 * 触发后台分析（不等待响应）
 * @param sessionId 会话 ID
 */
export async function triggerBackgroundAnalysis(sessionId: string): Promise<void> {
  const token = await getAccessToken()

  // 触发后台分析，不等待响应
  fetch(`${SUPABASE_URL}/functions/v1/ai-video-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'process_analysis',
      session_id: sessionId,
    }),
  }).catch(error => {
    // 忽略错误，因为这是后台处理
    console.log('[video-analysis] Background analysis triggered (may timeout, but will continue in background)')
  })
}

/**
 * 分析视频（完整流程 - 已废弃，使用 createAnalysisSession + triggerBackgroundAnalysis）
 * @param videoFile 视频文件
 * @param userId 用户 ID
 * @returns 分析会话
 */
export async function analyzeVideo(
  videoFile: File,
  userId: string
): Promise<VideoAnalysisSession> {
  // 使用新的异步处理流程
  const session = await createAnalysisSession(videoFile, userId)
  await triggerBackgroundAnalysis(session.id)
  return session
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
    let error: any = {}
    try {
      const responseText = await response.text()
      console.log('[video-analysis] Get status error response text:', responseText)
      if (responseText) {
        error = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('[video-analysis] Failed to parse error response:', parseError)
    }
    throw new Error(error.error || `获取状态失败 (${response.status}): ${response.statusText}`)
  }

  const data = await response.json()
  return data.session
}
