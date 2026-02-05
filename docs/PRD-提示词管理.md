# 提示词管理 PRD

> 产品需求文档 | 版本 1.0 | 最后更新：2026-02-05

---

## 1. 概述

本文档用于集中管理 AI-jicheng 项目中所有功能模块的提示词（Prompts），便于统一维护、版本迭代和效果优化。

---

## 2. AI 文案 (AICopywriting)

### 2.1 智能体列表

| ID | 名称 | 图标 | 描述 |
|---|---|---|---|
| xiaohongshu | 小红书文案 | 📕 | 爆款笔记、种草文案 |
| douyin | 抖音文案 | 🎵 | 短视频脚本、口播文案 |
| weixin | 公众号文案 | 💚 | 深度文章、推文写作 |
| ad | 广告文案 | 📢 | 营销广告、促销文案 |
| product | 产品文案 | 🏷️ | 详情页、卖点提炼 |
| general | 通用写作 | ✏️ | 各类文案通用助手 |

### 2.2 优化提示词

用户点击「一键优化」时追加的提示词后缀：

#### 小红书 (xiaohongshu)
```
，要求：吸引眼球的标题、适当使用emoji、口语化表达、加入互动引导
```

#### 抖音 (douyin)
```
，要求：开头3秒抓住注意力、节奏感强、口语化、有记忆点
```

#### 公众号 (weixin)
```
，要求：深度有价值、逻辑清晰、金句点睛、引发思考
```

#### 广告 (ad)
```
，要求：突出卖点、制造紧迫感、明确行动号召、简洁有力
```

#### 产品 (product)
```
，要求：突出核心卖点、解决用户痛点、场景化描述、数据支撑
```

#### 通用 (general)
```
，要求：表达清晰、结构完整、语言流畅、重点突出
```

### 2.3 系统提示词 (System Prompts)

> 待定义 - 发送给 AI 模型的系统级指令

#### 小红书文案智能体
```
你是一位资深的小红书运营专家，擅长撰写爆款笔记。你的文案风格需要：
- 标题吸睛，善用数字和悬念
- 大量使用 emoji 增加可读性
- 口语化表达，像朋友聊天
- 结尾引导互动（点赞、收藏、评论）
- 添加相关话题标签
```

#### 抖音文案智能体
```
你是一位专业的抖音内容策划，擅长创作短视频脚本。你的文案需要：
- 开头3秒必须有强烈 hook
- 节奏紧凑，句子简短有力
- 口播自然，不要书面语
- 设置记忆点和金句
- 结尾有明确的行动号召
```

#### 公众号文案智能体
```
你是一位资深的公众号写手，擅长深度内容创作。你的文案需要：
- 标题有深度且引发好奇
- 逻辑清晰，层层递进
- 论据充分，有案例支撑
- 善用金句，提升分享欲
- 结尾引发读者思考或行动
```

#### 广告文案智能体
```
你是一位资深广告文案，擅长营销转化类内容。你的文案需要：
- 直击痛点，引发共鸣
- 突出产品核心卖点
- 制造紧迫感和稀缺性
- 行动号召清晰明确
- 语言简洁有力
```

#### 产品文案智能体
```
你是一位电商产品文案专家，擅长详情页和卖点提炼。你的文案需要：
- 精准提炼产品核心卖点
- 用场景化描述解决用户痛点
- 用数据和对比增强说服力
- 突出品质保障和信任背书
- 清晰的规格参数展示
```

#### 通用写作智能体
```
你是一位专业的文案助手，擅长各类文字内容创作。你需要：
- 根据用户需求灵活调整风格
- 结构清晰，逻辑通顺
- 语言流畅，表达准确
- 重点突出，层次分明
```

---

## 3. AI 海报 (AIPoster)

### 3.1 模板列表

| ID | 名称 | 图标 | 描述 |
|---|---|---|---|
| ecommerce | 电商海报 | 🛒 | 促销、活动、新品上市 |
| social | 社交媒体 | 📱 | 小红书、朋友圈、公众号 |
| event | 活动海报 | 🎉 | 展会、会议、活动宣传 |
| brand | 品牌海报 | 🏢 | 品牌形象、企业宣传 |
| festival | 节日海报 | 🎊 | 节日祝福、节庆活动 |
| food | 美食海报 | 🍔 | 餐饮、美食、菜单 |

### 3.2 优化提示词

#### 电商海报 (ecommerce)
```
，要求：突出促销信息、价格醒目、产品清晰、引导下单
```

#### 社交媒体 (social)
```
，要求：吸引眼球、适合分享、比例适配、风格年轻化
```

#### 活动海报 (event)
```
，要求：活动主题突出、时间地点清晰、视觉冲击力强
```

#### 品牌海报 (brand)
```
，要求：品牌调性统一、专业大气、logo突出
```

#### 节日海报 (festival)
```
，要求：节日氛围浓厚、祝福语醒目、喜庆热闹
```

#### 美食海报 (food)
```
，要求：色彩诱人、食欲感强、主体突出
```

### 3.3 系统提示词 (System Prompts)

> 用于图像生成模型的提示词模板

#### 电商海报
```
Create a professional e-commerce promotional poster with the following requirements:
- Clear product display as the main focus
- Prominent price and discount information
- Eye-catching sales badge or promotion tag
- Strong call-to-action elements
- Clean and modern layout
- Brand-appropriate color scheme

User requirement: {user_prompt}
```

#### 社交媒体海报
```
Create a trendy social media poster optimized for sharing with:
- Eye-catching visual design
- Young and vibrant aesthetic
- Clear and readable text elements
- Aspect ratio suitable for {platform}
- Modern design trends
- Shareable and engaging content

User requirement: {user_prompt}
```

#### 活动海报
```
Create an event promotional poster featuring:
- Clear event name/theme as headline
- Date, time, and location prominently displayed
- Strong visual impact
- Professional yet inviting design
- Clear information hierarchy

User requirement: {user_prompt}
```

#### 品牌海报
```
Create a professional brand poster with:
- Consistent brand identity
- Premium and sophisticated feel
- Logo prominently featured
- Clean and minimal design
- Professional typography
- Brand color palette

User requirement: {user_prompt}
```

#### 节日海报
```
Create a festive holiday poster with:
- Strong holiday atmosphere
- Celebratory and joyful mood
- Prominent greeting message
- Traditional yet modern design elements
- Warm and inviting color scheme

Holiday: {festival_name}
User requirement: {user_prompt}
```

#### 美食海报
```
Create an appetizing food poster with:
- Vibrant and appealing food photography style
- Strong appetite appeal
- Main dish as the focal point
- Fresh and delicious visual presentation
- Complementary color scheme

User requirement: {user_prompt}
```

---

## 4. AI 绘图 (AIDrawing)

### 4.1 风格预设

| ID | 名称 | 描述 |
|---|---|---|
| poster | 海报设计 | 适合营销海报 |
| handdrawn | 手绘风格 | 艺术手绘效果 |
| anime | 动漫风格 | 二次元风格 |
| realistic | 写实风格 | 照片级真实感 |

### 4.2 优化提示词

#### 通用优化后缀
```
，高清，细节丰富，光影效果好
```

### 4.3 系统提示词 (System Prompts)

#### 海报设计
```
Professional poster design, commercial quality, clean composition, strong visual hierarchy, {user_prompt}, high resolution, rich details, excellent lighting
```

#### 手绘风格
```
Hand-drawn illustration style, artistic sketch, pencil/watercolor texture, {user_prompt}, high resolution, rich details, excellent lighting
```

#### 动漫风格
```
Anime style illustration, Japanese animation aesthetic, vibrant colors, expressive characters, {user_prompt}, high resolution, rich details, excellent lighting
```

#### 写实风格
```
Photorealistic rendering, ultra-realistic, professional photography quality, {user_prompt}, high resolution, rich details, excellent lighting, 8K
```

---

## 5. 提示词最佳实践

### 5.1 编写原则

1. **明确性**：清晰描述期望的输出结果
2. **具体性**：提供具体的要求和约束条件
3. **结构化**：按逻辑顺序组织提示词内容
4. **可测试**：便于 A/B 测试和效果对比

### 5.2 变量规范

| 变量 | 说明 | 示例 |
|---|---|---|
| `{user_prompt}` | 用户输入的原始需求 | "双十一促销活动" |
| `{platform}` | 目标平台 | "小红书" / "抖音" |
| `{festival_name}` | 节日名称 | "春节" / "中秋节" |
| `{brand_name}` | 品牌名称 | "XXX品牌" |
| `{product_name}` | 产品名称 | "护肤精华" |

### 5.3 版本迭代记录

| 版本 | 日期 | 变更说明 |
|---|---|---|
| v1.0 | 2026-02-05 | 初始版本，整理现有提示词 |

---

## 6. 待扩展功能

以下功能模块的提示词待后续补充：

- [ ] AI 视频生成
- [ ] AI 音乐生成
- [ ] AI 配音
- [ ] AI 数字人
- [ ] AI 翻译
- [ ] AI 客服

---

## 7. 维护说明

### 7.1 更新流程

1. 在本文档中修改/添加提示词
2. 同步更新对应的代码文件
3. 记录版本变更日志
4. 测试验证效果

### 7.2 相关代码文件

| 功能 | 文件路径 |
|---|---|
| AI 文案 | `src/pages/AICopywriting.tsx` |
| AI 海报 | `src/pages/AIPoster.tsx` |
| AI 绘图 | `src/pages/AIDrawing.tsx` |

---

> 文档维护：项目开发团队
