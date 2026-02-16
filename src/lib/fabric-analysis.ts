/**
 * 面料成分说明生成器服务
 * 上传水洗标/面料照片 → AI 生成面向顾客的营销话术
 */

import { supabaseUrl, supabaseAnonKey, getAccessToken, forceRefreshToken } from './supabase';

// ---- 类型定义 ----

export interface FabricAnalysisResult {
  fabricIdentification: {
    composition: string;
    fabricType: string;
    texture: string;
    weight: string;
  };
  marketingDescription: {
    headline: string;
    whyExpensive: string;
    whatsDifferent: string;
    sellingPoints: string[];
    suitableSeasons: string;
    suitableScenes: string[];
  };
  careInstructions: {
    washing: string;
    drying: string;
    ironing: string;
    storage: string;
    warnings: string[];
  };
  maintenanceTips: string[];
  fabricComparison: {
    comparedTo: string;
    advantages: string[];
    disadvantages: string[];
  }[];
  productDetailCopy: string;
}

// ---- API 调用 ----

export async function getFabricAnalysis(
  image: string,
): Promise<FabricAnalysisResult> {
  const url = `${supabaseUrl}/functions/v1/ai-chat`;

  const prompt = `请分析这张面料水洗标/面料照片，识别面料成分，并生成面向顾客的营销话术。`;

  const doFetch = async (token: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        mode: 'fabric-analysis',
        prompt,
        images: [image],
        stream: false,
        feature_code: 'ai_fabric_analysis',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  };

  let token = await getAccessToken();
  if (!token) throw new Error('请先登录后再使用面料分析功能');

  let response = await doFetch(token);

  if (response.status === 401) {
    const newToken = await forceRefreshToken();
    if (!newToken) throw new Error('登录已过期，请重新登录');
    response = await doFetch(newToken);
  }

  if (response.status === 402) {
    const errData = await response.json();
    throw new Error(errData.error || '积分不足');
  }

  if (!response.ok) {
    throw new Error(`分析请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('未返回分析内容');

  let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(jsonStr) as FabricAnalysisResult;
  } catch {
    let repaired = jsonStr;
    const openQuotes = (repaired.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) repaired += '"';
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    for (let k = 0; k < openBrackets - closeBrackets; k++) repaired += ']';
    for (let k = 0; k < openBraces - closeBraces; k++) repaired += '}';

    try {
      return JSON.parse(repaired) as FabricAnalysisResult;
    } catch {
      throw new Error('AI 返回的数据格式异常，请重试');
    }
  }
}
