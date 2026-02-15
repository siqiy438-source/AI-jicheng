/**
 * 穿搭推荐服务
 * 上传单品图片 → AI 推荐 3-5 套完整搭配方案
 */

import { supabaseUrl, supabaseAnonKey, getAccessToken, forceRefreshToken } from './supabase';

// ---- 类型定义 ----

export type OutfitScene = 'commute' | 'date' | 'casual' | 'formal';
export type OutfitSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export const SCENE_LABELS: Record<OutfitScene, string> = {
  commute: '通勤',
  date: '约会',
  casual: '休闲',
  formal: '正式',
};

export const SEASON_LABELS: Record<OutfitSeason, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

export interface OutfitItem {
  category: string;
  description: string;
  colorSuggestion: string;
  styleTip: string;
}

export interface OutfitCombination {
  name: string;
  theme: string;
  items: OutfitItem[];
  stylingTips: string[];
  overallLook: string;
}

export interface OutfitRecommendResult {
  inputAnalysis: {
    itemType: string;
    color: string;
    style: string;
    material: string;
  };
  combinations: OutfitCombination[];
  generalTips: string[];
}

// ---- API 调用 ----

export async function getOutfitRecommendation(
  image: string,
  scene: OutfitScene,
  season: OutfitSeason,
): Promise<OutfitRecommendResult> {
  const url = `${supabaseUrl}/functions/v1/ai-chat`;

  const prompt = `请分析这件衣服，并推荐适合「${SCENE_LABELS[scene]}」场景、「${SEASON_LABELS[season]}季」穿搭的 3-5 套完整搭配方案。每套方案需包含上装、下装、鞋子、包包、配饰。`;

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
        mode: 'outfit-recommend',
        prompt,
        images: [image],
        stream: false,
        feature_code: 'ai_outfit_recommend',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  };

  let token = await getAccessToken();
  if (!token) throw new Error('请先登录后再使用穿搭推荐功能');

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
    throw new Error(`推荐请求失败: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('未返回推荐内容');

  // 解析 JSON（处理可能的 markdown 包裹）
  let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(jsonStr) as OutfitRecommendResult;
  } catch {
    // 尝试修复截断的 JSON
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
      return JSON.parse(repaired) as OutfitRecommendResult;
    } catch {
      throw new Error('AI 返回的数据格式异常，请重试');
    }
  }
}
