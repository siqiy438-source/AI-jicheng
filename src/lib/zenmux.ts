/**
 * ZenMux AI 服务 - 通过 Supabase Edge Function 调用
 * API Key 安全存储在 Supabase Secrets 中
 */

import { getAccessToken } from './supabase';

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
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
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
  callbacks: StreamCallbacks
): Promise<void> {
  return chatStream(userMessage, agentId, callbacks, history);
}

// 导出配置检查（Edge Function 总是可用的）
export const isZenmuxConfigured = true;
