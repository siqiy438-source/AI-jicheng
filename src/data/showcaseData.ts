export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  beforeImages: string[];   // 上传的原图（1~3张）
  afterImages: string[];      // 生成的效果图（1~多张）
  promptText?: string;        // 文字提示词（如 AI 绘图只需一句话）
  promptLabel?: string;        // 提示框标签（默认"只需输入一句话"）
  toolRoute: string;        // 点击"立即体验"跳转的路由
}

export interface ShowcaseCategory {
  name: string;
  items: ShowcaseItem[];
}

export const showcaseCategories: ShowcaseCategory[] = [
  {
    name: "服装工具",
    items: [
      {
        id: "flatlayout",
        title: "平铺/摆拍生成",
        description: "上传服饰单品，快速生成平铺或摆拍展示图",
        beforeImages: [
          "/showcase/flatlayout-before-1.webp",
          "/showcase/flatlayout-before-2.webp",
          "/showcase/flatlayout-before-3.webp",
        ],
        afterImages: ["/showcase/flatlayout-after.webp", "/showcase/flatlayout-after-2.webp"],
        toolRoute: "/fashion-outfit",
      },
      {
        id: "model",
        title: "模特生成",
        description: "支持自拍照或标准模特图，智能生成上身效果",
        beforeImages: [
          "/showcase/model-before-1.webp",
          "/showcase/model-before-2.webp",
        ],
        afterImages: ["/showcase/model-after.webp"],
        toolRoute: "/fashion-model-outfit",
      },
      {
        id: "detail-focus",
        title: "AI 细节特写",
        description: "先生成主图，再自动输出领口、纽扣等细节特写",
        beforeImages: ["/showcase/detail-before-1.webp"],
        afterImages: ["/showcase/detail-after.webp", "/showcase/detail-after-2.webp"],
        toolRoute: "/fashion-detail-focus",
      },
      {
        id: "hangoutfit",
        title: "AI 一键挂搭图",
        description: "上传内搭与单品，自动补全完整挂搭效果图",
        beforeImages: [
          "/showcase/hangoutfit-before-1.png",
          "/showcase/hangoutfit-before-2.png",
          "/showcase/hangoutfit-before-3.png",
        ],
        afterImages: ["/showcase/hangoutfit-after.jpg"],
        toolRoute: "/ai-hangoutfit",
      },
      {
        id: "display",
        title: "AI 陈列",
        description: "根据商品风格，一键生成店铺陈列与搭配方案",
        beforeImages: [],
        afterImages: ["/showcase/display-after.webp"],
        toolRoute: "/ai-display",
      },
    ],
  },
  {
    name: "创意工具",
    items: [
      {
        id: "drawing",
        title: "AI 绘图",
        description: "一句话生成高质量图片，灵感即刻呈现",
        promptText: "刻意练习读书笔记",
        beforeImages: [],
        afterImages: ["/showcase/drawing-after.webp"],
        toolRoute: "/ai-drawing",
      },
      {
        id: "ppt",
        title: "AI PPT",
        description: "一句话或读书笔记生成大纲，AI 自动配图，轻松制作演示文稿",
        promptText: "高效能人士的七个习惯启示录",
        promptLabel: "输入主题、读书笔记或会议记录",
        beforeImages: [],
        afterImages: ["/showcase/ppt-after.webp"],
        toolRoute: "/ai-ppt",
      },
    ],
  },
];
