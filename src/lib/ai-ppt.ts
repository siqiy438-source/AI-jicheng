/**
 * AI PPT 服务层
 * 通过 Supabase Edge Function 调用 Gemini 3 Pro 生成大纲和描述
 * 图片生成复用现有 ai-image 服务
 */

import { supabaseAnonKey } from './supabase';

// ============ 类型定义 ============

export interface SlideData {
  id: number;
  title: string;
  outlinePoints: string[];
  description: string;
  generatedImage?: string;
}

export interface GenerateOutlineParams {
  content: string;
  mode: 'sentence' | 'outline' | 'description';
  pageCount: number;
  style: string;
}

export interface GenerateOutlineResult {
  success: boolean;
  slides?: SlideData[];
  projectTitle?: string;
  error?: string;
}

export interface GenerateDescriptionParams {
  slideTitle: string;
  outlinePoints: string[];
  overallTheme: string;
  style: string;
  slideIndex: number;
  totalSlides: number;
}

export interface GenerateDescriptionResult {
  success: boolean;
  description?: string;
  error?: string;
}

export interface BatchGenerateDescriptionsParams {
  slides: SlideData[];
  overallTheme: string;
  style: string;
}

export interface BatchGenerateDescriptionsResult {
  success: boolean;
  slides?: SlideData[];
  error?: string;
}

// ============ API 调用 ============

const getEdgeFunctionUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
  return `${supabaseUrl}/functions/v1/ai-ppt`;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: supabaseAnonKey,
  'Authorization': `Bearer ${supabaseAnonKey}`,
});

/**
 * 生成 PPT 大纲
 */
export async function generateOutline(params: GenerateOutlineParams): Promise<GenerateOutlineResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'generate_outline',
        ...params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (response.status === 504) {
        throw new Error('请求超时，AI 服务响应过慢，请稍后重试');
      }
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '请求超时，AI 服务响应过慢，请稍后重试' };
    }
    return { success: false, error: error instanceof Error ? error.message : '生成大纲失败' };
  }
}

/**
 * 生成单页描述
 */
export async function generateSlideDescription(params: GenerateDescriptionParams): Promise<GenerateDescriptionResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'generate_description',
        ...params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '请求超时' };
    }
    return { success: false, error: error instanceof Error ? error.message : '生成描述失败' };
  }
}

/**
 * 批量生成描述
 */
export async function batchGenerateDescriptions(params: BatchGenerateDescriptionsParams): Promise<BatchGenerateDescriptionsResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时

    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'batch_generate_descriptions',
        ...params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '批量生成超时' };
    }
    return { success: false, error: error instanceof Error ? error.message : '批量生成描述失败' };
  }
}

/**
 * 生成单页图片（复用现有 ai-image 服务）
 */
export async function generateSlideImage(params: {
  description: string;
  style: string;
  template: string;
  aspectRatio: string;
  line?: "standard" | "premium";
  resolution?: "default" | "2k" | "4k";
}): Promise<{ success: boolean; imageBase64?: string; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co';
    const imageUrl = `${supabaseUrl}/functions/v1/ai-image`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    // 风格提示词
    const stylePrompts: Record<string, string> = {
      free: '',
      sketch: 'Hand-drawn sketch style, journal aesthetic, warm tones. ',
      cute: 'Cute cartoon kawaii style, pastel colors, rounded shapes. ',
      art: 'Artistic illustration style, creative visual, rich colors. ',
      ink: 'Traditional Chinese ink wash painting style, elegant brush strokes, artistic Zen atmosphere, high-end oriental aesthetic, minimalist ink textures, subtle watercolor gradients, cultural and sophisticated. ',
      watercolor: 'Elegant watercolor wash, soft fluid textures, artistic bleeding effects, dreamy and light atmosphere, delicate hand-painted feel, pastel color palette, minimalist artistic expression. ',
      popart: 'Vibrant pop art style, bold black outlines, halftone patterns, high-contrast saturated colors, Andy Warhol aesthetic, energetic and retro, repetitive patterns, strong visual impact. ',
      crayon: 'Whimsical crayon drawing style, vibrant oil pastel textures, messy but charming lines, colorful scribbles, soft paper background, childlike imagination, bright primary colors, heartwarming and playful, high resolution. ',
    };

    // PPT 模板提示词
    const templatePrompts: Record<string, string> = {
      none: '',
      'visual-note': 'Professional Digital Whiteboard Illustration, hand-drawn marker sketch style, minimalist infographic doodles, creamy white paper texture with subtle grain, clean black ink outlines, hand-drawn arrows and emphasis markers, soft accent colors (orange/blue), organized visual thinking layout, high resolution, vector art feel, trending on Pinterest. ',
      'swiss-minimal': 'High-end corporate PPT slide, Swiss Modernism, ultra-minimalist layout, massive negative space, bold sans-serif typography, professional color palette (Deep Navy, Slate Gray, Crisp White), grid-based alignment, perfect geometric shapes, thin professional lines, authoritative and clean, Apple website aesthetic. ',
      'isometric': 'Isometric 3D infographic design, 45-degree angle orthographic view, clean vector 3D models, soft pastel color grading with professional gradients, neutral light gray background, elements perfectly aligned on a 3D grid, sophisticated organized tech-oriented visualization, C4D render style, soft shadows, clean edges. ',
      'glassmorphism': 'Futuristic Glassmorphism style, translucent frosted glass cards floating in space, deep vibrant mesh gradient background (purple, blue, and teal), glowing neon edges, soft blur effects, typography: thin white sans-serif text, high-tech UI elements, floating 3D spheres, elegant refraction, cinematic lighting, Unreal Engine 5 render. ',
      'claymorphism': 'Claymorphism 3D style, soft matte texture, rounded organic shapes, volumetric studio lighting, playful and friendly aesthetic, Morandi color palette, 3D icons with soft depth, cute and modern, high-quality 3D render, minimalist composition, friendly atmosphere. ',
      'dark-cinematic': 'Dark cinematic presentation slide, charcoal gray textured background, dramatic spot lighting, high contrast, glowing gold and white accents, elegant serif typography, luxury brand aesthetic, sophisticated light and shadow play, 8k resolution, minimalist but powerful composition. ',
      'neo-brutalism': 'Neo-brutalism design, bold thick black outlines, high-saturation pop colors (Yellow, Cyan, Red), thick hard shadows, asymmetrical experimental layout, avant-garde typography, vibrant energy, flat vector shapes, confident and modern, trending on Dribbble. ',
      'editorial': 'High-end editorial magazine layout, fashion aesthetic, sophisticated mix of bold Serif and light Sans-serif fonts, professional white space management, photography-centric composition, minimalist artistic style, clean margins, elegant typography-focused design, premium print feel. ',
    };

    const templatePrompt = templatePrompts[params.template] || '';
    const stylePrompt = stylePrompts[params.style] || '';

    const fullPrompt = `Create a professional presentation slide image.
${templatePrompt}${stylePrompt}
Content description:
${params.description}

Requirements:
- Clean, professional layout suitable for a presentation slide
- Clear visual hierarchy with title and key points
- Harmonious color scheme
- Modern design aesthetic
- Text should be in Chinese (简体中文)
- Aspect ratio: ${params.aspectRatio}`;

    const response = await fetch(imageUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        prompt: fullPrompt,
        aspectRatio: params.aspectRatio,
        line: params.line || 'standard',
        resolution: params.resolution || 'default',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `图片生成失败: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      imageBase64: result.imageBase64,
      error: result.error,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: '图片生成超时' };
    }
    return { success: false, error: error instanceof Error ? error.message : '图片生成失败' };
  }
}

// ============ 导出功能 ============

/**
 * 导出为 PDF
 */
export async function exportToPDF(slides: SlideData[], projectTitle: string): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  // 确定页面方向和尺寸
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080], // 16:9
  });

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) doc.addPage();

    const slide = slides[i];
    if (slide.generatedImage) {
      // 添加图片
      doc.addImage(slide.generatedImage, 'PNG', 0, 0, 1920, 1080);
    } else {
      // 没有图片时显示标题
      doc.setFontSize(48);
      doc.text(slide.title, 960, 540, { align: 'center' });
    }
  }

  doc.save(`${projectTitle || 'AI-PPT'}.pdf`);
}

/**
 * 导出为 PPT
 */
export async function exportToPPTX(slides: SlideData[], projectTitle: string): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.title = projectTitle || 'AI PPT';
  pptx.layout = 'LAYOUT_WIDE'; // 16:9

  for (const slide of slides) {
    const pptSlide = pptx.addSlide();

    if (slide.generatedImage) {
      // 添加图片作为背景
      pptSlide.addImage({
        data: slide.generatedImage,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
      });
    } else {
      // 没有图片时添加标题文本
      pptSlide.addText(slide.title, {
        x: 1,
        y: 2,
        w: 8,
        h: 1.5,
        fontSize: 36,
        bold: true,
        align: 'center',
        valign: 'middle',
      });

      // 添加要点
      const bulletText = slide.outlinePoints.map(p => ({
        text: p,
        options: { bullet: true, fontSize: 18 },
      }));
      pptSlide.addText(bulletText, {
        x: 1,
        y: 3.5,
        w: 8,
        h: 3,
      });
    }
  }

  await pptx.writeFile({ fileName: `${projectTitle || 'AI-PPT'}.pptx` });
}

/**
 * 导出为图片 ZIP
 */
export async function exportToImages(slides: SlideData[], projectTitle: string): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  let hasImages = false;
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    if (slide.generatedImage) {
      // 从 base64 data URL 提取数据
      const base64Data = slide.generatedImage.replace(/^data:image\/\w+;base64,/, '');
      zip.file(`slide-${String(i + 1).padStart(2, '0')}-${slide.title}.png`, base64Data, { base64: true });
      hasImages = true;
    }
  }

  if (!hasImages) {
    throw new Error('没有已生成的图片可以导出');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectTitle || 'AI-PPT'}-images.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}