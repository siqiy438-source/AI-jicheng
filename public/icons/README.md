# PWA 图标说明

请在此目录下放置以下图标文件：

## 必需的图标

1. **icon-192.png** (192x192 像素)
   - 用于应用图标和启动画面
   - 建议使用品牌主色调背景

2. **icon-512.png** (512x512 像素)
   - 用于高分辨率设备
   - 建议使用品牌主色调背景

## 图标设计建议

- 使用简洁的图标设计
- 确保在小尺寸下清晰可辨
- 使用品牌色彩（主色：#D97706）
- 图标应该是正方形，带有适当的内边距
- 支持 maskable 属性，确保在不同设备上显示良好

## 快速生成图标

你可以使用以下工具生成 PWA 图标：
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## 临时方案

如果暂时没有图标，可以使用以下命令生成占位符：
```bash
# 使用 ImageMagick 生成简单的占位符图标
convert -size 192x192 xc:#D97706 -gravity center -pointsize 80 -fill white -annotate +0+0 "AI" icon-192.png
convert -size 512x512 xc:#D97706 -gravity center -pointsize 200 -fill white -annotate +0+0 "AI" icon-512.png
```
