#!/usr/bin/env node

import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_ICON = resolve(__dirname, '../source-icon.png');

// 检查源图标
if (!existsSync(SOURCE_ICON)) {
  console.error('❌ 错误：找不到源图标文件 source-icon.png');
  console.error('   位置:', SOURCE_ICON);
  process.exit(1);
}

console.log('🎨 开始从源图标生成 PWA 完整图标集...');
console.log('📂 源文件:', SOURCE_ICON);
console.log('');

// ==================== 生成标准图标 ====================
console.log('📱 生成标准 PWA 图标...');

const standardSizes = [16, 32, 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512];

for (const size of standardSizes) {
  const outputPath = resolve(__dirname, `../public/icons/icon-${size}.png`);
  await sharp(SOURCE_ICON)
    .resize(size, size, { fit: 'contain', background: { r: 253, g: 251, b: 248, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(outputPath);
  console.log(`  ✅ ${size}x${size} → icon-${size}.png`);
}

console.log('✅ 标准图标生成完成 (13 个尺寸)');
console.log('');

// ==================== 生成 Maskable 图标 ====================
console.log('🎭 生成 Maskable 图标（Android 自适应）...');

for (const size of [192, 512]) {
  const outputPath = resolve(__dirname, `../public/icons/icon-maskable-${size}.png`);
  const padding = Math.floor(size * 0.2); // 20% 安全边距
  const innerSize = size - padding * 2;
  
  await sharp(SOURCE_ICON)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 217, g: 119, b: 6, alpha: 1 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 217, g: 119, b: 6, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(outputPath);
  console.log(`  ✅ ${size}x${size} Maskable → icon-maskable-${size}.png`);
}

console.log('✅ Maskable 图标生成完成 (2 个尺寸)');
console.log('');

// ==================== 生成 Favicon ====================
console.log('🔖 生成 Favicon...');

// 生成 favicon.ico (包含多个尺寸)
await sharp(SOURCE_ICON)
  .resize(32, 32)
  .png()
  .toFile(resolve(__dirname, '../public/favicon-32.png'));

await sharp(SOURCE_ICON)
  .resize(16, 16)
  .png()
  .toFile(resolve(__dirname, '../public/favicon-16.png'));

// 注意：sharp 不直接支持 .ico 格式，但现代浏览器支持 PNG favicon
await sharp(SOURCE_ICON)
  .resize(32, 32)
  .png()
  .toFile(resolve(__dirname, '../public/favicon.png'));

console.log('  ✅ favicon.png (现代浏览器支持)');
console.log('  ℹ️  如需 .ico 格式，请访问 https://realfavicongenerator.net/');
console.log('');

// ==================== 生成快捷方式图标 ====================
console.log('⚡ 生成快捷方式图标...');

const shortcuts = ['drawing', 'copywriting', 'ppt'];
for (const name of shortcuts) {
  await sharp(SOURCE_ICON)
    .resize(96, 96)
    .png({ quality: 100 })
    .toFile(resolve(__dirname, `../public/icons/shortcut-${name}.png`));
  console.log(`  ✅ shortcut-${name}.png`);
}

console.log('✅ 快捷方式图标生成完成 (3 个)');
console.log('');

// ==================== 生成 iOS 启动画面 ====================
console.log('🚀 生成 iOS 启动画面...');

// iPhone X/11 Pro (1125x2436)
await sharp(SOURCE_ICON)
  .resize(300, 300, { fit: 'contain', background: { r: 253, g: 251, b: 248, alpha: 1 } })
  .extend({
    top: 1068,
    bottom: 1068,
    left: 412,
    right: 413,
    background: { r: 253, g: 251, b: 248, alpha: 1 }
  })
  .png({ quality: 100 })
  .toFile(resolve(__dirname, '../public/splash/iphone-splash.png'));
console.log('  ✅ iphone-splash.png (1125x2436)');

// iPhone 11/XR (828x1792)
await sharp(SOURCE_ICON)
  .resize(260, 260, { fit: 'contain', background: { r: 253, g: 251, b: 248, alpha: 1 } })
  .extend({
    top: 766,
    bottom: 766,
    left: 284,
    right: 284,
    background: { r: 253, g: 251, b: 248, alpha: 1 }
  })
  .png({ quality: 100 })
  .toFile(resolve(__dirname, '../public/splash/iphone-plus-splash.png'));
console.log('  ✅ iphone-plus-splash.png (828x1792)');

console.log('✅ iOS 启动画面生成完成 (2 个尺寸)');
console.log('');

// ==================== 完成 ====================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎉 PWA 完整图标集生成完成！');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📊 生成统计：');
console.log('   ✅ 标准图标: 13 个');
console.log('   ✅ Maskable 图标: 2 个');
console.log('   ✅ 快捷方式图标: 3 个');
console.log('   ✅ iOS 启动画面: 2 个');
console.log('   ✅ Favicon: 1 个');
console.log('   ━━━━━━━━━━━━━━━━━━━━');
console.log('   📦 总计: 21 个文件');
console.log('');
console.log('📂 查看生成的文件：');
console.log('   ls -lh public/icons/');
console.log('   ls -lh public/splash/');
console.log('');
console.log('🚀 下一步：');
console.log('   git add public/ source-icon.png');
console.log('   git commit -m "chore: add PWA icons"');
console.log('   git push');
console.log('');
