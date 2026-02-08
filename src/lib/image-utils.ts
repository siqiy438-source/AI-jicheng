/**
 * 图片压缩工具
 * 用于在上传前压缩图片，避免超出 API 请求大小限制
 */

export interface CompressOptions {
  maxWidth?: number;      // 最大宽度，默认 1024
  maxHeight?: number;     // 最大高度，默认 1024
  quality?: number;       // 压缩质量 0-1，默认 0.8
  mimeType?: string;      // 输出格式，默认 image/jpeg
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

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
  const opts = { ...DEFAULT_OPTIONS, ...options };

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

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 canvas context'));
            return;
          }

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
