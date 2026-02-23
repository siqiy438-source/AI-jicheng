/**
 * ZenMux AI 服务 - 通过 Supabase Edge Function 调用
 * API Key 安全存储在 Supabase Secrets 中
 */

import { supabaseUrl, supabaseAnonKey, getAccessToken, forceRefreshToken } from './supabase';

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

function extractContentFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const data = payload as Record<string, any>;
  const firstChoice = Array.isArray(data.choices) ? data.choices[0] : null;
  const deltaContent = firstChoice?.delta?.content;
  if (typeof deltaContent === 'string') return deltaContent;

  const messageContent = firstChoice?.message?.content;
  if (typeof messageContent === 'string') return messageContent;
  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && typeof part.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  if (typeof data.content === 'string') return data.content;
  return '';
}

async function readSseText(response: Response, callbacks: StreamCallbacks): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  let doneReceived = false;

  const handleDataLine = (line: string) => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trimStart();
    if (!data) return;
    if (data === '[DONE]') {
      doneReceived = true;
      return;
    }

    try {
      const parsed = JSON.parse(data);
      const token = extractContentFromPayload(parsed);
      if (token) {
        fullText += token;
        callbacks.onToken?.(token);
      }
    } catch {
      // 忽略非 JSON 或被分片打断的无效行
    }
  };

  const flushBufferLines = (flushTail: boolean) => {
    while (true) {
      const lineBreakIndex = buffer.indexOf('\n');
      if (lineBreakIndex === -1) break;

      let line = buffer.slice(0, lineBreakIndex);
      buffer = buffer.slice(lineBreakIndex + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.trim()) handleDataLine(line);
      if (doneReceived) return;
    }

    if (flushTail && buffer.trim()) {
      handleDataLine(buffer.replace(/\r$/, ''));
      buffer = '';
    }
  };

  while (!doneReceived) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    flushBufferLines(false);
  }

  buffer += decoder.decode();
  flushBufferLines(true);

  return fullText;
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
  phase?: 'explore' | 'generate',
  images?: string[],
): Promise<void> {
  callbacks.onStart?.();

  try {
    // 获取当前用户的 access_token（用于认证）
    let token = await getAccessToken();
    if (!token) {
      token = await forceRefreshToken();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    };

    // 如果用户已登录，添加认证头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestId = crypto.randomUUID();
    const payload = {
      prompt,
      agentId,
      history,
      stream: true,
      feature_code: featureCode,
      phase,
      images,
      request_id: requestId,
    };

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // 401 时强制刷新 token 重试一次（即使首次没拿到 token 也重试）
      if (response.status === 401) {
        const newToken = await forceRefreshToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(getEdgeFunctionUrl(), {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          if (retryResponse.ok) {
            const contentType = retryResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await retryResponse.json();
              const fullText = extractContentFromPayload(data);
              if (fullText) callbacks.onToken?.(fullText);
              callbacks.onComplete?.(fullText);
              return;
            }

            const fullText = await readSseText(retryResponse, callbacks);
            callbacks.onComplete?.(fullText);
            return;
          }
        }
      }
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      const fullText = extractContentFromPayload(data);
      if (fullText) callbacks.onToken?.(fullText);
      callbacks.onComplete?.(fullText);
      return;
    }

    const fullText = await readSseText(response, callbacks);
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
  phase?: 'explore' | 'generate',
  images?: string[],
): Promise<void> {
  return chatStream(userPrompt, agentId, callbacks, [], featureCode, phase, images);
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
  phase?: 'explore' | 'generate',
  images?: string[],
): Promise<void> {
  return chatStream(userMessage, agentId, callbacks, history, featureCode, phase, images);
}

// 导出配置检查（Edge Function 总是可用的）
export const isZenmuxConfigured = true;
