/**
 * Agent Team 分析结果展示组件
 * 展示 4 位 AI 专家的分析结论，用户确认后进入生成阶段
 */

import { useState } from "react";
import { ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import { VM_AGENTS, type VMAnalysisResult } from "@/lib/vm-analysis";
import { cn } from "@/lib/utils";

interface AnalysisReviewProps {
  analysis: VMAnalysisResult;
  onConfirm: () => void;
  onReanalyze: () => void;
  isGenerating?: boolean;
}

const AnalysisReview = ({
  analysis,
  onConfirm,
  onReanalyze,
  isGenerating = false,
}: AnalysisReviewProps) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>("color");
  const [imageLoadFailed, setImageLoadFailed] = useState<Record<string, boolean>>({});

  const toggleAgent = (id: string) => {
    setExpandedAgent(expandedAgent === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {/* 总结卡片 */}
      <div className="glass-card rounded-xl p-3 md:p-4 border-l-4 border-primary/60">
        <p className="text-sm text-foreground leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* 4 位 Agent 分析卡片 */}
      {VM_AGENTS.map((agent) => (
        <div
          key={agent.id}
          className="glass-card rounded-xl overflow-hidden shadow-sm"
        >
          {/* 卡片头部 */}
          <button
            onClick={() => toggleAgent(agent.id)}
            className="w-full flex items-center gap-3 p-3 md:p-4 hover:bg-secondary/30 transition-colors"
          >
            {agent.iconSrc && !imageLoadFailed[agent.id] ? (
              <img
                src={agent.iconSrc}
                alt={agent.nameCn}
                className="w-7 h-7 object-contain"
                onError={() => setImageLoadFailed((prev) => ({ ...prev, [agent.id]: true }))}
              />
            ) : (
              <span className="text-lg">{agent.icon}</span>
            )}
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-foreground">
                {agent.nameCn}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                expandedAgent === agent.id && "rotate-180"
              )}
            />
          </button>

          {/* 展开内容 */}
          {expandedAgent === agent.id && (
            <div className="px-3 pb-3 md:px-4 md:pb-4 border-t border-border/50">
              {agent.id === "color" && (
                <ColorAnalysisContent analysis={analysis} />
              )}
              {agent.id === "style" && (
                <StyleDetectionContent analysis={analysis} />
              )}
              {agent.id === "composition" && (
                <CompositionContent analysis={analysis} />
              )}
              {agent.id === "lighting" && (
                <LightingContent analysis={analysis} />
              )}
            </div>
          )}
        </div>
      ))}

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onReanalyze}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all touch-target"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重新分析
        </button>
        <button
          onClick={onConfirm}
          disabled={isGenerating}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target",
            isGenerating
              ? "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "生成中..." : "确认方案，开始生成"}
        </button>
      </div>
    </div>
  );
};

export default AnalysisReview;

// ---- 子内容组件 ----

function ColorAnalysisContent({ analysis }: { analysis: VMAnalysisResult }) {
  const { colorAnalysis } = analysis;
  return (
    <div className="pt-3 space-y-3">
      {/* 主色调 */}
      <div>
        <span className="text-xs text-muted-foreground">主色调</span>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {colorAnalysis.dominantColors.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-secondary/40 rounded-full px-2.5 py-1">
              <span
                className="w-4 h-4 rounded-full border border-border/50 flex-shrink-0"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-xs text-foreground">{c.name}</span>
              <span className="text-[10px] text-muted-foreground">{c.hex}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 色系 */}
      <div>
        <span className="text-xs text-muted-foreground">色系归类</span>
        <p className="text-sm text-foreground mt-0.5">{colorAnalysis.colorFamily}</p>
      </div>
      {/* 推荐背景 */}
      <div className="bg-secondary/30 rounded-lg p-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg border border-border/50 flex-shrink-0"
            style={{ backgroundColor: colorAnalysis.backgroundRecommendation.hex }}
          />
          <div>
            <span className="text-xs font-medium text-foreground">
              推荐背景：{colorAnalysis.backgroundRecommendation.color}
            </span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {colorAnalysis.backgroundRecommendation.reasoning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StyleDetectionContent({ analysis }: { analysis: VMAnalysisResult }) {
  const { styleDetection } = analysis;
  const categoryLabels: Record<string, string> = {
    'Work/Minimal': '职场简约',
    'Relaxed/Resort': '休闲度假',
    'Artistic/Vintage': '艺术复古',
    '职场简约': '职场简约',
    '休闲度假': '休闲度假',
    '艺术复古': '艺术复古',
  };
  return (
    <div className="pt-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
          {categoryLabels[styleDetection.styleCategory] || styleDetection.styleCategory}
        </span>
        <span className="text-xs text-muted-foreground">{styleDetection.styleDescription}</span>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">推荐道具</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {styleDetection.recommendedProps.map((prop, i) => (
            <span key={i} className="px-2 py-1 text-xs bg-secondary/50 rounded-lg text-foreground">
              {prop}
            </span>
          ))}
        </div>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">摆放建议</span>
        <p className="text-sm text-foreground mt-0.5">{styleDetection.propPlacement}</p>
      </div>
    </div>
  );
}

function CompositionContent({ analysis }: { analysis: VMAnalysisResult }) {
  const { compositionPlan } = analysis;
  return (
    <div className="pt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <span className="text-lg font-semibold text-foreground">{compositionPlan.totalPieces}</span>
          <p className="text-[10px] text-muted-foreground">总件数</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <span className="text-lg font-semibold text-foreground">{compositionPlan.soloHangers}</span>
          <p className="text-[10px] text-muted-foreground">单挂</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2 text-center">
          <span className="text-lg font-semibold text-foreground">{compositionPlan.layeredHangers}</span>
          <p className="text-[10px] text-muted-foreground">叠挂</p>
        </div>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">间距</span>
        <p className="text-sm text-foreground mt-0.5">{compositionPlan.spacingPercent}% 留白</p>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">下摆节奏</span>
        <p className="text-sm text-foreground mt-0.5">{compositionPlan.hemRhythm}</p>
      </div>
      <div>
        <span className="text-xs text-muted-foreground">地面锚点</span>
        <p className="text-sm text-foreground mt-0.5">{compositionPlan.anchorItems}</p>
      </div>
    </div>
  );
}

function LightingContent({ analysis }: { analysis: VMAnalysisResult }) {
  const { lightingPlan } = analysis;
  return (
    <div className="pt-3 space-y-2.5">
      {[
        { label: '光源方向', value: lightingPlan.direction },
        { label: '色温', value: `${lightingPlan.warmth} (${lightingPlan.colorTemperature})` },
        { label: '阴影风格', value: lightingPlan.shadowStyle },
        { label: '特别说明', value: lightingPlan.specialNotes },
      ].map((item, i) => (
        <div key={i}>
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <p className="text-sm text-foreground mt-0.5">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
