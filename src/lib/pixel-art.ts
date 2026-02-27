import { findNearestMardColor, rgbToHex, isDark, type MardColor } from './mard-palette';

export interface PixelCell {
  row: number;
  col: number;
  mardColor: MardColor;
}

export interface ColorUsage {
  color: MardColor;
  count: number;
}

export interface PixelArtResult {
  grid: PixelCell[][];
  usedColors: ColorUsage[];
  gridWidth: number;
  gridHeight: number;
}

/** 渲染尺寸配置 */
const CELL_SIZES: Record<number, { cellPx: number; fontSize: number }> = {
  20: { cellPx: 40, fontSize: 11 },
  30: { cellPx: 30, fontSize: 9 },
  50: { cellPx: 22, fontSize: 7 },
};

/**
 * 将图片处理为像素化 + MARD 色号映射
 * @param imageEl 已加载完成的 HTMLImageElement
 * @param gridSize  像素格数（20 / 30 / 50）
 */
export function processImage(imageEl: HTMLImageElement, gridSize: number): PixelArtResult {
  // 根据图片宽高比计算网格宽高（保持比例，最长边 = gridSize）
  const aspect = imageEl.naturalWidth / imageEl.naturalHeight;
  let gridW: number, gridH: number;
  if (aspect >= 1) {
    gridW = gridSize;
    gridH = Math.max(1, Math.round(gridSize / aspect));
  } else {
    gridH = gridSize;
    gridW = Math.max(1, Math.round(gridSize * aspect));
  }

  // 用临时 canvas 缩小图片，取像素数据
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = gridW;
  tmpCanvas.height = gridH;
  const ctx = tmpCanvas.getContext('2d')!;
  ctx.drawImage(imageEl, 0, 0, gridW, gridH);
  const imageData = ctx.getImageData(0, 0, gridW, gridH);
  const pixels = imageData.data; // RGBA flat array

  // 逐像素匹配 MARD 色号
  const grid: PixelCell[][] = [];
  const colorCountMap = new Map<string, { color: MardColor; count: number }>();

  for (let row = 0; row < gridH; row++) {
    grid[row] = [];
    for (let col = 0; col < gridW; col++) {
      const idx = (row * gridW + col) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      const mardColor = findNearestMardColor(r, g, b);

      grid[row][col] = { row, col, mardColor };

      const existing = colorCountMap.get(mardColor.code);
      if (existing) {
        existing.count++;
      } else {
        colorCountMap.set(mardColor.code, { color: mardColor, count: 1 });
      }
    }
  }

  // 按使用频次降序排列
  const usedColors = Array.from(colorCountMap.values())
    .sort((a, b) => b.count - a.count);

  return { grid, usedColors, gridWidth: gridW, gridHeight: gridH };
}

/**
 * 将 PixelArtResult 渲染到指定 canvas 元素上
 * @param canvas 目标 canvas
 * @param result processImage 返回的结果
 * @param gridSize 格数选择（决定每格像素大小）
 */
export function renderPixelGrid(
  canvas: HTMLCanvasElement,
  result: PixelArtResult,
  gridSize: number
): void {
  const { cellPx, fontSize } = CELL_SIZES[gridSize] ?? { cellPx: 22, fontSize: 7 };
  const { grid, gridWidth, gridHeight } = result;

  canvas.width = gridWidth * cellPx;
  canvas.height = gridHeight * cellPx;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cell = grid[row][col];
      const x = col * cellPx;
      const y = row * cellPx;

      // 填充 MARD 颜色
      ctx.fillStyle = rgbToHex(cell.mardColor.rgb);
      ctx.fillRect(x, y, cellPx, cellPx);

      // 绘制分隔线（1px 半透明白线）
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.25, y + 0.25, cellPx - 0.5, cellPx - 0.5);

      // 绘制色号文字
      const textColor = isDark(cell.mardColor.rgb) ? '#ffffff' : '#000000';
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 阴影增强可读性
      ctx.shadowColor = isDark(cell.mardColor.rgb) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = 2;
      ctx.fillText(cell.mardColor.code, x + cellPx / 2, y + cellPx / 2);
      ctx.shadowBlur = 0;
    }
  }
}

/**
 * 下载 canvas 内容为 PNG
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
