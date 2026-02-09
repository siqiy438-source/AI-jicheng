import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
// 直接导入而非 barrel imports (bundle-barrel-imports)
import { ArrowLeft } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Zap } from "lucide-react";
import { Lightbulb } from "lucide-react";
import { Target } from "lucide-react";
import { Clock } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

// 子组件直接导入 (bundle-barrel-imports)
import { StatCard } from "./components/StatCard";
import { ToolCard } from "./components/ToolCard";
import { InspirationCard } from "./components/InspirationCard";
import { RecentWorkCard } from "./components/RecentWorkCard";
import { TipCard } from "./components/TipCard";
import { DailyTasks } from "./components/DailyTasks";
import { SectionHeader, EmptyState } from "./components/common";

// 常量和类型
import {
  QUICK_TOOLS,
  DEFAULT_STATS,
  DEFAULT_INSPIRATIONS,
  DEFAULT_RECENT_WORKS,
  DEFAULT_TIPS,
} from "./constants";

// 静态 JSX 提取到组件外部 (rendering-hoist-jsx)
const InspirationEmptyState = (
  <div className="col-span-2 glass-card rounded-xl p-8 text-center">
    <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
    <p className="text-muted-foreground text-sm">暂无创作灵感</p>
    <p className="text-muted-foreground/60 text-xs mt-1">
      开始创作后，这里会为你推荐灵感
    </p>
  </div>
);

// 统计卡片网格 - 提取为独立组件避免重渲染
const StatsGrid = memo(function StatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {DEFAULT_STATS.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
});

// 快捷工具网格
const QuickToolsGrid = memo(function QuickToolsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {QUICK_TOOLS.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
});

// 创作灵感区块
const InspirationSection = memo(function InspirationSection() {
  const hasInspirations = DEFAULT_INSPIRATIONS.length > 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      {hasInspirations
        ? DEFAULT_INSPIRATIONS.map((item) => (
            <InspirationCard key={item.id} item={item} />
          ))
        : InspirationEmptyState}
    </div>
  );
});

// 创作技巧区块
const TipsSection = memo(function TipsSection() {
  const hasTips = DEFAULT_TIPS.length > 0;

  return (
    <div className="space-y-3">
      {hasTips ? (
        DEFAULT_TIPS.map((tip) => <TipCard key={tip.id} tip={tip} />)
      ) : (
        <EmptyState
          icon={Target}
          title="暂无创作技巧"
          description="更多技巧即将上线…"
        />
      )}
    </div>
  );
});

// 最近创作区块
const RecentWorksSection = memo(function RecentWorksSection() {
  const hasWorks = DEFAULT_RECENT_WORKS.length > 0;

  return (
    <div className="space-y-3">
      {hasWorks ? (
        DEFAULT_RECENT_WORKS.map((work) => (
          <RecentWorkCard key={work.id} work={work} />
        ))
      ) : (
        <EmptyState
          icon={Sparkles}
          title="暂无创作记录"
          description="开始你的第一次创作吧"
        />
      )}
    </div>
  );
});

// 主组件
const Lingxi = () => {
  // 空函数用于暂未实现的功能
  const handleViewMore = useCallback(() => {
    // TODO: 实现查看更多功能
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* 返回按钮 - 使用 Link 实现正确的导航语义 */}
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md touch-action-manipulation"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>返回首页</span>
            </Link>

            {/* 页面标题 */}
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-foreground text-balance">
                灵犀
              </h1>
              <p className="text-muted-foreground text-sm">
                心有灵犀，创意无限
              </p>
            </header>

            {/* 数据统计 */}
            <section aria-labelledby="stats-heading">
              <h2 id="stats-heading" className="sr-only">数据统计</h2>
              <StatsGrid />
            </section>

            {/* 快捷工具 */}
            <section className="mb-8" aria-labelledby="tools-heading">
              <SectionHeader
                title="快捷工具"
                icon={Zap}
                iconColor="text-yellow-500"
                headingId="tools-heading"
              />
              <QuickToolsGrid />
            </section>

            {/* 主内容区 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：创作灵感 + 技巧 */}
              <div className="lg:col-span-2 space-y-6">
                <section aria-labelledby="inspiration-heading">
                  <SectionHeader
                    title="创作灵感"
                    icon={Lightbulb}
                    iconColor="text-amber-500"
                    onViewMore={handleViewMore}
                    headingId="inspiration-heading"
                  />
                  <InspirationSection />
                </section>

                <section aria-labelledby="tips-heading">
                  <SectionHeader
                    title="创作技巧"
                    icon={Target}
                    iconColor="text-red-500"
                    onViewMore={handleViewMore}
                    headingId="tips-heading"
                  />
                  <TipsSection />
                </section>
              </div>

              {/* 右侧：最近创作 + 每日任务 */}
              <div className="space-y-6">
                <section aria-labelledby="recent-heading">
                  <SectionHeader
                    title="最近创作"
                    icon={Clock}
                    iconColor="text-blue-500"
                    linkTo="/my-works"
                    viewMoreText="全部"
                    headingId="recent-heading"
                  />
                  <RecentWorksSection />
                </section>

                <DailyTasks />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Lingxi;
