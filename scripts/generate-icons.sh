#!/bin/bash

# PWA 图标生成脚本
# 需要安装 ImageMagick: brew install imagemagick

echo "🎨 生成 PWA 图标..."

# 创建图标目录
mkdir -p public/icons

# 品牌主色
COLOR="#D97706"

# 生成 192x192 图标
convert -size 192x192 xc:"$COLOR" \
  -gravity center \
  -pointsize 80 \
  -fill white \
  -font "Arial-Bold" \
  -annotate +0+0 "AI" \
  -bordercolor "$COLOR" \
  -border 20 \
  public/icons/icon-192.png

echo "✅ 已生成 icon-192.png"

# 生成 512x512 图标
convert -size 512x512 xc:"$COLOR" \
  -gravity center \
  -pointsize 220 \
  -fill white \
  -font "Arial-Bold" \
  -annotate +0+0 "AI" \
  -bordercolor "$COLOR" \
  -border 50 \
  public/icons/icon-512.png

echo "✅ 已生成 icon-512.png"

echo ""
echo "🎉 PWA 图标生成完成！"
echo ""
echo "📝 提示："
echo "  - 图标已保存到 public/icons/ 目录"
echo "  - 建议使用专业设计工具创建更精美的图标"
echo "  - 可以使用 https://realfavicongenerator.net/ 生成完整的图标集"
