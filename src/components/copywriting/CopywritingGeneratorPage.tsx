import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Send,
  Copy,
  Check,
  Bot,
  Sparkles,
} from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { GeneratingLoader } from "@/components/GeneratingLoader";
import { cn } from "@/lib/utils";
import {
  generateCopywriting,
  continueConversation,
  isZenmuxConfigured,
  type ChatMessage,
} from "@/lib/zenmux";
import ReactMarkdown from "react-markdown";
import { saveTextWork } from "@/lib/repositories/works";
import { useCreditCheck } from "@/hooks/use-credit-check";
import { InsufficientBalanceDialog } from "@/components/InsufficientBalanceDialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface CopywritingGeneratorPageProps {
  title: string;
  subtitle: string;
  iconSrc: string;
  agentId: string;
  placeholderText: string;
  featureCode: string;
  welcomeMessage?: string;
}

export const CopywritingGeneratorPage = ({
  title,
  subtitle,
  iconSrc,
  agentId,
  placeholderText,
  featureCode,
  welcomeMessage,
}: CopywritingGeneratorPageProps) => {
  const navigate = useNavigate();
  const {
    checkCredits,
    showInsufficientDialog,
    requiredAmount,
    featureName,
    currentBalance,
    goToRecharge,
    dismissDialog,
    refreshBalance,
  } = useCreditCheck();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>(
    welcomeMessage
      ? [{ id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() }]
      : []
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;
    if (!checkCredits(featureCode)) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setIsGenerating(true);

    const assistantMessageId = (Date.now() + 1).toString();

    if (!isZenmuxConfigured) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "ZenMux API 尚未配置，请先设置 API Key。", timestamp: new Date() },
        ]);
        setIsGenerating(false);
      }, 500);
      return;
    }

    const history: ChatMessage[] = messages
      .filter((m) => m.content.trim() && m.id !== "welcome")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const isFirstMessage = history.filter((m) => m.role === "user").length === 0;

    try {
      let fullContent = "";

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      const callbacks = {
        onStart: () => {},
        onToken: (token: string) => {
          fullContent += token;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: fullContent } : m))
          );
        },
        onComplete: (finalContent: string) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: finalContent } : m))
          );
          setIsGenerating(false);
          void refreshBalance();

          if (finalContent.trim()) {
            const titleText = currentPrompt.trim().slice(0, 24) || "文案";
            void saveTextWork({
              title: `${title}：${titleText}`,
              type: "copywriting",
              tool: `AI 文案-${title}`,
              text: finalContent,
              metadata: { agentId, prompt: currentPrompt },
            }).catch((err) => console.error("自动保存文案失败", err));
          }

          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        },
        onError: (err: Error) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: `⚠️ 生成失败: ${err.message}` } : m
            )
          );
          setIsGenerating(false);
        },
      };

      if (isFirstMessage) {
        await generateCopywriting(currentPrompt, agentId, callbacks, featureCode);
      } else {
        await continueConversation(history, currentPrompt, agentId, callbacks, featureCode);
      }
    } catch (err) {
      setIsGenerating(false);
    }
  }, [prompt, messages, isGenerating, agentId, featureCode, checkCredits, refreshBalance, title]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageLayout className="py-4 md:py-8">
      {/* 返回按钮 - 仅桌面端 */}
      <button
        onClick={() => navigate("/copywriting")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回文案工具</span>
      </button>

      {/* 页面标题 */}
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center">
          <img src={iconSrc} alt={title} className="w-12 h-12 md:w-14 md:h-14 object-contain" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>

      {/* 聊天消息区域 */}
      {messages.length > 0 && (
        <div className="space-y-4 md:space-y-6 mb-4 md:mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3 md:gap-4", message.role === "user" ? "flex-row-reverse" : "")}
            >
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0",
                  message.role === "user"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : "bg-gradient-to-br from-purple-100 to-purple-50"
                )}
              >
                {message.role === "user" ? (
                  <span className="text-white text-xs md:text-sm font-medium">我</span>
                ) : (
                  <Bot className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                )}
              </div>

              <div className={cn("flex-1 max-w-[85%] md:max-w-[80%]", message.role === "user" ? "flex flex-col items-end" : "")}>
                <div
                  className={cn(
                    "rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3",
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                      : "glass-card"
                  )}
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                    <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-semibold prose-h3:text-base prose-h4:text-sm prose-p:text-foreground prose-p:leading-relaxed prose-p:my-2.5 prose-strong:text-foreground prose-ul:text-foreground prose-ul:my-2 prose-ol:text-foreground prose-ol:my-2 prose-li:text-foreground prose-li:my-0.5 text-sm font-medium leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    ) : isGenerating ? (
                    <div className="flex items-center gap-2 py-1">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span className="text-sm text-muted-foreground">AI 正在思考中...</span>
                    </div>
                    ) : null
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  )}

                  {message.role === "assistant" && message.content && !isGenerating && (
                    <div className="flex justify-end mt-3 pt-3 border-t border-border/50">
                      <button
                        onClick={() => copyContent(message.id, message.content)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-500">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>复制</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 输入卡片 */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          rows={4}
          enterKeyHint="send"
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
        />

        <div className="border-t border-border/50 my-3" />

        <div className="flex items-center justify-end">
          <button
            onClick={handleSend}
            disabled={!prompt.trim() || isGenerating}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              prompt.trim() && !isGenerating
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 shadow-md"
                : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 空状态提示 */}
      {messages.length === 0 && !isGenerating && (
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground mb-2">输入你的需求，开始创作</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      )}

      <InsufficientBalanceDialog
        open={showInsufficientDialog}
        onOpenChange={dismissDialog}
        balance={currentBalance}
        required={requiredAmount}
        featureName={featureName}
        onRecharge={goToRecharge}
      />
    </PageLayout>
  );
};
