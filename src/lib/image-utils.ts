/**
 * 图片压缩工具
 * 用于在上传前压缩图片，避免超出 API 请求大小限制
 * 支持根据设备性能自动调整压缩参数
 */

import type { HangoutfitReferenceBoardMode } from './hangoutfit';
import { getRecommendedImageQuality, getRecommendedImageSize } from './device-detection';

const MOBILE_UA_REGEX = /iPhone|iPad|iPod|Android/i;
const IMAGE_BLOB_CACHE_LIMIT = 6;
const imageBlobCache = new Map<string, Promise<Blob>>();

export interface CompressOptions {
  maxWidth?: number;      // 最大宽度，默认根据设备性能
  maxHeight?: number;     // 最大高度，默认根据设备性能
  quality?: number;       // 压缩质量 0-1，默认根据设备性能
  mimeType?: string;      // 输出格式，默认 image/jpeg
  autoOptimize?: boolean; // 是否根据设备性能自动优化，默认 true
}

/**
 * 获取默认压缩选项（根据设备性能）
 */
function getDefaultOptions(): Required<CompressOptions> {
  const recommendedSize = getRecommendedImageSize();
  const recommendedQuality = getRecommendedImageQuality();

  return {
    maxWidth: recommendedSize,
    maxHeight: recommendedSize,
    quality: recommendedQuality,
    mimeType: 'image/jpeg',
    autoOptimize: true,
  };
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const defaultOpts = getDefaultOptions();
  const opts = { ...defaultOpts, ...options };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // 计算缩放后的尺寸
          let { width, height } = img;

          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(
              opts.maxWidth / width,
              opts.maxHeight / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // 创建 canvas 进行压缩
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', {
            alpha: opts.mimeType === 'image/png',
            // 低端设备使用更快的渲染
            willReadFrequently: false,
          });

          if (!ctx) {
            reject(new Error('无法创建 canvas context'));
            return;
          }

          // 使用更好的图像平滑算法（高端设备）
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为 base64
          const base64 = canvas.toDataURL(opts.mimeType, opts.quality);
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 批量压缩图片
 * @param files 原始图片文件列表
 * @param options 压缩选项
 * @returns 压缩后的 base64 字符串数组
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {}
): Promise<string[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * 获取图片文件大小（KB）
 */
export function getBase64Size(base64: string): number {
  // 移除 data URL 前缀
  const base64Data = base64.split(',')[1] || base64;
  // base64 字符串长度 * 0.75 = 原始字节数
  return Math.round((base64Data.length * 0.75) / 1024);
}

/**
 * 加载 base64 图片为 HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / img.width, height / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = x + (width - drawW) / 2;
  const dy = y + (height - drawH) / 2;
  ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, drawW, drawH);
}

/**
 * 将多张图片合并为带编号的网格拼图
 * 用于 AI 陈列功能，将多件衣服合并为一张图发送给 API
 * @param images base64 图片数组
 * @param cellSize 每个单元格的大小（像素），默认 256
 * @param columns 列数，默认 5
 * @returns 合并后的 base64 字符串
 */
export async function mergeImagesToGrid(
  images: string[],
  cellSize: number = 256,
  columns: number = 5,
  options?: {
    cellHeight?: number;
    fit?: 'cover' | 'contain';
  }
): Promise<string> {
  if (images.length === 0) throw new Error('没有图片可合并');

  // 自动调整列数：图片少时减少列数
  const actualColumns = Math.min(columns, images.length);
  const rows = Math.ceil(images.length / actualColumns);
  const gap = 6;
  const labelH = 22;
  const cellW = cellSize;
  const cellH = options?.cellHeight ?? cellSize;
  const fit = options?.fit ?? 'cover';

  const canvasW = actualColumns * cellW + (actualColumns + 1) * gap;
  const canvasH = rows * (cellH + labelH) + (rows + 1) * gap;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 canvas context');

  // 浅灰背景
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (let i = 0; i < images.length; i++) {
    const col = i % actualColumns;
    const row = Math.floor(i / actualColumns);
    const x = gap + col * (cellW + gap);
    const y = gap + row * (cellH + labelH + gap);

    // 白色单元格背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, cellW, cellH + labelH);

    // 编号标签
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${i + 1}`, x + cellW / 2, y + 15);

    // 加载并绘制图片（默认居中裁剪；可选完整包含）
    try {
      const img = await loadImage(images[i]);
      if (fit === 'contain') {
        const scale = Math.min(cellW / img.width, cellH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = x + (cellW - drawW) / 2;
        const dy = y + labelH + (cellH - drawH) / 2;
        ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, drawW, drawH);
      } else {
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, x, y + labelH, cellW, cellH);
      }
    } catch {
      // 图片加载失败时绘制占位符
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(x, y + labelH, cellW, cellH);
      ctx.fillStyle = '#999999';
      ctx.font = '12px Arial';
      ctx.fillText('加载失败', x + cellW / 2, y + labelH + cellH / 2);
    }

    // 细边框
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellW, cellH + labelH);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function buildHangoutfitReferenceBoard({
  garmentImages,
  sceneReferenceSrc,
  boardMode = 'garments-plus-scene-template',
}: {
  garmentImages: string[];
  sceneReferenceSrc: string;
  boardMode?: HangoutfitReferenceBoardMode;
}): Promise<string> {
  if (garmentImages.length === 0) {
    throw new Error('没有服装图片可合并');
  }

  const [sceneImage, ...loadedGarments] = await Promise.all([
    loadImage(sceneReferenceSrc),
    ...garmentImages.map((image) => loadImage(image)),
  ]);

  const canvasW = 1600;
  const canvasH = 1200;
  const outer = 42;
  const panelGap = 30;
  const garmentPanelW = 780;
  const panelH = canvasH - outer * 2;
  const scenePanelW = canvasW - outer * 2 - panelGap - garmentPanelW;
  const panelRadius = 30;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 canvas context');
  }

  ctx.fillStyle = '#efe9e1';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const garmentPanelX = outer;
  const garmentPanelY = outer;
  const scenePanelX = garmentPanelX + garmentPanelW + panelGap;
  const scenePanelY = outer;

  const drawRoundedPanel = (x: number, y: number, width: number, height: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + panelRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, panelRadius);
    ctx.arcTo(x + width, y + height, x, y + height, panelRadius);
    ctx.arcTo(x, y + height, x, y, panelRadius);
    ctx.arcTo(x, y, x + width, y, panelRadius);
    ctx.closePath();
    ctx.fillStyle = '#fbf9f6';
    ctx.fill();
    ctx.strokeStyle = '#d8cec2';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };

  drawRoundedPanel(garmentPanelX, garmentPanelY, garmentPanelW, panelH);
  drawRoundedPanel(scenePanelX, scenePanelY, scenePanelW, panelH);

  const garmentInnerPadding = 28;
  const garmentGap = 18;
  const garmentCount = loadedGarments.length;
  const columns = garmentCount === 1 ? 1 : 2;
  const rows = Math.ceil(garmentCount / columns);
  const cellW = (garmentPanelW - garmentInnerPadding * 2 - garmentGap * (columns - 1)) / columns;
  const cellH = (panelH - garmentInnerPadding * 2 - garmentGap * (rows - 1)) / rows;

  loadedGarments.forEach((img, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const cellX = garmentPanelX + garmentInnerPadding + col * (cellW + garmentGap);
    const cellY = garmentPanelY + garmentInnerPadding + row * (cellH + garmentGap);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cellX, cellY, cellW, cellH);
    ctx.strokeStyle = '#e4dbcf';
    ctx.lineWidth = 2;
    ctx.strokeRect(cellX, cellY, cellW, cellH);

    drawImageContain(ctx, img, cellX, cellY, cellW, cellH);

    const badgeR = 22;
    const badgeX = cellX + 34;
    const badgeY = cellY + 34;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = '#2c2c2c';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), badgeX, badgeY + 1);
  });

  const availableSceneW = scenePanelW - garmentInnerPadding * 2;
  const availableSceneH = panelH - garmentInnerPadding * 2;
  const sceneDx = scenePanelX + (scenePanelW - availableSceneW) / 2;
  const sceneDy = scenePanelY + (panelH - availableSceneH) / 2;
  drawImageContain(ctx, sceneImage, sceneDx, sceneDy, availableSceneW, availableSceneH);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * 下载/保存生成的图片
 * 手机端：优先 Web Share API（可直接存相册）→ 回退 <a download> 触发下载
 * 桌面端：直接触发下载
 */
function isMobileShareSupported(): boolean {
  return MOBILE_UA_REGEX.test(navigator.userAgent) && Boolean(navigator.share && navigator.canShare);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('图片数据无效');
  }

  const mimeType = matches[1] || 'application/octet-stream';
  const binary = atob(matches[2]);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mimeType });
}

async function loadImageBlob(imageSrc: string): Promise<Blob> {
  if (imageSrc.startsWith('data:')) {
    return dataUrlToBlob(imageSrc);
  }

  const response = await fetch(imageSrc);
  if (!response.ok) {
    throw new Error('图片加载失败');
  }

  return response.blob();
}

function getCachedImageBlob(imageSrc: string): Promise<Blob> {
  const cached = imageBlobCache.get(imageSrc);
  if (cached) {
    return cached;
  }

  const pending = loadImageBlob(imageSrc).catch((error) => {
    imageBlobCache.delete(imageSrc);
    throw error;
  });

  if (imageBlobCache.size >= IMAGE_BLOB_CACHE_LIMIT) {
    const oldestKey = imageBlobCache.keys().next().value;
    if (oldestKey) {
      imageBlobCache.delete(oldestKey);
    }
  }

  imageBlobCache.set(imageSrc, pending);
  return pending;
}

export function preloadDownloadImage(imageSrc: string | null | undefined): void {
  if (!imageSrc || !isMobileShareSupported()) {
    return;
  }

  void getCachedImageBlob(imageSrc).catch(() => undefined);
}

export async function downloadGeneratedImage(
  imageSrc: string,
  filename: string = `ai-image-${Date.now()}.png`,
): Promise<void> {
  const isMobile = MOBILE_UA_REGEX.test(navigator.userAgent);

  const triggerDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    if (isMobile && url.startsWith('http')) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 手机端：优先 Web Share API（支持直接保存到相册）
  if (isMobileShareSupported()) {
    const blob = await getCachedImageBlob(imageSrc);
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    const shareData = { files: [file] };

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        throw error;
      }
      return;
    }
  }

  if (!isMobile) {
    const blob = await getCachedImageBlob(imageSrc);
    const objectUrl = URL.createObjectURL(blob);

    try {
      triggerDownload(objectUrl);
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
    return;
  }

  // 手机端兜底：直接使用原始地址触发下载/打开
  triggerDownload(imageSrc);
}
