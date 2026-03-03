/**
 * 关键帧提取工具
 * 使用 Canvas API 从视频中提取关键帧
 */

export interface KeyframeData {
  timestamp: number; // 时间戳（秒）
  dataUrl: string;   // Base64 编码的图片
}

/**
 * 从视频文件中提取关键帧
 * @param videoFile 视频文件
 * @param count 提取的关键帧数量（默认 5）
 * @returns 关键帧数据数组
 */
export async function extractKeyframes(
  videoFile: File,
  count: number = 5
): Promise<KeyframeData[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'));
      return;
    }

    video.src = URL.createObjectURL(videoFile);
    video.load();

    video.onloadedmetadata = () => {
      const duration = video.duration;

      // 检查视频时长
      if (duration > 120) {
        URL.revokeObjectURL(video.src);
        reject(new Error('视频时长不能超过 120 秒'));
        return;
      }

      // 计算关键帧间隔（均匀分布）
      const interval = duration / (count + 1);
      const keyframes: KeyframeData[] = [];
      let currentFrame = 0;

      const captureFrame = () => {
        if (currentFrame >= count) {
          URL.revokeObjectURL(video.src);
          resolve(keyframes);
          return;
        }

        const timestamp = interval * (currentFrame + 1);
        video.currentTime = timestamp;
      };

      video.onseeked = () => {
        // 设置 Canvas 尺寸为视频尺寸
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 绘制当前帧到 Canvas
        ctx.drawImage(video, 0, 0);

        // 转为 Base64（JPEG 格式，质量 0.8）
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        keyframes.push({
          timestamp: video.currentTime,
          dataUrl,
        });

        currentFrame++;
        captureFrame();
      };

      captureFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('视频加载失败'));
    };
  });
}

/**
 * 获取视频时长
 * @param videoFile 视频文件
 * @returns 视频时长（秒）
 */
export async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.load();

    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('视频加载失败'));
    };
  });
}
