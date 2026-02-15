/**
 * ZenMux AI 服务 - 通过 Supabase Edge Function 调用
 * API Key 安全存储在 Supabase Secrets 中
 */

import { supabaseUrl, getAccessToken, forceRefreshToken } from './supabase';

// 消息类型
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 流式响应回调
export interface StreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

// Supabase Edge Function URL
const getEdgeFunctionUrl = () => {
  return `${supabaseUrl}/functions/v1/ai-chat`;
};

/**
 * 流式聊天请求（通过 Supabase Edge Function）
 */
export async function chatStream(
  prompt: string,
  agentId: string,
  callbacks: StreamCallbacks,
  history: ChatMessage[] = [],
  featureCode?: string,
): Promise<void> {
  callbacks.onStart?.();

  try {
    // 获取当前用户的 access_token（用于认证）
    const token = await getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 如果用户已登录，添加认证头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        agentId,
        history,
        stream: true,
        feature_code: featureCode,
      }),
    });

    if (!response.ok) {
      // 401 时强制刷新 token 重试一次
      if (response.status === 401 && token) {
        const newToken = await forceRefreshToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(getEdgeFunctionUrl(), {
            method: 'POST',
            headers,
            body: JSON.stringify({
              prompt,
              agentId,
              history,
              stream: true,
              feature_code: featureCode,
            }),
          });
          if (retryResponse.ok) {
            const retryReader = retryResponse.body?.getReader();
            if (!retryReader) throw new Error('无法读取响应流');
            // 继续处理重试的流式响应
            const retryDecoder = new TextDecoder();
            let retryBuffer = '';
            while (true) {
              const { done, value } = await retryReader.read();
              if (done) break;
              retryBuffer += retryDecoder.decode(value, { stream: true });
              const lines = retryBuffer.split('\n');
              retryBuffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') { callbacks.onComplete?.(); return; }
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) callbacks.onToken?.(content);
                  } catch { /* skip */ }
                }
              }
            }
            callbacks.onComplete?.();
            return;
          }
        }
      }
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullText += token;
              callbacks.onToken?.(token);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    callbacks.onComplete?.(fullText);
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * AI 文案生成（首次对话）
 */
export async function generateCopywriting(
  userPrompt: string,
  agentId: string,
  callbacks: StreamCallbacks,
  featureCode?: string,
): Promise<void> {
  return chatStream(userPrompt, agentId, callbacks, [], featureCode);
}

/**
 * 继续多轮对话
 */
export async function continueConversation(
  history: ChatMessage[],
  userMessage: string,
  agentId: string,
  callbacks: StreamCallbacks,
  featureCode?: string,
): Promise<void> {
  return chatStream(userMessage, agentId, callbacks, history, featureCode);
}

// 导出配置检查（Edge Function 总是可用的）
export const isZenmuxConfigured = true;
