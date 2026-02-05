import { useState, useRef, useCallback } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  ArrowLeft,
  FileText,
  X,
  Sparkles,
  Loader2,
  Wand2,
  Send,
  Paperclip,
  Bot,
  Copy,
  Check,
  ChevronDown,
  File,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { generateCopywriting, continueConversation, isZenmuxConfigured, type ChatMessage } from "@/lib/zenmux";
import ReactMarkdown from "react-markdown";

// 智能体选项
const agentOptions = [
  { id: "xiaohongshu", name: "小红书文案", icon: "📕", description: "爆款笔记、种草文案" },
  { id: "douyin", name: "抖音文案", icon: "🎵", description: "短视频脚本、口播文案" },
  { id: "weixin", name: "公众号文案", icon: "💚", description: "深度文章、推文写作" },
  { id: "ad", name: "广告文案", icon: "📢", description: "营销广告、促销文案" },
  { id: "product", name: "产品文案", icon: "🏷️", description: "详情页、卖点提炼" },
  { id: "general", name: "通用写作", icon: "✏️", description: "各类文案通用助手" },
];

// 消息类型
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string }[];
  timestamp: Date;
}

// 文件类型图标
const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv"))
    return <FileSpreadsheet className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const AICopywriting = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 状态管理
  const [prompt, setPrompt] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(agentOptions[0]);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; preview?: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        type: file.type,
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 移除文件
  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 一键优化提示词
  const optimizePrompt = () => {
    if (!prompt.trim()) return;
    const optimizations: Record<string, string> = {
      xiaohongshu: "，要求：吸引眼球的标题、适当使用emoji、口语化表达、加入互动引导",
      douyin: "，要求：开头3秒抓住注意力、节奏感强、口语化、有记忆点",
      weixin: "，要求：深度有价值、逻辑清晰、金句点睛、引发思考",
      ad: "，要求：突出卖点、制造紧迫感、明确行动号召、简洁有力",
      product: "，要求：突出核心卖点、解决用户痛点、场景化描述、数据支撑",
      general: "，要求：表达清晰、结构完整、语言流畅、重点突出",
    };
    setPrompt(prompt + (optimizations[selectedAgent.id] || ""));
  };

  // 复制内容
  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) return;

    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");
    setUploadedFiles([]);
    setIsGenerating(true);
    setStreamingContent("");

    // 创建一个占位的 AI 消息用于流式更新
    const assistantMessageId = (Date.now() + 1).toString();

    // 检查是否配置了 ZenMux
    if (!isZenmuxConfigured) {
      // 未配置时使用模拟响应
      setTimeout(() => {
        const mockResponse = `# AI 文案生成

您的 ZenMux API 尚未配置。请按以下步骤设置：

1. 访问 [ZenMux](https://zenmux.ai) 并注册账号
2. 在 User Console > API Keys 页面获取 API Key
3. 在项目根目录的 \`.env.local\` 文件中设置：
   \`\`\`
   VITE_ZENMUX_API_KEY=你的API密钥
   \`\`\`
4. 重启开发服务器

配置完成后，您就可以使用真正的 AI 生成文案了！`;

        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: mockResponse,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsGenerating(false);
      }, 500);
      return;
    }

    // 构建历史消息（转换为 ChatMessage 格式）
    const history: ChatMessage[] = messages
      .filter(m => m.content.trim())
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 判断是首次对话还是继续对话
    const isFirstMessage = history.length === 0;

    try {
      let fullContent = "";

      // 先添加一个空的 AI 消息占位
      setMessages((prev) => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }]);

      const callbacks = {
        onStart: () => {
          setStreamingContent("");
        },
        onToken: (token: string) => {
          fullContent += token;
          setStreamingContent(fullContent);
          // 实时更新消息内容
          setMessages((prev) =>
            prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: fullContent }
                : m
            )
          );
        },
        onComplete: (finalContent: string) => {
          setMessages((prev) =>
            prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: finalContent }
                : m
            )
          );
          setIsGenerating(false);
          setStreamingContent("");
          // 滚动到底部
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        },
        onError: (err: Error) => {
          setError(err.message);
          setIsGenerating(false);
          // 更新消息显示错误
          setMessages((prev) =>
            prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: `⚠️ 生成失败: ${err.message}` }
                : m
            )
          );
        },
      };

      if (isFirstMessage) {
        await generateCopywriting(currentPrompt, selectedAgent.id, callbacks);
      } else {
        await continueConversation(history, currentPrompt, selectedAgent.id, callbacks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生未知错误");
      setIsGenerating(false);
    }
  }, [prompt, uploadedFiles, messages, selectedAgent.id]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageLayout className="py-4 md:py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回首页</span>
      </button>

      {/* 页面标题 */}
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
          <FileText className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">AI 文案</h1>
          <p className="text-muted-foreground text-sm">选择智能体，上传素材，智能生成文案</p>
        </div>
      </div>

      {/* 聊天消息区域 */}
      {messages.length > 0 && (
        <div className="space-y-4 md:space-y-6 mb-4 md:mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 md:gap-4",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              {/* 头像 */}
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

              {/* 消息内容 */}
              <div
                className={cn(
                  "flex-1 max-w-[85%] md:max-w-[80%]",
                  message.role === "user" ? "flex flex-col items-end" : ""
                )}
              >
                {/* 附件显示 */}
                {message.files && message.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 px-2 py-1 md:px-2.5 md:py-1.5 bg-secondary/50 rounded-lg text-xs md:text-sm text-muted-foreground"
                      >
                        {getFileIcon(file.type)}
                        <span className="max-w-[80px] md:max-w-[120px] truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 文本内容 */}
                <div
                  className={cn(
                    "rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3",
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                      : "glass-card"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}

                  {/* AI 回复的操作按钮 */}
                  {message.role === "assistant" && (
                    <div className="flex justify-end mt-3 pt-3 border-t border-border/50">
                      <button
                        onClick={() => copyContent(message.id, message.content)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 md:py-1 rounded-lg text-xs text-muted-foreground hover:bg-secondary/50 transition-colors touch-target"
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

          {/* 生成中状态 */}
          {isGenerating && (
            <div className="flex gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="glass-card rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在生成文案...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* 输入卡片 */}
      <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg">
        {/* 已上传的文件预览 */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 md:mb-4 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 bg-secondary/50 rounded-lg md:rounded-xl text-xs md:text-sm group"
              >
                {getFileIcon(file.type)}
                <span className="max-w-[100px] md:max-w-[150px] truncate text-foreground">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="w-5 h-5 md:w-4 md:h-4 rounded-full bg-black/10 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 md:w-2.5 md:h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入区域 */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你需要的文案内容..."
          rows={3}
          enterKeyHint="send"
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base leading-relaxed"
        />

        {/* 分隔线 */}
        <div className="border-t border-border/50 my-3" />

        {/* 工具栏 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 智能体选择 */}
            <div className="relative">
              <button
                onClick={() => setShowAgentMenu(!showAgentMenu)}
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-full text-sm transition-all border",
                  "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 active:bg-purple-100"
                )}
              >
                <span>{selectedAgent.icon}</span>
                <span className="max-w-[70px] md:max-w-none truncate">{selectedAgent.name}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 md:w-4 md:h-4 transition-transform", showAgentMenu && "rotate-180")} />
              </button>
              {showAgentMenu && (
                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-2 z-10 min-w-[180px] md:min-w-[200px] max-h-[60vh] overflow-y-auto">
                  {agentOptions.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowAgentMenu(false);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 px-3 md:px-4 py-2.5 hover:bg-secondary/50 active:bg-secondary transition-colors text-left",
                        selectedAgent.id === agent.id && "bg-purple-50"
                      )}
                    >
                      <span className="text-lg">{agent.icon}</span>
                      <div>
                        <div className={cn(
                          "text-sm font-medium",
                          selectedAgent.id === agent.id ? "text-purple-700" : "text-foreground"
                        )}>
                          {agent.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{agent.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 分隔符 */}
            <div className="hidden md:block w-px h-5 bg-border mx-1" />

            {/* 上传文件按钮 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx,.pdf,.png,.jpg,.jpeg,.csv,.xlsx"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 p-2 md:p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary transition-all touch-target"
              title="上传参考文件"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          {/* 右侧按钮 */}
          <div className="flex items-center justify-end gap-2">
            {/* 一键优化 */}
            <button
              onClick={optimizePrompt}
              disabled={!prompt.trim()}
              className={cn(
                "flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm transition-all border",
                prompt.trim()
                  ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 active:bg-purple-100"
                  : "bg-secondary/30 border-transparent text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>一键优化</span>
            </button>

            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={(!prompt.trim() && uploadedFiles.length === 0) || isGenerating}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                (prompt.trim() || uploadedFiles.length > 0) && !isGenerating
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 shadow-md"
                  : "bg-secondary/50 text-muted-foreground/50 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 空状态提示 */}
      {messages.length === 0 && !isGenerating && (
        <div className="text-center py-12 md:py-16">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground mb-2">选择智能体，输入需求开始创作</p>
          <p className="text-sm text-muted-foreground">支持上传文档、图片作为参考素材</p>
        </div>
      )}
    </PageLayout>
  );
};

export default AICopywriting;
