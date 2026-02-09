#!/bin/bash

# ==================== PWA 图标生成脚本 ====================
# 需要安装 ImageMagick: brew install imagemagick
# 或 apt-get install imagemagick (Linux)

echo "🎨 开始生成 PWA 完整图标集..."
echo ""

# 创建必要的目录
mkdir -p public/icons
mkdir -p public/splash

# 品牌配色
PRIMARY_COLOR="#D97706"    # 琥珀色
BG_COLOR="#FDFBF8"         # 暖白色
TEXT_COLOR="#FFFFFF"       # 白色

# 图标文字
ICON_TEXT="灵犀"

# ==================== 函数定义 ====================

# 生成圆角矩形图标
generate_icon() {
  local size=$1
  local filename=$2
  local fontsize=$3
  
  echo "  ⏳ 生成 ${size}x${size} ($filename)..."
  
  convert -size ${size}x${size} xc:"$PRIMARY_COLOR" \
    -gravity center \
    -pointsize ${fontsize} \
    -fill "$TEXT_COLOR" \
    -font "PingFang-SC-Bold" \
    -annotate +0+0 "$ICON_TEXT" \
    \( +clone -alpha extract \
       -draw "fill black polygon 0,0 0,20 20,0 fill white circle 20,20 20,0" \
       \( +clone -flip \) -compose Multiply -composite \
       \( +clone -flop \) -compose Multiply -composite \
    \) -alpha off -compose CopyOpacity -composite \
    -quality 100 \
    "public/icons/${filename}"
}

# 生成 Maskable 图标（带安全边距）
generate_maskable_icon() {
  local size=$1
  local filename=$2
  local fontsize=$3
  local padding=$(($size / 5))  # 20% 安全边距
  
  echo "  ⏳ 生成 Maskable ${size}x${size} ($filename)..."
  
  convert -size ${size}x${size} xc:"$PRIMARY_COLOR" \
    -gravity center \
    -pointsize ${fontsize} \
    -fill "$TEXT_COLOR" \
    -font "PingFang-SC-Bold" \
    -annotate +0+0 "$ICON_TEXT" \
    -bordercolor "$PRIMARY_COLOR" \
    -border ${padding} \
    -resize ${size}x${size}! \
    -quality 100 \
    "public/icons/${filename}"
}

# ==================== 生成标准图标 ====================
echo "📱 生成标准 PWA 图标..."

# 生成各种尺寸的图标
generate_icon 16 "icon-16.png" 8
generate_icon 32 "icon-32.png" 16
generate_icon 72 "icon-72.png" 32
generate_icon 96 "icon-96.png" 42
generate_icon 120 "icon-120.png" 52    # iOS
generate_icon 128 "icon-128.png" 56
generate_icon 144 "icon-144.png" 64
generate_icon 152 "icon-152.png" 68    # iOS iPad
generate_icon 167 "icon-167.png" 74    # iOS iPad Pro
generate_icon 180 "icon-180.png" 80    # iOS iPhone
generate_icon 192 "icon-192.png" 84
generate_icon 384 "icon-384.png" 168
generate_icon 512 "icon-512.png" 220

echo "✅ 标准图标生成完成"
echo ""

# ==================== 生成 Maskable 图标 ====================
echo "🎭 生成 Maskable 图标（Android 自适应）..."

generate_maskable_icon 192 "icon-maskable-192.png" 64
generate_maskable_icon 512 "icon-maskable-512.png" 180

echo "✅ Maskable 图标生成完成"
echo ""

# ==================== 生成 Favicon ====================
echo "🔖 生成 Favicon..."

convert public/icons/icon-32.png public/favicon.ico

echo "✅ Favicon 生成完成"
echo ""

# ==================== 生成快捷方式图标 ====================
echo "⚡ 生成快捷方式图标..."

# AI 绘图快捷方式图标（紫色）
convert -size 96x96 xc:"#8B5CF6" \
  -gravity center \
  -pointsize 42 \
  -fill white \
  -font "Arial-Bold" \
  -annotate +0+0 "🎨" \
  public/icons/shortcut-drawing.png

# AI 文案快捷方式图标（橙色）
convert -size 96x96 xc:"#F97316" \
  -gravity center \
  -pointsize 42 \
  -fill white \
  -font "Arial-Bold" \
  -annotate +0+0 "📝" \
  public/icons/shortcut-copywriting.png

# AI PPT 快捷方式图标（蓝色）
convert -size 96x96 xc:"#3B82F6" \
  -gravity center \
  -pointsize 42 \
  -fill white \
  -font "Arial-Bold" \
  -annotate +0+0 "📊" \
  public/icons/shortcut-ppt.png

echo "✅ 快捷方式图标生成完成"
echo ""

# ==================== 生成 iOS 启动画面（可选） ====================
echo "🚀 生成 iOS 启动画面..."

# iPhone X/11 Pro (1125x2436)
convert -size 1125x2436 xc:"$BG_COLOR" \
  -gravity center \
  -pointsize 180 \
  -fill "$PRIMARY_COLOR" \
  -font "PingFang-SC-Bold" \
  -annotate +0+0 "$ICON_TEXT" \
  public/splash/iphone-splash.png

# iPhone 11/XR (828x1792)
convert -size 828x1792 xc:"$BG_COLOR" \
  -gravity center \
  -pointsize 140 \
  -fill "$PRIMARY_COLOR" \
  -font "PingFang-SC-Bold" \
  -annotate +0+0 "$ICON_TEXT" \
  public/splash/iphone-plus-splash.png

echo "✅ iOS 启动画面生成完成"
echo ""

# ==================== 完成 ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 PWA 完整图标集生成完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 生成的文件："
echo "   - public/icons/icon-*.png (13 个标准尺寸)"
echo "   - public/icons/icon-maskable-*.png (2 个自适应)"
echo "   - public/icons/shortcut-*.png (3 个快捷方式)"
echo "   - public/splash/*.png (2 个 iOS 启动画面)"
echo "   - public/favicon.ico (浏览器图标)"
echo ""
echo "📝 下一步操作："
echo "   1. 检查 public/icons/ 目录确认图标已生成"
echo "   2. 在浏览器中测试 PWA 安装功能"
echo "   3. 在 iPhone 上测试「添加到主屏幕」"
echo "   4. （可选）使用专业设计工具优化图标设计"
echo ""
echo "🔗 推荐工具："
echo "   - https://realfavicongenerator.net/ (在线图标生成器)"
echo "   - https://maskable.app/ (Maskable 图标编辑器)"
echo ""
