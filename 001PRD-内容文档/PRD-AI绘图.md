# AI 绘图 PRD 文档

> 产品需求文档 | 版本 1.0 | 最后更新：2026-02-08

---

## 1. 概述

本文档详细记录 AI 绘图功能的所有提示词、风格配置和参数设置，便于统一维护、版本迭代和效果优化。

**功能定位**：通过文字描述或上传参考图片，使用 AI 生成符合用户需求的图像。

**代码文件**：`src/pages/AIDrawing.tsx`

---

## 2. 主要模式 (Main Modes)

### 2.1 模式列表

| ID | 名称 | 图标 | 说明 |
|---|---|---|---|
| free | 自由模式 | ✍️ | 无预设风格，完全自由创作 |
| sketch | 手绘风格 | 🖌️ | 手绘艺术风格（可搭配子风格） |

### 2.2 模式说明

#### 自由模式 (free)
- **用途**：用户完全自定义提示词，不添加任何预设风格
- **提示词**：无预设，直接使用用户输入
- **适用场景**：需要精确控制生成效果时使用

#### 手绘风格 (sketch)
- **用途**：生成手绘艺术风格的图像
- **提示词**：无基础预设，但可搭配设计子风格使用
- **适用场景**：需要艺术化、插画风格的图像

---

## 3. 设计风格 (Design Sub-Styles)

### 3.1 风格列表

所有模式下都可以选择以下设计风格，风格提示词会添加到用户输入的前面。

| ID | 名称 | 图标 | 英文提示词 |
|---|---|---|---|
| cute | 可爱风 | 🎀 | kawaii aesthetic, pastel colors, soft lighting, gentle features, dreamy atmosphere, delicate details, sweet and tender mood |
| chibi | Q版 | 🧸 | chibi proportions, oversized head 2:1 ratio, tiny body, exaggerated expressions, cartoon style, bold outlines, simplified features |
| infographic | 图文并茂 | 📊 | infographic style with clear text labels, readable typography, well-organized layout, text and graphics combined, informative design, clean fonts, proper text hierarchy |
| minimalist | 简约风 | ✨ | minimalist clean style, simple lines, elegant, less is more |
| watercolor | 水彩风 | 🎨 | watercolor style, soft washes, flowing colors, artistic |
| vintage | 复古风 | 📜 | vintage retro style, nostalgic, warm tones, classic feel |

### 3.2 风格详解

#### 🎀 可爱风 (Cute/Kawaii)
**核心特点**：
- 柔和的马卡龙色系（pastel colors）
- 柔光效果（soft lighting）
- 温柔细腻的特征（gentle features）
- 梦幻氛围感（dreamy atmosphere）
- 甜美温柔的情绪表达（sweet and tender mood）

**适用场景**：少女风插画、温馨场景、治愈系作品

**与 Q版 的区别**：可爱风注重整体氛围和色彩的柔和感，而非比例变形

---

#### 🧸 Q版 (Chibi)
**核心特点**：
- 夸张的头身比例（2:1 大头小身体）
- 简化的五官特征（simplified features）
- 夸张的表情（exaggerated expressions）
- 卡通化风格（cartoon style）
- 粗线条轮廓（bold outlines）

**适用场景**：Q版人物、卡通形象、表情包、游戏角色、漫画故事

**与可爱风的区别**：Q版强调比例的夸张变形和卡通化，而非氛围营造

**设计理念**：保持纯粹的可爱卡通风格，文字会自然融入画面（如对话框、标签等），无需强制添加

---

#### 📊 图文并茂 (Infographic)
**核心特点**：
- 清晰的文字标签（clear text labels）
- 易读的排版（readable typography）
- 组织良好的布局（well-organized layout）
- 图文结合（text and graphics combined）
- 信息化设计（informative design）
- 清晰的字体（clean fonts）
- 合理的文字层级（proper text hierarchy）

**适用场景**：旅游攻略、信息图表、教程说明、知识卡片、数据可视化

**与 Q版 的区别**：
- **Q版**：卡通漫画风格，文字自然融入画面（如对话框、场景标签）
- **图文并茂**：信息图表风格，强调文字的清晰度和排版规范，适合需要大量文字说明的场景

**使用建议**：
- 在提示词中明确说明需要的文字内容
- 例如："旅游攻略，包含标题、日期、景点名称、简短描述"
- 例如："产品介绍图，包含产品名称、特点、价格"

---

#### ✨ 简约风 (Minimalist)
**核心特点**：
- 简洁的线条（simple lines）
- 优雅的设计（elegant）
- 少即是多的理念（less is more）
- 留白艺术

**适用场景**：现代设计、品牌视觉、极简插画

---

#### 🎨 水彩风 (Watercolor)
**核心特点**：
- 柔和的水彩晕染（soft washes）
- 流动的色彩（flowing colors）
- 艺术感（artistic）
- 水彩纸质感

**适用场景**：艺术插画、文艺作品、手绘风格

---

#### 📜 复古风 (Vintage/Retro)
**核心特点**：
- 怀旧氛围（nostalgic）
- 温暖色调（warm tones）
- 经典感觉（classic feel）
- 复古质感

**适用场景**：复古海报、怀旧主题、年代感作品

---

## 4. 图片比例 (Aspect Ratios)

### 4.1 比例选项

| ID | 名称 | 说明 | 适用场景 |
|---|---|---|---|
| 1:1 | 正方形 | 1:1 | 社交媒体头像、Instagram 帖子 |
| 4:3 | 横向标准 | 4:3 | 电脑壁纸、演示文稿（默认） |
| 16:9 | 横向宽屏 | 16:9 | 视频封面、横版海报 |
| 9:16 | 竖向全屏 | 9:16 | 手机壁纸、短视频、女装搭配图 |

### 4.2 自动比例设置

某些风格会自动设置推荐比例：
- **女装搭配类风格**：自动设置为 `9:16`（竖向全屏）

### 4.3 默认设置

- **默认比例**：`4:3`（横向标准）

---

## 5. 线路选择 (Line Options)

### 5.1 线路列表

| ID | 名称 | 说明 |
|---|---|---|
| standard | 普通线路 | 标准生成速度和质量（默认） |
| premium | 优质线路 | 更高质量，可能速度稍慢 |

### 5.2 默认设置

- **默认线路**：`standard`（普通线路）

---

## 6. 语言选择 (Language Options)

### 6.1 语言列表

| ID | 名称 | 图标 |
|---|---|---|
| zh | 中文 | 🇨🇳 |
| en | English | 🇺🇸 |

### 6.2 默认设置

- **默认语言**：`zh`（中文）

---

## 7. 提示词优化

### 7.1 一键优化功能

用户点击「一键优化」按钮时，会在原有提示词后追加以下内容：

```
，高清，细节丰富，光影效果好
```

**代码位置**：`AIDrawing.tsx` 第 217 行

### 7.2 优化效果

- 提升图像清晰度
- 增强细节表现
- 改善光影效果

---

## 8. 数据库动态风格

### 8.1 加载机制

除了本地预设的风格外，系统还会从 Supabase 数据库动态加载更多风格。

**数据库查询条件**：
```sql
SELECT id, name, icon, prompt, description
FROM prompts
WHERE category = 'drawing'
  AND is_active = true
```

**代码位置**：`AIDrawing.tsx` 第 100-137 行

### 8.2 数据库字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| id | string | 风格唯一标识 |
| name | string | 风格名称（中文） |
| icon | string | 风格图标（emoji） |
| prompt | string | 英文提示词 |
| description | string | 风格描述（可选） |
| category | string | 分类（固定为 'drawing'） |
| is_active | boolean | 是否启用 |

### 8.3 已知数据库风格

根据现有 PRD 文档，数据库中可能包含以下风格：

| ID | 名称 | 描述 |
|---|---|---|
| poster | 海报设计 | 适合营销海报 |
| handdrawn | 手绘风格 | 艺术手绘效果 |
| anime | 动漫风格 | 二次元风格 |
| realistic | 写实风格 | 照片级真实感 |
| fashion-outfit | 女装搭配 | 平铺搭配图，自动补充配饰和鞋子 |
| outfit-model | 女装搭配模特图 | 层叠式平铺图，外套盖内搭 |

**注意**：这些风格的具体提示词存储在数据库中，需要查询数据库获取。

---

## 9. 图片上传功能

### 9.1 上传限制

- **最大数量**：5 张图片
- **支持格式**：所有图片格式（`image/*`）
- **自动压缩**：
  - 最大宽度：1024px
  - 最大高度：1024px
  - 压缩质量：80%

**代码位置**：`AIDrawing.tsx` 第 159-189 行

### 9.2 使用场景

- 上传参考图片进行风格迁移
- 上传素材进行二次创作
- 搭配预设风格使用（如女装搭配）

---

## 10. 提示词组合逻辑

### 10.1 最终提示词构建规则

```javascript
// 伪代码
finalPrompt = [
  selectedSketchSubStyle?.prompt,  // 设计风格提示词（如果选择）
  userPrompt,                       // 用户输入的提示词
  stylePreset?.prompt               // 数据库风格提示词（如果选择）
].filter(Boolean).join(', ')
```

**代码位置**：`AIDrawing.tsx` 第 228-236 行

### 10.2 优先级说明

1. **设计风格提示词**（最前）：如可爱风、Q版等
2. **用户输入**（中间）：用户自己写的描述
3. **数据库风格提示词**（最后）：如海报设计、女装搭配等

### 10.3 示例

**场景**：用户选择「可爱风」+ 输入「一只小猫」

**最终提示词**：
```
kawaii aesthetic, pastel colors, soft lighting, gentle features, dreamy atmosphere, delicate details, sweet and tender mood, 一只小猫
```

---

## 11. 技术参数

### 11.1 API 调用参数

```typescript
interface GenerateImageParams {
  prompt: string;              // 最终组合的提示词
  styleId?: string;            // 风格 ID（如果有预设提示词）
  aspectRatio: string;         // 图片比例（如 "4:3"）
  images?: string[];           // 参考图片（base64 数组）
  line: "standard" | "premium"; // 线路选择
}
```

**代码位置**：`AIDrawing.tsx` 第 238-244 行

### 11.2 相关代码文件

| 功能 | 文件路径 | 说明 |
|---|---|---|
| 主页面 | `src/pages/AIDrawing.tsx` | AI 绘图主界面 |
| 图片生成 | `src/lib/ai-image.ts` | API 调用逻辑 |
| 图片压缩 | `src/lib/image-utils.ts` | 图片处理工具 |

---

## 12. 用户交互流程

### 12.1 基础流程

1. 用户选择主要模式（自由模式 / 手绘风格）
2. 用户选择设计风格（可爱风 / Q版 / 简约风等）
3. 用户输入文字描述或上传参考图片
4. 用户选择图片比例（1:1 / 4:3 / 16:9 / 9:16）
5. 用户选择线路（普通 / 优质）
6. 用户点击「一键优化」（可选）
7. 用户点击发送按钮生成图片
8. 系统显示生成结果
9. 用户可以下载或重新生成

### 12.2 快捷操作

- **Enter 键**：发送生成（Shift+Enter 换行）
- **多图上传**：一次可选择多张图片（最多5张）
- **清除图片**：单张清除或全部清除

---

## 13. 移动端适配

### 13.1 触摸优化

- 所有按钮添加 `touch-target` 类，确保触摸区域足够大
- 下拉菜单支持触摸操作
- 图片预览支持触摸缩放

### 13.2 下载功能

**桌面端**：
- 直接下载到本地

**移动端**：
- 优先使用 Web Share API（支持保存到相册）
- 降级方案：打开新窗口显示图片，提示用户长按保存

**代码位置**：`AIDrawing.tsx` 第 266-331 行

---

## 14. 素材库功能

### 14.1 上传素材

用户可以通过「上传素材到素材库」按钮上传图片到素材库。

**代码位置**：`AIDrawing.tsx` 第 634-648 行

### 14.2 当前状态

- ⚠️ **待实现**：目前仅有 UI 按钮，实际上传逻辑待开发

---

## 15. 版本迭代记录

| 版本 | 日期 | 变更说明 |
|---|---|---|
| v1.0 | 2026-02-08 | 初始版本，整理所有提示词和配置 |
| v1.1 | 2026-02-08 | 优化可爱风和Q版提示词，增强区分度 |
| v1.2 | 2026-02-08 | 新增「图文并茂」风格，Q版保持纯粹可爱风格 |

**v1.1 详细变更**：

**可爱风 (Cute)** - 从：
```
cute kawaii style, adorable, soft colors, rounded shapes
```
改为：
```
kawaii aesthetic, pastel colors, soft lighting, gentle features,
dreamy atmosphere, delicate details, sweet and tender mood
```

**Q版 (Chibi)** - 从：
```
chibi style, super deformed, big head small body, playful
```
改为：
```
chibi proportions, oversized head 2:1 ratio, tiny body,
exaggerated expressions, cartoon style, bold outlines, simplified features
```

---

## 16. 待优化项

### 16.1 提示词优化

- [ ] 增加更多设计风格选项（如：赛博朋克、蒸汽波、像素风等）
- [ ] 优化各风格的英文提示词，提升生成质量
- [ ] 添加负面提示词（negative prompts）功能
- [ ] 支持提示词权重调整

### 16.2 功能增强

- [ ] 实现素材库上传和管理功能
- [ ] 支持批量生成（一次生成多张）
- [ ] 支持图片编辑（裁剪、调色、滤镜）
- [ ] 支持历史记录保存
- [ ] 支持收藏功能
- [ ] 支持分享到社交媒体
- [ ] 支持图生图（image-to-image）
- [ ] 支持局部重绘（inpainting）

### 16.3 性能优化

- [ ] 图片懒加载
- [ ] 生成进度显示
- [ ] 失败重试机制
- [ ] 缓存机制

### 16.4 用户体验

- [ ] 添加风格预览图
- [ ] 添加提示词示例
- [ ] 添加生成历史记录
- [ ] 添加快捷提示词标签

---

## 17. 相关文档

- [提示词管理 PRD](./PRD-提示词管理.md) - 全局提示词管理文档（如果存在）
- [AI 绘图代码](../src/pages/AIDrawing.tsx) - 功能实现代码
- [图片生成 API](../src/lib/ai-image.ts) - API 调用逻辑
- [图片工具库](../src/lib/image-utils.ts) - 图片处理工具

---

## 18. 常见问题 (FAQ)

### Q1: 为什么可爱风和Q版要分开？
A: 可爱风注重整体氛围和色彩的柔和感，适合温馨治愈的场景；Q版强调比例的夸张变形（大头小身体），适合卡通形象。两者风格差异明显。

### Q2: 如何选择合适的图片比例？
A:
- 社交媒体头像：1:1
- 电脑壁纸、PPT：4:3
- 视频封面：16:9
- 手机壁纸、短视频：9:16

### Q3: 普通线路和优质线路有什么区别？
A: 优质线路生成质量更高，但可能速度稍慢；普通线路速度快，质量标准。

### Q4: 上传的图片会被压缩吗？
A: 是的，为了提升性能，上传的图片会自动压缩到最大 1024px，质量 80%。

### Q5: 可以同时选择多个设计风格吗？
A: 目前只能选择一个设计风格，但可以在用户输入中手动添加更多风格描述。

---

> **文档维护**：项目开发团队
> **最后更新**：2026-02-08
> **文档版本**：v1.1
