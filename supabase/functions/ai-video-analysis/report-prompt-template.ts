/**
 * 视频分析报告生成 Prompt 模板
 * 基于薛辉短视频创作方法论
 */

interface VideoAnalysisResult {
  basic_info: {
    duration: number
    scene_count: number
    main_characters: string[]
  }
  topic_analysis: {
    topic_type: string
    pain_point: string
    target_audience: string
    score: number
  }
  script_type: {
    primary_type: string
    confidence: number
  }
  viral_elements: {
    detected: string[]
    missing: string[]
    highlight_moments: Array<{
      element: string
      timestamp: number
      description: string
    }>
  }
  hook_analysis: {
    first_3_seconds: string
    hook_type: string
    effectiveness_score: number
    suggestions: string[]
  }
  completion_prediction: {
    predicted_rate: number
    pacing_score: number
    info_density_score: number
    emotion_curve: string
  }
  strengths: string[]
  weaknesses: string[]
  optimization_suggestions: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    suggestion: string
  }>
  overall_scores: {
    viral_potential: number
    topic_quality: number
    script_structure: number
    visual_presentation: number
    completion_expectation: number
  }
}

export function generateReportPrompt(analysisResult: VideoAnalysisResult): string {
  const currentTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  // 按优先级排序建议
  const sortedSuggestions = [...analysisResult.optimization_suggestions].sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 }
    return priority[a.priority] - priority[b.priority]
  })

  return `你是一位专业的数据可视化设计师，需要生成一份短视频深度分析报告长图。

## 整体要求

**尺寸**：1080px 宽，自适应高度（预计 3000-4000px）
**主题**：深色科技风格
**配色方案**：
- 背景：深蓝灰色 (#0f1419, #1a1f2e)
- 主色调：科技蓝 (#3b82f6, #60a5fa)
- 强调色：荧光绿 (#10b981) 用于正面指标，警告红 (#ef4444) 用于负面指标
- 渐变：紫蓝渐变 (#8b5cf6 → #3b82f6) 用于标题和重点区域
- 文字：白色 (#ffffff) 主文字，灰色 (#9ca3af) 次要文字

**字体系统**：
- 标题 H1：32px，粗体，渐变色
- 标题 H2：24px，粗体，白色
- 标题 H3：18px，中粗，白色
- 正文：14px，常规，白色/灰色
- 数据：20-28px，粗体，强调色

**视觉风格参考**：类似专业的数据分析报告，包含雷达图、折线图、进度条、网格布局等多种数据可视化元素

---

## 布局结构（从上到下）

### Section 1: 封面区域 (高度: 400px)
- **背景**：深色渐变 + 微妙的网格纹理
- **标题**："视频深度拉片报告" - 居中，H1 字体，紫蓝渐变
- **副标题**："基于薛辉短视频创作方法论" - 居中，14px，灰色
- **基础信息卡片**（居中横向排列，3个卡片）：
  - 视频时长：${analysisResult.basic_info.duration}秒
  - 场景数量：${analysisResult.basic_info.scene_count}个
  - 分析时间：${currentTime}
- **装饰元素**：顶部和底部添加细线分隔

### Section 2: 选题分析 (高度: 500px)
**标题**："📊 选题分析" - H2，左对齐，带图标

**左侧（50%宽度）**：
- **选题类型**：大号标签，圆角矩形背景，蓝色
  - 内容：${analysisResult.topic_analysis.topic_type}
- **目标受众**：
  - 标签："目标人群"
  - 内容：${analysisResult.topic_analysis.target_audience}
- **痛点/爽点**：
  - 标签："触及痛点"
  - 内容：${analysisResult.topic_analysis.pain_point}

**右侧（50%宽度）**：
- **选题质量评分**：大号数字显示
  - 数字：${analysisResult.topic_analysis.score}/100
  - 字体：48px，粗体，渐变色
  - 下方：环形进度条（圆环图）展示分数
  - 颜色：${analysisResult.topic_analysis.score > 80 ? '绿色' : analysisResult.topic_analysis.score > 60 ? '蓝色' : '红色'}

### Section 3: 脚本类型识别 (高度: 300px)
**标题**："📝 脚本类型" - H2

**内容布局**：
- **主要类型**：大号徽章样式
  - 内容：${analysisResult.script_type.primary_type}
  - 样式：圆角矩形，渐变背景，白色文字，居中
  - 尺寸：200px x 80px
- **置信度**：进度条展示
  - 标签："识别置信度"
  - 进度条：${analysisResult.script_type.confidence}%
  - 颜色：蓝色渐变
  - 宽度：400px

**4种脚本类型说明**（小字，网格布局 2x2）：
- 晒过程：展示制作/体验过程
- 聊观点：表达个人看法
- 教知识：传授技能方法
- 讲故事：叙述完整故事

### Section 4: 综合评分雷达图 (高度: 500px)
**标题**："⭐ 综合评分" - H2

**雷达图**（居中，400px x 400px）：
- **5个维度**（按顺序排列）：
  1. 爆款潜力：${analysisResult.overall_scores.viral_potential}/100
  2. 选题质量：${analysisResult.overall_scores.topic_quality}/100
  3. 脚本结构：${analysisResult.overall_scores.script_structure}/100
  4. 视觉呈现：${analysisResult.overall_scores.visual_presentation}/100
  5. 完播预期：${analysisResult.overall_scores.completion_expectation}/100
- **样式**：
  - 背景网格：5层同心圆，灰色虚线
  - 数据区域：半透明蓝色填充 + 蓝色实线边框
  - 数据点：白色圆点标记
  - 轴线：灰色实线
  - 标签：白色文字，14px，标注在轴线末端

**图例**（雷达图下方）：
- 显示每个维度的具体分数
- 横向排列，5个小卡片
- 每个卡片：维度名称 + 分数 + 小型进度条

### Section 5: 爆款元素检测 (高度: 600px)
**标题**："🔥 爆款元素分析（薛辉8大元素）" - H2

**8大元素网格**（2行4列布局）：
每个元素卡片包含：
- 元素图标（emoji 或简单图标）
- 元素名称
- 检出状态：✓（绿色）或 ✗（灰色）

**元素列表**：
1. 反差 - ${analysisResult.viral_elements.detected.includes('反差') ? '✓ 已检出' : '✗ 未检出'}
2. 共鸣 - ${analysisResult.viral_elements.detected.includes('共鸣') ? '✓ 已检出' : '✗ 未检出'}
3. 新奇 - ${analysisResult.viral_elements.detected.includes('新奇') ? '✓ 已检出' : '✗ 未检出'}
4. 实用 - ${analysisResult.viral_elements.detected.includes('实用') ? '✓ 已检出' : '✗ 未检出'}
5. 争议 - ${analysisResult.viral_elements.detected.includes('争议') ? '✓ 已检出' : '✗ 未检出'}
6. 颜值 - ${analysisResult.viral_elements.detected.includes('颜值') ? '✓ 已检出' : '✗ 未检出'}
7. 情绪 - ${analysisResult.viral_elements.detected.includes('情绪') ? '✓ 已检出' : '✗ 未检出'}
8. 热点 - ${analysisResult.viral_elements.detected.includes('热点') ? '✓ 已检出' : '✗ 未检出'}

${
  analysisResult.viral_elements.highlight_moments.length > 0
    ? `
**高光时刻时间轴**：
- 横向时间轴，标注关键时刻
- 每个时刻：时间戳 + 元素标签 + 简短描述
${analysisResult.viral_elements.highlight_moments
  .map(
    (moment) =>
      `  - ${Math.floor(moment.timestamp / 60)}:${String(moment.timestamp % 60).padStart(2, '0')} | ${moment.element} | ${moment.description}`
  )
  .join('\n')}
`
    : ''
}

### Section 6: 钩子分析 (高度: 400px)
**标题**："🎣 开篇钩子分析（前3秒）" - H2

**左侧（60%宽度）**：
- **钩子内容描述**：
  - 标签："前3秒内容"
  - 内容：${analysisResult.hook_analysis.first_3_seconds}
  - 样式：白色文字，16px，行高 1.6
- **钩子类型**：
  - 标签样式显示：${analysisResult.hook_analysis.hook_type}
  - 颜色：蓝色背景，白色文字

**右侧（40%宽度）**：
- **有效性评分**：大号数字
  - 数字：${analysisResult.hook_analysis.effectiveness_score}/100
  - 字体：42px，粗体
  - 下方：仪表盘样式的半圆进度条
  - 颜色：${analysisResult.hook_analysis.effectiveness_score > 80 ? '绿色' : analysisResult.hook_analysis.effectiveness_score > 60 ? '蓝色' : '红色'}

**优化建议**（底部，全宽）：
${analysisResult.hook_analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Section 7: 完播率预测 (高度: 500px)
**标题**："📈 完播率预测" - H2

**中央大号显示**：
- **预测完播率**：超大号数字
  - 数字：${analysisResult.completion_prediction.predicted_rate}%
  - 字体：64px，粗体，渐变色
  - 样式：居中，带光晕效果

**3个子指标**（横向排列，柱状图）：
1. **节奏控制**：${analysisResult.completion_prediction.pacing_score}/100
   - 垂直柱状图，蓝色渐变
2. **信息密度**：${analysisResult.completion_prediction.info_density_score}/100
   - 垂直柱状图，绿色渐变
3. **情绪曲线**：${analysisResult.completion_prediction.emotion_curve}
   - 文字描述 + 简化的波形图示意

### Section 8: 优缺点对比 (高度: 500px)
**标题**："⚖️ 优缺点分析" - H2

**左右分栏布局**：

**左侧（50%宽度）- 优点**：
- 标题："✓ 优点" - 绿色
- 列表样式：
${analysisResult.strengths.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
- 每条前面加绿色对勾图标
- 背景：深绿色半透明卡片

**右侧（50%宽度）- 缺点**：
- 标题："✗ 缺点" - 红色
- 列表样式：
${analysisResult.weaknesses.map((w, i) => `  ${i + 1}. ${w}`).join('\n')}
- 每条前面加红色叉号图标
- 背景：深红色半透明卡片

### Section 9: 优化建议 (高度: 600px)
**标题**："💡 优化建议" - H2

**建议列表**（按优先级排序）：
${sortedSuggestions
  .map((suggestion, i) => {
    const priorityColor =
      suggestion.priority === 'high' ? '#ef4444' : suggestion.priority === 'medium' ? '#f59e0b' : '#6b7280'
    const priorityText =
      suggestion.priority === 'high' ? '高优先级' : suggestion.priority === 'medium' ? '中优先级' : '低优先级'
    return `
**建议 ${i + 1}**：
- 优先级：${priorityText}（标签样式，颜色：${priorityColor}）
- 类别：${suggestion.category}
- 具体建议：${suggestion.suggestion}
`
  })
  .join('\n')}

**样式**：
- 每条建议：独立卡片，深色背景，圆角边框
- 优先级标签：彩色徽章，右上角
- 类别：小标签，灰色
- 建议内容：白色文字，16px

### Section 10: 底部信息 (高度: 150px)
**背景**：深色渐变

**内容**（居中）：
- **方法论标识**："基于薛辉短视频创作方法论"
  - 字体：18px，灰色
- **生成时间**：${currentTime}
  - 字体：12px，深灰色
- **版权信息**："AI 视频分析报告 | 仅供参考"
  - 字体：12px，深灰色

---

## 设计细节要求

1. **间距系统**：
   - Section 之间：40px 间距
   - 卡片内边距：24px
   - 文字行高：1.5-1.8

2. **圆角系统**：
   - 大卡片：16px 圆角
   - 小卡片/按钮：8px 圆角
   - 标签：4px 圆角

3. **阴影效果**：
   - 卡片：0 4px 6px rgba(0, 0, 0, 0.3)
   - 悬浮元素：0 8px 16px rgba(0, 0, 0, 0.4)

4. **图表规范**：
   - 所有图表使用一致的配色方案
   - 数据标签清晰可读
   - 图例位置统一（通常在图表下方或右侧）

5. **响应式考虑**：
   - 虽然是长图，但要确保在手机端查看时文字清晰可读
   - 最小字体不小于 12px

---

## 输出要求

请严格按照以上规范生成一张专业的视频分析报告长图。确保：
1. 所有数据准确展示
2. 视觉层级清晰
3. 色彩搭配和谐
4. 信息密度适中
5. 整体风格统一

生成的图片应该是一张完整的长图，可以直接保存和分享。`
}
