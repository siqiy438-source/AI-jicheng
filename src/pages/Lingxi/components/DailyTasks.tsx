import { memo } from "react";
import { Target } from "lucide-react";

// 静态 JSX 提取到组件外部以避免重复创建 (rendering-hoist-jsx)
const taskItems = [
  { label: "登录签到", points: "+10积分" },
  { label: "创作1个作品", points: "+20积分" },
  { label: "分享作品到社交平台", points: "+30积分" },
] as const;

export const DailyTasks = memo(function DailyTasks() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-green-500" />
        <span className="font-semibold text-foreground">每日任务</span>
        <span className="ml-auto text-xs text-muted-foreground">
          0/3 已完成
        </span>
      </div>
      <div className="space-y-3">
        {taskItems.map((task) => (
          <div key={task.label} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-border" />
            <span className="text-sm text-foreground">{task.label}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {task.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
