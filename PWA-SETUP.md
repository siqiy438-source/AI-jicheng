# 📱 PWA 配置指南

本项目已完整配置 PWA（渐进式 Web 应用）功能，支持安装到桌面、离线访问和原生应用体验。

---

## 🎯 功能特性

✅ **独立显示模式（Standalone）** - 隐藏浏览器地址栏，像原生 App 一样全屏显示  
✅ **iPhone 全屏支持** - 完美适配刘海屏和底部横条  
✅ **桌面图标** - 添加到主屏幕后显示精美图标  
✅ **离线访问** - 缓存关键资源，无网络也能打开  
✅ **快捷方式** - 长按图标可快速跳转到绘图/文案/PPT 功能  
✅ **自动更新** - 检测新版本并提示用户刷新  

---

## 📂 文件结构

```
AI-jicheng/
├── index.html                 # PWA meta 标签和图标链接
├── src/
│   └── main.tsx              # Service Worker 注册代码
├── public/
│   ├── manifest.json         # PWA 配置文件（核心）
│   ├── sw.js                 # Service Worker 脚本
│   ├── favicon.ico           # 浏览器图标
│   ├── offline.html          # 离线提示页面
│   ├── icons/                # 所有图标文件
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-72.png
│   │   ├── icon-96.png
│   │   ├── icon-120.png      # iOS
│   │   ├── icon-128.png
│   │   ├── icon-144.png
│   │   ├── icon-152.png      # iOS iPad
│   │   ├── icon-167.png      # iOS iPad Pro
│   │   ├── icon-180.png      # iOS iPhone
│   │   ├── icon-192.png
│   │   ├── icon-384.png
│   │   ├── icon-512.png
│   │   ├── icon-maskable-192.png  # Android 自适应
│   │   ├── icon-maskable-512.png
│   │   ├── shortcut-drawing.png   # 快捷方式图标
│   │   ├── shortcut-copywriting.png
│   │   └── shortcut-ppt.png
│   └── splash/               # iOS 启动画面
│       ├── iphone-splash.png
│       └── iphone-plus-splash.png
└── scripts/
    └── generate-icons.sh     # 图标生成脚本
```

---

## 🚀 快速开始

### 1️⃣ 生成图标

项目已包含自动生成脚本，运行以下命令：

```bash
# 需要先安装 ImageMagick
# macOS:
brew install imagemagick

# Ubuntu/Debian:
sudo apt-get install imagemagick

# 生成所有图标
chmod +x scripts/generate-icons.sh
./scripts/generate-icons.sh
```

**生成的图标包括：**
- 13 个标准尺寸图标（16px - 512px）
- 2 个 Android Maskable 自适应图标
- 3 个快捷方式图标
- 2 个 iOS 启动画面
- 1 个 favicon.ico

---

### 2️⃣ 本地测试

PWA 需要 HTTPS 或 localhost 才能正常工作：

```bash
# 开发环境（自动支持）
npm run dev

# 生产构建测试
npm run build
npm run preview
```

打开浏览器控制台，确认 Service Worker 注册成功：
```
✅ PWA Service Worker 注册成功: http://localhost:4173/
```

---

### 3️⃣ 验证 PWA 配置

#### **Chrome 桌面版：**
1. 打开 Chrome DevTools（F12）
2. 切换到 **Application** 标签
3. 左侧找到 **Manifest** - 检查配置是否正确
4. 左侧找到 **Service Workers** - 确认状态为 "activated and is running"
5. 点击右上角 **+** 按钮测试安装到桌面

#### **iPhone Safari：**
1. 访问网站
2. 点击底部分享按钮 <svg width="20" height="20"><rect fill="#007AFF"/></svg>
3. 向下滚动找到「添加到主屏幕」
4. 点击「添加」
5. 返回主屏幕，找到新增的 App 图标
6. 点击打开，应该是全屏显示（无地址栏）

#### **Android Chrome：**
1. 访问网站
2. 浏览器会自动弹出「安装应用」横幅
3. 或点击右上角 ⋮ → 「安装应用」/「添加到主屏幕」

---

## 🔧 核心配置说明

### `manifest.json` 关键字段

```json
{
  "name": "AI 创作平台 - 灵犀",           // 完整名称
  "short_name": "AI创作",                 // 主屏幕显示名称
  "display": "standalone",                // 独立模式（全屏）
  "theme_color": "#D97706",               // 状态栏颜色
  "background_color": "#FDFBF8",          // 启动背景色
  "orientation": "portrait-primary",       // 竖屏优先
  "start_url": "/",                        // 启动 URL
  "scope": "/",                            // PWA 作用域
  "icons": [...],                          // 图标数组
  "shortcuts": [...]                       // 快捷方式（长按图标）
}
```

### `index.html` iOS 配置

```html
<!-- 全屏模式 -->
<meta name="apple-mobile-web-app-capable" content="yes" />

<!-- 状态栏样式：black-translucent（半透明黑色，内容延伸到状态栏下） -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

<!-- 主屏幕图标名称 -->
<meta name="apple-mobile-web-app-title" content="AI创作" />

<!-- 不同设备的图标 -->
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
```

### `sw.js` Service Worker

**缓存策略：网络优先，失败时使用缓存**

```javascript
// 安装时缓存核心资源
self.addEventListener('install', ...)

// 激活时清理旧缓存
self.addEventListener('activate', ...)

// 请求拦截：先尝试网络，失败则用缓存
self.addEventListener('fetch', ...)
```

---

## 📱 用户体验优化

### ✅ 已实现的功能

| 功能 | 说明 |
|---|---|
| **独立窗口** | 隐藏浏览器 UI，像原生 App |
| **安全区域适配** | 避开 iPhone 刘海和底部横条 |
| **图标圆角** | 自动适配 iOS 圆角和 Android Maskable |
| **启动画面** | iOS 启动时显示 Logo 而非白屏 |
| **离线提示** | 断网时显示友好的离线页面 |
| **自动更新** | 检测到新版本时提示刷新 |
| **快捷方式** | 长按图标可直达常用功能 |

### 🎨 图标设计建议

当前图标使用脚本自动生成，**强烈建议**使用专业设计：

1. **图标尺寸：**
   - 最小设计画布：512x512px
   - 导出所有尺寸（16px - 512px）

2. **Android Maskable 图标：**
   - 安全区域：中心 80% 区域放置内容
   - 使用 https://maskable.app/ 测试

3. **iOS 图标：**
   - 不要带圆角（系统会自动添加）
   - 不要带透明背景
   - 建议纯色背景 + Logo

4. **推荐工具：**
   - Figma / Sketch / Adobe XD
   - https://realfavicongenerator.net/ (在线生成)

---

## 🧪 测试清单

部署前请逐项测试：

### 桌面端（Chrome）
- [ ] 地址栏出现安装图标 ➕
- [ ] 点击安装后能打开独立窗口
- [ ] 断网后仍能访问首页
- [ ] DevTools → Application → Manifest 无错误
- [ ] Service Worker 状态为 "activated"

### iPhone Safari
- [ ] 「添加到主屏幕」后图标显示正常
- [ ] 图标名称为「AI创作」
- [ ] 打开后是全屏模式（无地址栏）
- [ ] 状态栏样式正确（半透明黑色）
- [ ] 刘海/底部横条区域无遮挡

### Android Chrome
- [ ] 自动弹出「安装应用」提示
- [ ] 安装后图标显示正常（圆角自适应）
- [ ] 长按图标可看到快捷方式（绘图/文案/PPT）
- [ ] 全屏模式正常

---

## 🐛 常见问题

### Q1: 为什么 iPhone 上「添加到主屏幕」后图标是白色的？

**原因：** 图标文件路径错误或图标未生成。

**解决：**
```bash
# 重新生成图标
./scripts/generate-icons.sh

# 检查文件是否存在
ls -la public/icons/icon-180.png
```

### Q2: Service Worker 注册失败？

**原因：** 必须在 HTTPS 或 localhost 环境。

**解决：**
- 开发环境用 `npm run dev`（自动 localhost）
- 生产环境必须部署到 HTTPS 域名

### Q3: iPhone 上打开后还是显示地址栏？

**原因：** 可能通过 Safari 打开而非主屏幕图标。

**解决：**
1. 确保是从主屏幕图标打开（不是 Safari）
2. 检查 `apple-mobile-web-app-capable` 是否设置为 `yes`

### Q4: 修改了 manifest.json 但没生效？

**原因：** 浏览器缓存了旧配置。

**解决：**
1. 完全卸载 PWA（删除主屏幕图标）
2. 清除浏览器缓存
3. 重新安装

### Q5: 快捷方式（Shortcuts）在 iPhone 上看不到？

**答案：** iOS Safari 目前**不支持** PWA Shortcuts。

这是 iOS 的限制，只有 Android 支持。

---

## 🚀 部署建议

### Vercel / Netlify
- ✅ 自动 HTTPS
- ✅ 支持 Service Worker
- ✅ 推荐使用

### 自建服务器
- ⚠️ 必须配置 HTTPS（可用 Let's Encrypt）
- ⚠️ 确保 `sw.js` 在根路径可访问
- ⚠️ 配置正确的 MIME 类型

### Nginx 配置示例

```nginx
# 确保 Service Worker 的 MIME 类型
location /sw.js {
    add_header Content-Type application/javascript;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# manifest.json
location /manifest.json {
    add_header Content-Type application/manifest+json;
}
```

---

## 📚 相关资源

- [MDN PWA 指南](https://developer.mozilla.org/zh-CN/docs/Web/Progressive_web_apps)
- [Web.dev PWA 教程](https://web.dev/progressive-web-apps/)
- [Maskable 图标编辑器](https://maskable.app/)
- [PWA 图标生成器](https://realfavicongenerator.net/)
- [iOS PWA 支持清单](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

## ✅ 完成标志

如果以下全部打勾，说明 PWA 配置完整：

- [x] `manifest.json` 配置正确
- [x] `sw.js` Service Worker 已创建
- [x] `index.html` 添加所有 meta 标签
- [x] `main.tsx` 注册 Service Worker
- [ ] 图标文件已生成（运行 `./scripts/generate-icons.sh`）
- [ ] Chrome 桌面端测试通过
- [ ] iPhone Safari 测试通过
- [ ] Android Chrome 测试通过

---

**🎉 配置完成后，你的网站就可以像原生 App 一样安装到用户的手机桌面了！**
