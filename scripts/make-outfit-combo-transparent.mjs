/**
 * 去掉 outfit-combo-vintage.png 的白底 / 浅灰底，输出 RGBA PNG
 * 1) 极高亮像素直接透明
 * 2) 从边缘逐层剥离与「白边参考色」相近的像素
 * 用法: node scripts/make-outfit-combo-transparent.mjs
 */
import sharp from "sharp";
import { renameSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = join(__dirname, "../public/icons/outfit-combo-vintage.png");
const output = input;

const MAX_PASSES = 1200;
const MATCH_REF = 55;

function distRgb(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

let { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const w = info.width;
const h = info.height;
const stride = w * 4;

// 0) 纯白热区直接抠掉
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = y * stride + x * 4;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (r >= 248 && g >= 248 && b >= 248) data[i + 3] = 0;
  }
}

// 参考色：只统计四边上「很亮」的像素
let sr = 0,
  sg = 0,
  sb = 0,
  sn = 0;
function sampleBrightBorder(x, y) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = y * stride + x * 4;
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  if (r < 235 || g < 235 || b < 235) return;
  sr += r;
  sg += g;
  sb += b;
  sn++;
}
for (let x = 0; x < w; x++) {
  sampleBrightBorder(x, 0);
  sampleBrightBorder(x, h - 1);
}
for (let y = 0; y < h; y++) {
  sampleBrightBorder(0, y);
  sampleBrightBorder(w - 1, y);
}
const ref =
  sn > 0 ? [sr / sn, sg / sn, sb / sn] : [252, 252, 250];

function isTransparent(x, y) {
  if (x < 0 || y < 0 || x >= w || y >= h) return true;
  return data[y * stride + x * 4 + 3] < 12;
}

function isPaperLike(r, g, b) {
  return distRgb([r, g, b], ref) <= MATCH_REF;
}

for (let pass = 0; pass < MAX_PASSES; pass++) {
  const toClear = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * stride + x * 4;
      if (data[i + 3] < 12) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      if (!isPaperLike(r, g, b)) continue;
      if (
        !isTransparent(x - 1, y) &&
        !isTransparent(x + 1, y) &&
        !isTransparent(x, y - 1) &&
        !isTransparent(x, y + 1)
      ) {
        continue;
      }
      toClear.push(i);
    }
  }
  if (toClear.length === 0) break;
  for (const i of toClear) data[i + 3] = 0;
}

await sharp(data, {
  raw: { width: w, height: h, channels: 4 },
})
  .png({ compressionLevel: 9, effort: 10, palette: false })
  .toFile(output + ".tmp");

unlinkSync(output);
renameSync(output + ".tmp", output);

console.log("Done:", output, "ref", ref.map((n) => Math.round(n)).join(","), "RGBA");
