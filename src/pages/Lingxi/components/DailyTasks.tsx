import { memo } from "react";
import { Target } from "lucide-react";

// 静态 JSX 提取到组件外部以避免重复创建 (rendering-hoist-jsx)
const taskItems = [
  { id: "checkin", label: "登录签到", points: 10 },
  { id: "create", label: "创作1个作品", points: 20 },
  { id: "share", label: "分享作品到社交平台", points: 30 },
] as const;

export const DailyTasks = memo(function DailyTasks() {
  return (
    <section
      className="glass-card rounded-xl p-4"
      aria-labelledby="daily-tasks-heading"
    >
      <header className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-green-500" aria-hidden="true" />
        <h2 id="daily-tasks-heading" className="font-semibold text-foreground">
          每日任务
        </h2>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          0/3 已完成
        </span>
      </header>
      <ul className="space-y-3" role="list">
        {taskItems.map((task) => (
          <li key={task.id} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0"
              role="checkbox"
              aria-checked="false"
              aria-label={task.label}
            />
            <span className="text-sm text-foreground flex-1">{task.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              +{task.points}积分
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});
