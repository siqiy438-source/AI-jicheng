/**
 * 图片压缩工具
 * 用于在上传前压缩图片，避免超出 API 请求大小限制
 * 支持根据设备性能自动调整压缩参数
 */

import { getRecommendedImageQuality, getRecommendedImageSize } from './device-detection';

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
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
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
  columns: number = 5
): Promise<string> {
  if (images.length === 0) throw new Error('没有图片可合并');

  // 自动调整列数：图片少时减少列数
  const actualColumns = Math.min(columns, images.length);
  const rows = Math.ceil(images.length / actualColumns);
  const gap = 6;
  const labelH = 22;

  const canvasW = actualColumns * cellSize + (actualColumns + 1) * gap;
  const canvasH = rows * (cellSize + labelH) + (rows + 1) * gap;

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
    const x = gap + col * (cellSize + gap);
    const y = gap + row * (cellSize + labelH + gap);

    // 白色单元格背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, cellSize, cellSize + labelH);

    // 编号标签
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`#${i + 1}`, x + cellSize / 2, y + 15);

    // 加载并绘制图片（居中裁剪为正方形）
    try {
      const img = await loadImage(images[i]);
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, x, y + labelH, cellSize, cellSize);
    } catch {
      // 图片加载失败时绘制占位符
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(x, y + labelH, cellSize, cellSize);
      ctx.fillStyle = '#999999';
      ctx.font = '12px Arial';
      ctx.fillText('加载失败', x + cellSize / 2, y + labelH + cellSize / 2);
    }

    // 细边框
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellSize, cellSize + labelH);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}
