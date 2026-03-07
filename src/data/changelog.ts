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
  /** 简短描述（列表中显示） */
  description: string;
  /** 详细更新内容（弹窗中显示），每项一个要点 */
  details: string[];
  /** 类型 */
  type: "feature" | "fix" | "improve";
}

/** 最新的放最前面 */
export const changelog: ChangelogEntry[] = [
  {
    id: 4,
    date: "2026-03-07",
    title: "线路状态实时检测 · 新功能上线",
    description: "所有出图页面新增线路状态圆点，实时显示 API 健康情况；新增 AI 细节特写和裤子上身效果。",
    details: [
      "全部出图页面新增彩色状态圆点：绿色=正常、橙色=响应慢、红色=故障，每次打开页面自动检测",
      "新增「AI 细节特写」：上传单品后一键生成主图 + 3 张结构/元素/工艺细节特写",
      "新增「裤子上身效果」：上传裤子图 + 模特图，AI 自动合成真实上身效果",
      "全站功能图标替换为手绘风格插画，视觉风格更统一",
      "修复灵犀 Pro 线路调用异常的问题",
    ],
    type: "feature",
  },
  {
    id: 3,
    date: "2025-02-27",
    title: "全站无障碍优化",
    description: "提升键盘导航、屏幕阅读器支持和色彩对比度，改善所有用户的使用体验。",
    details: [
      "添加 Skip to content 快捷跳转，键盘用户可直接跳到主内容",
      "所有加载状态添加 aria-live 语音播报",
      "表单输入框添加 autocomplete 和验证错误提示",
      "图片预览弹窗支持 Escape 关闭和焦点陷阱",
      "全站小于 12px 的文字统一调整为最小 12px",
      "文字与背景色对比度提升至 WCAG AA 标准",
    ],
    type: "improve",
  },
  {
    id: 2,
    date: "2025-02-26",
    title: "管理后台上线",
    description: "新增管理员仪表盘，支持用户管理、积分调整和数据统计。",
    details: [
      "管理员可查看全站用户列表和注册趋势",
      "支持手动调整用户积分余额",
      "新增数据统计面板：日活、创作量、积分消耗",
      "添加创始人微信入口，新用户可获赠 300 积分",
    ],
    type: "feature",
  },
  {
    id: 1,
    date: "2025-02-25",
    title: "积分消耗提示",
    description: "各功能页面现已显示积分消耗量，让你在创作前心中有数。",
    details: [
      "AI 绘图、AI 陈列、AI 一键换装等页面显示积分消耗",
      "移动端页面添加返回按钮，操作更顺畅",
      "优化氛围图生成的构图效果",
    ],
    type: "feature",
  },
];
