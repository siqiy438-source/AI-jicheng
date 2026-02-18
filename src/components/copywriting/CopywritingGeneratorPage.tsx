import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Send,
  Copy,
  Check,
  Sparkles,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  RefreshCw,
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
  imageUrls?: string[];
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
  const [currentPhase, setCurrentPhase] = useState<'explore' | 'generate'>('explore');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; type: 'image' | 'text'; dataUrl: string; preview?: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setAttachedFiles(prev => [...prev, { name: file.name, type: 'image', dataUrl, preview: dataUrl }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setAttachedFiles(prev => [...prev, { name: file.name, type: 'text', dataUrl: text }]);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = useCallback(async () => {
    if ((!prompt.trim() && attachedFiles.length === 0) || isGenerating) return;
    // 仅在生成阶段检查积分
    if (currentPhase === 'generate' && !checkCredits(featureCode)) return;

    // 构建发送内容：文本文件内容追加到 prompt
    const textFileContents = attachedFiles
      .filter(f => f.type === 'text')
      .map(f => `【附件：${f.name}】\n${f.dataUrl}`)
      .join('\n\n');
    const imageDataUrls = attachedFiles.filter(f => f.type === 'image').map(f => f.dataUrl);
    const finalPrompt = textFileContents ? `${prompt.trim()}\n\n${textFileContents}` : prompt.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
      imageUrls: imageDataUrls.length > 0 ? imageDataUrls : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = finalPrompt;
    setPrompt("");
    setAttachedFiles([]);
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

          // 检测确认卡标记 → 下一条消息进入 generate 阶段
          if (finalContent.includes('📋') && finalContent.includes('确认')) {
            setCurrentPhase('generate');
          }

          // 仅在生成阶段刷新余额和保存作品
          if (currentPhase === 'generate') {
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
        await generateCopywriting(currentPrompt, agentId, callbacks, featureCode, currentPhase, imageDataUrls.length > 0 ? imageDataUrls : undefined);
      } else {
        await continueConversation(history, currentPrompt, agentId, callbacks, featureCode, currentPhase, imageDataUrls.length > 0 ? imageDataUrls : undefined);
      }
    } catch (err) {
      setIsGenerating(false);
    }
  }, [prompt, messages, isGenerating, agentId, featureCode, checkCredits, refreshBalance, title, currentPhase, attachedFiles]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 重新生成：静默删除最后一条 AI 回复，重新调用 API
  const handleRegenerate = useCallback(async () => {
    if (isGenerating) return;

    // 找到最后一条 assistant 消息并移除
    const withoutLast = [...messages];
    for (let i = withoutLast.length - 1; i >= 0; i--) {
      if (withoutLast[i].role === "assistant" && withoutLast[i].id !== "welcome") {
        withoutLast.splice(i, 1);
        break;
      }
    }
    setMessages(withoutLast);
    setIsGenerating(true);

    const assistantMessageId = Date.now().toString();
    const history: ChatMessage[] = withoutLast
      .filter((m) => m.content.trim() && m.id !== "welcome")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      let fullContent = "";
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      const regenPrompt = "请重新生成上一条内容，要求不同的表达方式和角度";
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
          if (finalContent.includes('📋') && finalContent.includes('确认')) {
            setCurrentPhase('generate');
          }
          if (currentPhase === 'generate') {
            void refreshBalance();
            if (finalContent.trim()) {
              void saveTextWork({
                title: `${title}：重新生成`,
                type: "copywriting",
                tool: `AI 文案-${title}`,
                text: finalContent,
                metadata: { agentId, prompt: regenPrompt },
              }).catch((err) => console.error("自动保存文案失败", err));
            }
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

      await continueConversation(history, regenPrompt, agentId, callbacks, featureCode, currentPhase);
    } catch {
      setIsGenerating(false);
    }
  }, [messages, isGenerating, agentId, featureCode, currentPhase, refreshBalance, title]);

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
                  "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                  message.role === "user"
                    ? "bg-gradient-to-br from-orange-500 to-orange-600"
                    : ""
                )}
              >
                {message.role === "user" ? (
                  <span className="text-white text-xs md:text-sm font-medium">我</span>
                ) : (
                  <img src="/icons/copywriting-bot-avatar.png" alt="AI" className="w-full h-full object-cover" />
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
                    <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-h4:text-sm prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3 prose-strong:text-foreground prose-ul:text-foreground prose-ul:my-2 prose-ol:text-foreground prose-ol:my-2 prose-li:text-foreground prose-li:my-0.5 prose-hr:my-6 prose-hr:border-border/50 text-sm leading-relaxed select-text">
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
                    <div>
                      {message.imageUrls && message.imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.imageUrls.map((url, i) => (
                            <img key={i} src={url} alt="" className="max-w-[120px] max-h-[120px] rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>
                  )}

                  {message.role === "assistant" && message.content && !isGenerating && (
                    <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border/50">
                      <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary/50 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>重新生成</span>
                      </button>
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
        {/* 附件预览 */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((file, index) => (
              <div key={index} className="relative group flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2.5 py-1.5 text-xs">
                {file.type === 'image' ? (
                  <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="max-w-[100px] truncate text-muted-foreground">{file.name}</span>
                <button onClick={() => removeFile(index)} className="ml-1 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.txt,.md"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
              title="上传文件"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={(!prompt.trim() && attachedFiles.length === 0) || isGenerating}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              (prompt.trim() || attachedFiles.length > 0) && !isGenerating
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
