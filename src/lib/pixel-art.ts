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
  let usedColors = Array.from(colorCountMap.values())
    .sort((a, b) => b.count - a.count);

  // ── 合并相似颜色：RGB 距离很近的色号自动归并到使用量更大的那个 ──
  const MERGE_DIST_SQ = 2500; // 阈值：约每通道差 ~28 以内合并

  const mergeMap = new Map<string, MardColor>(); // 被合并色 → 目标色
  const alive = new Set(usedColors.map(u => u.color.code));

  // 从最少用的开始，尝试合并到更常用且最近的颜色
  for (let i = usedColors.length - 1; i >= 1; i--) {
    const minor = usedColors[i];
    if (!alive.has(minor.color.code)) continue;

    let bestIdx = -1;
    let bestDist = Infinity;
    for (let j = 0; j < i; j++) {
      if (!alive.has(usedColors[j].color.code)) continue;
      const mj = usedColors[j].color;
      const dr = minor.color.rgb[0] - mj.rgb[0];
      const dg = minor.color.rgb[1] - mj.rgb[1];
      const db = minor.color.rgb[2] - mj.rgb[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) { bestDist = dist; bestIdx = j; }
    }

    if (bestIdx >= 0 && bestDist < MERGE_DIST_SQ) {
      mergeMap.set(minor.color.code, usedColors[bestIdx].color);
      alive.delete(minor.color.code);
    }
  }

  // 如果有合并，重新映射网格并统计
  if (mergeMap.size > 0) {
    const newCountMap = new Map<string, { color: MardColor; count: number }>();
    for (const row of grid) {
      for (const cell of row) {
        const replacement = mergeMap.get(cell.mardColor.code);
        if (replacement) cell.mardColor = replacement;
        const ex = newCountMap.get(cell.mardColor.code);
        if (ex) ex.count++;
        else newCountMap.set(cell.mardColor.code, { color: cell.mardColor, count: 1 });
      }
    }
    usedColors = Array.from(newCountMap.values()).sort((a, b) => b.count - a.count);
  }

  return { grid, usedColors, gridWidth: gridW, gridHeight: gridH };
}

/**
 * 将 PixelArtResult 渲染到指定 canvas 元素上（含底部颜色图例）
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
  const { grid, gridWidth, gridHeight, usedColors } = result;

  const gridPixelW = gridWidth * cellPx;
  const gridPixelH = gridHeight * cellPx;

  // ── 图例布局预计算 ──
  const legendSwatchSize = 16;
  const legendFontSize = 12;
  const legendItemGapX = 18;
  const legendRowHeight = 26;
  const legendPadX = 14;
  const legendPadY = 12;
  const legendTopGap = 10;

  // 测量每个图例项宽度
  const offscreen = document.createElement('canvas');
  const offCtx = offscreen.getContext('2d')!;
  offCtx.font = `bold ${legendFontSize}px sans-serif`;

  const legendItems = usedColors.map(({ color, count }) => {
    const label = `${color.code} (${count})`;
    const textW = offCtx.measureText(label).width;
    return { color, count, label, itemW: legendSwatchSize + 6 + textW };
  });

  // 确保画布宽度至少能放下图例
  const canvasW = Math.max(gridPixelW, 320);
  const maxRowW = canvasW - legendPadX * 2;

  // 计算需要几行
  let legendRows = 1;
  let curW = 0;
  for (const item of legendItems) {
    if (curW > 0 && curW + item.itemW > maxRowW) {
      legendRows++;
      curW = item.itemW + legendItemGapX;
    } else {
      curW += item.itemW + legendItemGapX;
    }
  }

  const legendH = legendPadY * 2 + legendRows * legendRowHeight;
  const totalH = gridPixelH + legendTopGap + legendH;

  // ── 设置画布尺寸 ──
  canvas.width = canvasW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 如果画布比网格宽，网格居中绘制
  const gridOffsetX = Math.round((canvasW - gridPixelW) / 2);

  // ── 绘制像素网格 ──
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cell = grid[row][col];
      const x = gridOffsetX + col * cellPx;
      const y = row * cellPx;

      ctx.fillStyle = rgbToHex(cell.mardColor.rgb);
      ctx.fillRect(x, y, cellPx, cellPx);

      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.25, y + 0.25, cellPx - 0.5, cellPx - 0.5);

      const textColor = isDark(cell.mardColor.rgb) ? '#ffffff' : '#000000';
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = isDark(cell.mardColor.rgb) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = 2;
      ctx.fillText(cell.mardColor.code, x + cellPx / 2, y + cellPx / 2);
      ctx.shadowBlur = 0;
    }
  }

  // ── 绘制底部颜色图例 ──
  const legendY = gridPixelH + legendTopGap;

  // 图例背景
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, legendY, canvasW, legendH);

  // 顶部分隔线
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, legendY + 0.5);
  ctx.lineTo(canvasW, legendY + 0.5);
  ctx.stroke();

  // 逐项绘制
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;

  let drawX = legendPadX;
  let drawY = legendY + legendPadY + legendRowHeight / 2;

  for (const item of legendItems) {
    // 换行判断
    if (drawX > legendPadX && drawX + item.itemW > maxRowW + legendPadX) {
      drawX = legendPadX;
      drawY += legendRowHeight;
    }

    // 色块
    ctx.fillStyle = rgbToHex(item.color.rgb);
    ctx.fillRect(drawX, drawY - legendSwatchSize / 2, legendSwatchSize, legendSwatchSize);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(drawX, drawY - legendSwatchSize / 2, legendSwatchSize, legendSwatchSize);

    // 文字
    ctx.fillStyle = '#333';
    ctx.font = `bold ${legendFontSize}px sans-serif`;
    ctx.fillText(item.label, drawX + legendSwatchSize + 6, drawY + 1);

    drawX += item.itemW + legendItemGapX;
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
