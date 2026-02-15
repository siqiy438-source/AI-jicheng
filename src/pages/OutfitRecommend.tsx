import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import {
  ArrowLeft,
  X,
  Sparkles,
  RefreshCw,
  Shirt,
  Footprints,
  ShoppingBag,
  Gem,
  Lightbulb,
  Upload,
  MessageCircle,
  Tag,
  ShieldAlert,
  LayoutGrid,
  Palette,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-utils";
import {
  getOutfitRecommendation,
  type OutfitRecommendResult,
} from "@/lib/outfit-recommend";
import { saveWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { useToast } from "@/hooks/use-toast";

type Phase = "upload" | "analyzing" | "result";

const categoryIcons: Record<string, typeof Shirt> = {
  "内搭": Shirt,
  "外套": Shirt,
  "上衣": Shirt,
  "下装": Shirt,
  "鞋子": Footprints,
  "包包": ShoppingBag,
  "配饰": Gem,
};

const OutfitRecommend = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkCredits, showInsufficientDialog, requiredAmount, featureName, currentBalance, goToRecharge, dismissDialog, refreshBalance } = useCreditCheck();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitRecommendResult | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.8 });
      setImage(compressed);
    } catch {
      toast({ title: "图片处理失败", description: "请换一张图片试试", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!image) return;
    const hasCredits = await checkCredits("ai_outfit_recommend");
    if (!hasCredits) return;

    setPhase("analyzing");
    try {
      const data = await getOutfitRecommendation(image);
      setResult(data);
      setPhase("result");
      refreshBalance();

      // 保存到历史记录
      const title = data.inputAnalysis.itemType
        ? `穿搭：${data.inputAnalysis.itemType}`
        : "穿搭推荐";
      void saveWork({
        title,
        type: "outfit-recommend",
        tool: "穿搭推荐",
        thumbnailDataUrl: image,
        content: data as unknown as Record<string, unknown>,
      });
    } catch (error) {
      toast({ title: "推荐失败", description: error instanceof Error ? error.message : "请重试", variant: "destructive" });
      setPhase("upload");
    }
  };

  const handleReset = () => {
    setPhase("upload");
    setImage(null);
    setResult(null);
  };

  return (
    <PageLayout maxWidth="4xl" className="py-6 md:py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate("/clothing")}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 返回服装工具
      </button>

      {/* 页面标题 */}
      <div className="hidden md:flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground">穿搭推荐</h1>
          <p className="text-sm text-muted-foreground">上传一件单品，20年资深服装搭配师为你提供穿搭方案</p>
        </div>
      </div>

      {/* 加载态 */}
      {phase === "analyzing" && (
        <GeneratingLoader message="正在分析穿搭方案..." subMessage="AI 搭配师正在为你精心搭配" />
      )}

      {/* 上传态 */}
      {phase === "upload" && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          {/* 图片上传 */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">上传单品图片</h3>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {!image ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">点击上传衣服图片</span>
              </button>
            ) : (
              <div className="relative inline-block">
                <img src={image} alt="单品" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerate}
            disabled={!image}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            <Sparkles className="w-5 h-5" />
            生成穿搭方案（20 积分）
          </Button>
        </div>
      )}

      {/* 结果态 */}
      {phase === "result" && result && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          {/* 操作栏 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" /> 重新推荐
            </Button>
          </div>

          {/* 单品分析卡片 */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Shirt className="w-4 h-4" /> 单品分析
            </h3>
            <div className="flex gap-4">
              {image && <img src={image} alt="单品" className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0" />}
              <div className="space-y-1.5 text-sm">
                <p><span className="text-primary font-medium mr-2">类型</span><span className="text-foreground font-medium">{result.inputAnalysis.itemType}</span></p>
                <p><span className="text-primary font-medium mr-2">颜色</span><span className="text-foreground">{result.inputAnalysis.color}</span></p>
                <p><span className="text-primary font-medium mr-2">风格</span><span className="text-foreground">{result.inputAnalysis.style}</span></p>
                <p><span className="text-primary font-medium mr-2">面料</span><span className="text-foreground">{result.inputAnalysis.material}</span></p>
                {result.inputAnalysis.silhouette && (
                  <p><span className="text-primary font-medium mr-2">版型</span><span className="text-foreground">{result.inputAnalysis.silhouette}</span></p>
                )}
                {result.inputAnalysis.bestFor && (
                  <p><span className="text-primary font-medium mr-2">适合</span><span className="text-foreground">{result.inputAnalysis.bestFor}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* 商品档案 */}
          {result.productProfile && (
            <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> 商品档案
              </h3>
              <div className="space-y-2.5 text-sm">
                <p><span className="text-muted-foreground mr-2">风格标签</span><span className="text-foreground">{result.productProfile.styleTags}</span></p>
                <p><span className="text-muted-foreground mr-2">陈列区域</span><span className="text-foreground">{result.productProfile.displayArea}</span></p>
                <p><span className="text-muted-foreground mr-2">目标客群</span><span className="text-foreground">{result.productProfile.targetCustomer}</span></p>
                <p><span className="text-muted-foreground mr-2">体型适配</span><span className="text-foreground">{result.productProfile.bodyFit}</span></p>
                <div className="mt-2 p-2.5 rounded-lg bg-muted/30">
                  <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-primary" /> 搭配色建议</p>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-green-600 mr-1.5">安全牌</span><span className="text-muted-foreground">{result.productProfile.colorMatch.safe}</span></p>
                    <p><span className="text-amber-600 mr-1.5">进阶牌</span><span className="text-muted-foreground">{result.productProfile.colorMatch.advanced}</span></p>
                    <p><span className="text-red-500 mr-1.5">避雷</span><span className="text-muted-foreground">{result.productProfile.colorMatch.avoid}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 搭配方案卡片（最多显示2套） */}
          {result.combinations.slice(0, 2).map((combo, idx) => (
            <div key={idx} className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-foreground">{combo.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{combo.theme}</p>
                {combo.targetBody && (
                  <span className="inline-block mt-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{combo.targetBody}</span>
                )}
              </div>

              {/* 单品列表 */}
              <div className="space-y-2.5 mb-4">
                {combo.items.map((item, i) => {
                  const Icon = categoryIcons[item.category] || Shirt;
                  return (
                    <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-muted/30">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">{item.category}</span>
                          <span className="text-xs text-muted-foreground">{item.colorSuggestion}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.styleTip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 搭配逻辑 */}
              {combo.matchingLogic && (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{combo.matchingLogic}</p>
                </div>
              )}

              {/* 搭配技巧 */}
              {combo.stylingTips.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> 搭配小技巧
                  </h4>
                  <ul className="space-y-1">
                    {combo.stylingTips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-primary">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 整体效果 */}
              <div className="border-t border-border/30 pt-3 space-y-2">
                <p className="text-sm text-foreground leading-relaxed">{combo.overallLook}</p>
                {combo.salesTalk && (
                  <div className="bg-primary/5 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-primary mb-1 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> 推荐话术
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{combo.salesTalk}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 客诉应对 */}
          {result.objectionHandling && (
            <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" /> 客诉应对话术
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "客人说「显胖」", text: result.objectionHandling.looksFat },
                  { label: "客人说「太贵」", text: result.objectionHandling.tooExpensive },
                  { label: "客人说「不适合」", text: result.objectionHandling.notSuitable },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-muted/30">
                    <p className="text-xs font-medium text-foreground mb-1">{item.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 陈列指导 */}
          {result.displayGuide && (
            <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" /> 陈列指导
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground mr-2">分区建议</span><span className="text-foreground">{result.displayGuide.zone}</span></p>
                <p><span className="text-muted-foreground mr-2">VP展示</span><span className="text-foreground">{result.displayGuide.vpDisplay}</span></p>
                <p><span className="text-muted-foreground mr-2">色彩排列</span><span className="text-foreground">{result.displayGuide.colorArrangement}</span></p>
                <p><span className="text-muted-foreground mr-2">衣架卡</span><span className="text-foreground">{result.displayGuide.tagTip}</span></p>
              </div>
            </div>
          )}

          {/* 通用建议 */}
          {result.generalTips.length > 0 && (
            <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" /> 通用搭配建议
              </h3>
              <ul className="space-y-1.5">
                {result.generalTips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-primary">{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onClose={dismissDialog}
        requiredAmount={requiredAmount}
        currentBalance={currentBalance}
        featureName={featureName}
        onRecharge={goToRecharge}
      />
    </PageLayout>
  );
};

export default OutfitRecommend;