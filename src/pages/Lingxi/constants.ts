import {
  Palette,
  ImageIcon,
  FileText,
  Video,
  Mic,
  Wand2,
  BarChart3,
  Star,
  Clock,
  Calendar,
  type LucideIcon,
} from "lucide-react";

// 类型定义
export interface QuickTool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
  path: string;
  comingSoon?: boolean;
}

export interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  change: string;
}

export interface Inspiration {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  uses: number;
}

export interface RecentWork {
  id: string;
  title: string;
  tool: string;
  time: string;
  thumbnail: string | null;
}

export interface Tip {
  id: string;
  title: string;
  category: string;
  readTime: string;
}

// 快捷工具配置
export const QUICK_TOOLS: QuickTool[] = [
  {
    id: "poster",
    name: "AI 海报",
    description: "一键生成营销海报",
    icon: Palette,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    path: "/ai-poster",
  },
  {
    id: "drawing",
    name: "AI 绘图",
    description: "创意图像生成",
    icon: ImageIcon,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    path: "/ai-drawing",
  },
  {
    id: "copywriting",
    name: "AI 文案",
    description: "智能文案写作",
    icon: FileText,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    path: "/ai-copywriting",
  },
  {
    id: "video",
    name: "AI 视频",
    description: "短视频创作",
    icon: Video,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600",
    path: "#",
    comingSoon: true,
  },
  {
    id: "voice",
    name: "AI 配音",
    description: "智能语音合成",
    icon: Mic,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    path: "#",
    comingSoon: true,
  },
  {
    id: "magic",
    name: "一键改图",
    description: "智能图片编辑",
    icon: Wand2,
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-600",
    path: "#",
    comingSoon: true,
  },
];

// 数据统计 - 新用户默认为零
export const DEFAULT_STATS: Stat[] = [
  { label: "本月创作", value: "0", icon: BarChart3, change: "" },
  { label: "累计作品", value: "0", icon: Star, change: "" },
  { label: "节省时间", value: "0h", icon: Clock, change: "" },
  { label: "使用天数", value: "0", icon: Calendar, change: "" },
];

// 创作灵感 - 新用户为空
export const DEFAULT_INSPIRATIONS: Inspiration[] = [];

// 最近创作 - 新用户为空
export const DEFAULT_RECENT_WORKS: RecentWork[] = [];

// 创作技巧 - 新用户为空
export const DEFAULT_TIPS: Tip[] = [];
