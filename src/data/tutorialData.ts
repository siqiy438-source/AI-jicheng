export interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
}

export interface ToolTutorial {
  id: string;
  name: string;
  category: "fashion" | "creative";
  iconSrc: string;
  route: string;
  summary: string;
  tutorialImage: string;
  steps: TutorialStep[];
}

export const tutorials: ToolTutorial[] = [
  // ===== 服装工具 =====
  {
    id: "fashion-outfit",
    name: "平铺/摆拍生成",
    category: "fashion",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    route: "/fashion-outfit",
    summary: "上传服饰单品，快速生成平铺或摆拍展示图。",
    tutorialImage: "/tutorials/fashion-outfit.webp",
    steps: [
      { stepNumber: 1, title: "上传服装图片", description: "点击上传区域，选择 1-3 张服装单品图片。支持 JPG、PNG、WebP 格式。" },
      { stepNumber: 2, title: "选择展示风格", description: "在风格选项中选择「平铺展示」或「人形摆拍」，两种风格呈现不同的展示效果。" },
      { stepNumber: 3, title: "选择画质与比例", description: "选择输出线路（灵犀极速版/Pro/2K/4K）和画面比例（推荐 9:16 竖版，适合电商详情页）。" },
      { stepNumber: 4, title: "生成并下载", description: "点击「开始生成」按钮，等待 AI 生成完成后，点击下载按钮保存图片到本地。" },
    ],
  },
  {
    id: "fashion-model-outfit",
    name: "模特生成",
    category: "fashion",
    iconSrc: "/icons/fashion-model-custom.webp",
    route: "/fashion-model-outfit",
    summary: "上传服装单品，智能生成模特上身效果图。",
    tutorialImage: "/tutorials/fashion-model-outfit.webp",
    steps: [
      { stepNumber: 1, title: "上传服装图片", description: "上传需要试穿展示的服装单品图片，建议使用白底或纯色背景的图片效果更佳。" },
      { stepNumber: 2, title: "选择模特风格", description: "从 5 种模特风格中选择：镜面自拍、标准模特、氛围半身照、氛围特写、室内模特。" },
      { stepNumber: 3, title: "调整参数", description: "选择画质线路和输出比例，根据使用场景选择合适的尺寸。" },
      { stepNumber: 4, title: "生成并下载", description: "点击生成，AI 将自动完成模特上身效果图，生成后可直接下载。" },
    ],
  },
  {
    id: "fashion-detail-focus",
    name: "AI 细节特写",
    category: "fashion",
    iconSrc: "/icons/fashion-outfit-custom.webp",
    route: "/fashion-detail-focus",
    summary: "上传单品，自动生成主图和 3 张细节特写图。",
    tutorialImage: "/tutorials/fashion-detail-focus.webp",
    steps: [
      { stepNumber: 1, title: "上传单品图片", description: "上传一张服装单品的完整图片，系统将基于此图生成主图和细节特写。" },
      { stepNumber: 2, title: "生成主图", description: "系统首先生成一张高质量的服装主图，作为后续细节特写的基础。" },
      { stepNumber: 3, title: "生成细节特写", description: "AI 自动识别并生成 3 张细节特写：结构特写、元素特写（纽扣/拉链/口袋等真实存在细节）、工艺/纹理特写。" },
      { stepNumber: 4, title: "查看与下载", description: "浏览全部 4 张生成图片（1 张主图 + 3 张细节），可逐张下载或全部保存。" },
    ],
  },
  {
    id: "ai-hangoutfit",
    name: "AI 一键挂搭图",
    category: "fashion",
    iconSrc: "/icons/ai-one-click-outfit-custom.webp",
    route: "/ai-hangoutfit",
    summary: "上传 2-3 张服装图，自动生成完整挂搭效果图。",
    tutorialImage: "/tutorials/ai-hangoutfit.webp",
    steps: [
      { stepNumber: 1, title: "上传服装图片", description: "上传 2-3 张服装图片即可，系统会把每张图作为独立服装参考，并自动补充包包和配饰。" },
      { stepNumber: 2, title: "选择画质", description: "选择输出画质：标准、2K 或 4K。画质越高，生成时间越长但效果更精细。" },
      { stepNumber: 3, title: "生成挂搭图", description: "点击生成，AI 会按已上传的 2-3 件服装生成挂搭展示效果图，自动添加搭配的包包和配饰。" },
      { stepNumber: 4, title: "下载结果", description: "生成完成后，点击下载按钮保存挂搭效果图。" },
    ],
  },
  {
    id: "ai-display",
    name: "AI 陈列",
    category: "fashion",
    iconSrc: "/icons/ai-display-custom.webp",
    route: "/ai-display",
    summary: "根据商品风格，一键生成店铺陈列与搭配方案。",
    tutorialImage: "/tutorials/ai-display.webp",
    steps: [
      { stepNumber: 1, title: "上传商品图片", description: "上传最多 12 张服装商品图片，数量越多，陈列方案越丰富。" },
      { stepNumber: 2, title: "选择场景类型", description: "选择陈列场景：远景（完整店铺布局）、中景（聚焦服装展示）或近景（面料细节特写）。" },
      { stepNumber: 3, title: "AI 识别分析", description: "系统自动识别每件服装的类型、颜色、风格等信息，生成详细的分析报告。" },
      { stepNumber: 4, title: "审核分析结果", description: "查看 AI 的分析报告，可以修改或补充说明，确保分析准确。" },
      { stepNumber: 5, title: "生成陈列图", description: "确认分析结果后，点击生成陈列效果图。" },
      { stepNumber: 6, title: "查看陈列建议", description: "下载陈列效果图，同时查看 AI 提供的搭配建议和销售话术。" },
    ],
  },
  // ===== 创意工具 =====
  {
    id: "ai-drawing",
    name: "AI 绘图",
    category: "creative",
    iconSrc: "/icons/ai-drawing-custom.webp",
    route: "/ai-drawing",
    summary: "输入描述或上传参考图，AI 生成创意图片。",
    tutorialImage: "/tutorials/ai-drawing.webp",
    steps: [
      { stepNumber: 1, title: "输入创意描述", description: "在文本框中输入想要生成的图片描述，支持中英文，描述越详细效果越好。" },
      { stepNumber: 2, title: "上传参考图（可选）", description: "可以上传参考图片辅助生成，AI 会参考图片的风格和构图。" },
      { stepNumber: 3, title: "选择框架与风格", description: "选择内容框架（自由模式、漫画、流程图等）、艺术风格（手绘、水彩、极简等）和画面比例。" },
      { stepNumber: 4, title: "生成图片", description: "点击生成按钮，等待 AI 创作完成，生成后可直接下载。" },
      { stepNumber: 5, title: "精修迭代（可选）", description: "对生成结果不满意？可以继续输入修改意见，进行多轮精修优化，最多支持 3 轮对话。" },
    ],
  },
  {
    id: "ai-ppt",
    name: "AI PPT",
    category: "creative",
    iconSrc: "/icons/ai-ppt-custom.webp",
    route: "/ai-ppt",
    summary: "输入内容，AI 自动生成精美 PPT 演示文稿。",
    tutorialImage: "/tutorials/ai-ppt.webp",
    steps: [
      { stepNumber: 1, title: "输入内容", description: "输入 PPT 主题、读书笔记或会议记录等文字内容，一句话也能生成完整 PPT。" },
      { stepNumber: 2, title: "配置参数", description: "设置 PPT 风格（手绘、水彩、波普等）、页数、模板样式和画面比例。" },
      { stepNumber: 3, title: "生成并编辑大纲", description: "AI 自动生成 PPT 大纲结构，你可以编辑每页的标题和描述内容。" },
      { stepNumber: 4, title: "生成幻灯片", description: "确认大纲后，AI 为每一页生成精美的配图和排版。" },
      { stepNumber: 5, title: "导出下载", description: "预览完成后，可导出为 PPT、PDF 或图片格式下载。" },
    ],
  },
  {
    id: "generative-report",
    name: "生成式报告",
    category: "creative",
    iconSrc: "/icons/generative-report-vintage.png",
    route: "/generative-report",
    summary: "上传图片素材，AI 生成专业图文报告并导出 PPT。",
    tutorialImage: "/tutorials/generative-report.webp",
    steps: [
      { stepNumber: 1, title: "选择报告参数", description: "设置分析深度（4页基础/6页标准/8页详细）和领域方向（宠物医疗、口腔、K12教育、健身）。" },
      { stepNumber: 2, title: "上传图片素材", description: "上传需要分析的图片素材，如诊断图片、设计稿等。" },
      { stepNumber: 3, title: "AI 分析", description: "系统对上传的图片进行深度分析，自动生成报告内容。" },
      { stepNumber: 4, title: "编辑报告页面", description: "查看并编辑 AI 生成的每一页报告内容，可以修改文字和调整排版。" },
      { stepNumber: 5, title: "生成配图", description: "为报告的每一页生成 AI 手绘风格插图，让报告更加生动。" },
      { stepNumber: 6, title: "导出 PPT", description: "将完成的报告导出为 PPT 文件，包含封面、内容页和封底。" },
    ],
  },
];
