import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { CreditCostHint } from "@/components/CreditCostHint";
import {
  ArrowLeft,
  X,
  Sparkles,
  RefreshCw,
  Upload,
  Shirt,
  Droplets,
  ShieldCheck,
  BarChart3,
  FileText,

  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image-utils";
import {
  getFabricAnalysis,
  type FabricAnalysisResult,
} from "@/lib/fabric-analysis";
import { saveWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";
import { useToast } from "@/hooks/use-toast";

type Phase = "upload" | "analyzing" | "result";

const FabricAnalysis = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkCredits, showInsufficientDialog, requiredAmount, featureName, currentBalance, goToRecharge, dismissDialog, refreshBalance } = useCreditCheck();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<FabricAnalysisResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });
      setImage(compressed);
    } catch {
      toast({ title: "图片处理失败", description: "请换一张图片试试", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!image) return;
    const hasCredits = checkCredits("ai_fabric_analysis");
    if (!hasCredits) return;

    setPhase("analyzing");
    try {
      const data = await getFabricAnalysis(image);
      setResult(data);
      setPhase("result");
      refreshBalance();

      const title = data.fabricIdentification.fabricType
        ? `面料：${data.fabricIdentification.fabricType}`
        : "面料分析";
      void saveWork({
        title,
        type: "fabric-analysis",
        tool: "面料说明生成器",
        thumbnailDataUrl: image,
        content: data as unknown as Record<string, unknown>,
      });
    } catch (error) {
      toast({ title: "分析失败", description: error instanceof Error ? error.message : "请重试", variant: "destructive" });
      setPhase("upload");
    }
  };

  const handleReset = () => {
    setPhase("upload");
    setImage(null);
    setResult(null);
    setCopiedSection(null);
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast({ title: "已复制到剪贴板" });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyButton = ({ text, section }: { text: string; section: string }) => (
    <button
      onClick={() => handleCopy(text, section)}
      className="ml-auto flex-shrink-0 p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
      title="复制"
    >
      {copiedSection === section ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  return (
    <PageLayout maxWidth="4xl" className="py-4 md:py-8">
      {/* 移动端顶部导航 */}
      <div className="flex md:hidden items-center gap-3 mb-4">
        <button
          onClick={() => navigate("/clothing")}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors -ml-1"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground">面料说明生成器</h1>
      </div>

      {/* 桌面端导航 */}
      <button
        onClick={() => navigate("/clothing")}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 返回服装工具
      </button>

      <div className="hidden md:flex items-center gap-4 mb-8 opacity-0 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground">面料说明生成器</h1>
          <p className="text-sm text-muted-foreground">拍一张水洗标，自动生成面向顾客的面料营销话术</p>
        </div>
      </div>

      {phase === "analyzing" && (
        <GeneratingLoader message="正在分析面料成分..." subMessage="AI 正在识别面料并生成营销话术" />
      )}

      {phase === "upload" && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">上传水洗标或面料照片</h3>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {!image ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/50 rounded-xl p-6 md:p-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors active:scale-[0.98]"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">点击上传水洗标或面料图片</span>
                <span className="text-xs text-muted-foreground/60">支持水洗标、成分标签、面料特写</span>
              </button>
            ) : (
              <div className="relative inline-block">
                <img src={image} alt="面料" className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-xl" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <Button
              onClick={handleGenerate}
              disabled={!image}
              className="w-full h-11 md:h-12 text-sm md:text-base font-semibold gap-2"
            >
              <Sparkles className="w-5 h-5" />
              生成面料说明
            </Button>
            <CreditCostHint featureCode="ai_fabric_analysis" />
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="space-y-3 md:space-y-4 opacity-0 animate-fade-in">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs md:text-sm h-8 md:h-9">
              <RefreshCw className="w-3.5 h-3.5" /> 重新分析
            </Button>
          </div>

          {/* 面料识别 */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <Shirt className="w-4 h-4" /> 面料识别
            </h3>
            <div className="flex gap-3 md:gap-4">
              {image && <img src={image} alt="面料" className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0" />}
              <div className="space-y-1 md:space-y-1.5 text-xs md:text-sm min-w-0">
                <p><span className="text-primary font-medium mr-2">成分</span><span className="text-foreground font-medium">{result.fabricIdentification.composition}</span></p>
                <p><span className="text-primary font-medium mr-2">类型</span><span className="text-foreground">{result.fabricIdentification.fabricType}</span></p>
                <p><span className="text-primary font-medium mr-2">质感</span><span className="text-foreground">{result.fabricIdentification.texture}</span></p>
                <p><span className="text-primary font-medium mr-2">厚薄</span><span className="text-foreground">{result.fabricIdentification.weight}</span></p>
              </div>
            </div>
          </div>

          {/* 面料对比 */}
          {result.fabricComparison.length > 0 && (
            <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> 面料对比
              </h3>
              <div className="space-y-3">
                {result.fabricComparison.map((comp, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium text-foreground mb-2">vs {comp.comparedTo}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-1">优势</p>
                        <ul className="space-y-0.5">
                          {comp.advantages.map((a, j) => (
                            <li key={j} className="text-xs text-muted-foreground">+ {a}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-600 mb-1">劣势</p>
                        <ul className="space-y-0.5">
                          {comp.disadvantages.map((d, j) => (
                            <li key={j} className="text-xs text-muted-foreground">- {d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 洗涤保养（合并洗涤建议+保养提示） */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Droplets className="w-4 h-4" /> 洗涤保养
              </h3>
              <CopyButton text={`洗涤：${result.careInstructions.washing}\n晾晒：${result.careInstructions.drying}\n熨烫：${result.careInstructions.ironing}\n收纳：${result.careInstructions.storage}\n\n注意事项：\n${result.careInstructions.warnings.join('\n')}\n\n保养提示：\n${result.maintenanceTips.join('\n')}`} section="care" />
            </div>
            <div className="space-y-2.5 text-sm">
              <p><span className="text-muted-foreground mr-2">洗涤</span><span className="text-foreground">{result.careInstructions.washing}</span></p>
              <p><span className="text-muted-foreground mr-2">晾晒</span><span className="text-foreground">{result.careInstructions.drying}</span></p>
              <p><span className="text-muted-foreground mr-2">熨烫</span><span className="text-foreground">{result.careInstructions.ironing}</span></p>
              <p><span className="text-muted-foreground mr-2">收纳</span><span className="text-foreground">{result.careInstructions.storage}</span></p>
              {result.careInstructions.warnings.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">注意事项</p>
                  <ul className="space-y-1">
                    {result.careInstructions.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-600 dark:text-amber-400/80 pl-4 relative before:content-['⚠'] before:absolute before:left-0">{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.maintenanceTips.length > 0 && (
                <div className="mt-2 pt-2.5 border-t border-border/30">
                  <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> 日常保养
                  </p>
                  <ul className="space-y-1">
                    {result.maintenanceTips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-primary">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 导购话术 */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 导购话术
              </h3>
              <CopyButton text={`${result.marketingDescription.headline}\n\n【为什么值这个价】\n${result.marketingDescription.whyExpensive}\n\n【和其他衣服的区别】\n${result.marketingDescription.whatsDifferent}\n\n卖点：\n${result.marketingDescription.sellingPoints.join('\n')}\n\n适合季节：${result.marketingDescription.suitableSeasons}\n适合场景：${result.marketingDescription.suitableScenes.join('、')}`} section="marketing" />
            </div>
            <div className="space-y-2.5 md:space-y-3">
              <div className="p-2.5 md:p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs md:text-sm font-semibold text-foreground">{result.marketingDescription.headline}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-primary">💰 顾客问：为什么卖这么贵？</p>
                <p className="text-xs md:text-sm text-foreground leading-relaxed">{result.marketingDescription.whyExpensive}</p>
              </div>
              <div className="border-t border-border/50" />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-primary">🤔 顾客问：和其他衣服有什么区别？</p>
                <p className="text-xs md:text-sm text-foreground leading-relaxed">{result.marketingDescription.whatsDifferent}</p>
              </div>
              <div className="flex flex-wrap gap-1 md:gap-1.5">
                {result.marketingDescription.sellingPoints.map((point, i) => (
                  <span key={i} className="text-xs font-medium text-primary bg-primary/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full">{point}</span>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>适合季节：{result.marketingDescription.suitableSeasons}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.marketingDescription.suitableScenes.map((scene, i) => (
                  <span key={i} className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{scene}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 商品详情页文案 */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <FileText className="w-4 h-4" /> 商品详情页文案
              </h3>
              <CopyButton text={result.productDetailCopy} section="detail" />
            </div>
            <p className="text-xs md:text-sm text-foreground leading-relaxed whitespace-pre-line">{result.productDetailCopy}</p>
          </div>
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

export default FabricAnalysis;
