/**
 * 更新日志数据
 * 每次发版时在数组顶部添加新条目即可，用户会自动看到通知
 * type: "feature" 新功能 | "fix" 修复 | "improve" 优化
 */
export interface ChangelogEntry {
  /** 唯一 ID，递增即可 */
  id: number;
  /** 发布日期 YYYY-MM-DD */
  date: string;
  /** 标题 */
  title: string;
  /** 简短描述 */
  description: string;
  /** 类型 */
  type: "feature" | "fix" | "improve";
}

/** 最新的放最前面 */
export const changelog: ChangelogEntry[] = [
  {
    id: 3,
    date: "2025-02-27",
    title: "全站无障碍优化",
    description: "提升键盘导航、屏幕阅读器支持和色彩对比度，改善所有用户的使用体验。",
    type: "improve",
  },
  {
    id: 2,
    date: "2025-02-26",
    title: "管理后台上线",
    description: "新增管理员仪表盘，支持用户管理、积分调整和数据统计。",
    type: "feature",
  },
  {
    id: 1,
    date: "2025-02-25",
    title: "积分消耗提示",
    description: "各功能页面现已显示积分消耗量，让你在创作前心中有数。",
    type: "feature",
  },
];
