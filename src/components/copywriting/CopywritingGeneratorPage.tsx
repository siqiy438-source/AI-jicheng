import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
import { toast } from "sonner";
import { KnowledgeBasePopover } from "@/components/copywriting/KnowledgeBasePopover";
import { getCategoryLabel, type KnowledgeBaseItem } from "@/lib/repositories/knowledge-base";

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

interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

interface ParsedQuestion {
  id: string;
  title: string;
  options: QuestionOption[];
}

const QUESTION_REGEX = /^Q(\d+)\s*[｜|]\s*(.+)$/i;
const LETTER_OPTION_REGEX = /^(?:[-*•]\s*)?([A-Z])(?:[.、:：)）])\s*(.+)$/;
const NUMBER_OPTION_REGEX = /^(?:[-*•]\s*)?([1-9]\d?)(?:[.、:：)）])\s*(.+)$/;
const INLINE_OPTIONS_REGEX = /([A-Z])\.\s*([^A-Z]+?)(?=(?:\s+[A-Z]\.)|$)/g;

const stripMarkdown = (line: string) =>
  line
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();

const normalizeOptionText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(/^[：:]/, "")
    .trim();

const isOptionDescriptionLine = (line: string) => {
  const cleaned = stripMarkdown(line);
  return cleaned.startsWith("适合：") || cleaned.startsWith("示例：") || cleaned.startsWith("这是一种叙事技巧");
};

const parseStandaloneOptionLine = (line: string): { label: string; text: string } | null => {
  const alphaMatch = line.match(LETTER_OPTION_REGEX);
  if (alphaMatch) {
    return { label: alphaMatch[1], text: normalizeOptionText(alphaMatch[2]) };
  }

  const numberMatch = line.match(NUMBER_OPTION_REGEX);
  if (numberMatch) {
    return { label: numberMatch[1], text: normalizeOptionText(numberMatch[2]) };
  }

  return null;
};

const parseQuestionsFromContent = (content: string): ParsedQuestion[] => {
  const lines = content.split(/\r?\n/);
  const questions: ParsedQuestion[] = [];
  let currentQuestion: ParsedQuestion | null = null;

  const commitQuestion = () => {
    if (!currentQuestion) return;
    if (currentQuestion.options.length > 0) {
      questions.push(currentQuestion);
    }
    currentQuestion = null;
  };

  for (const rawLine of lines) {
    const cleanedLine = stripMarkdown(rawLine);
    if (!cleanedLine || cleanedLine === "---") continue;

    const questionMatch = cleanedLine.match(QUESTION_REGEX);
    if (questionMatch) {
      commitQuestion();
      const questionIndex = questionMatch[1];
      const questionTitle = questionMatch[2].trim();
      currentQuestion = {
        id: `Q${questionIndex}`,
        title: questionTitle,
        options: [],
      };
      continue;
    }

    if (!currentQuestion || isOptionDescriptionLine(cleanedLine)) continue;

    INLINE_OPTIONS_REGEX.lastIndex = 0;
    const inlineOptions = Array.from(cleanedLine.matchAll(INLINE_OPTIONS_REGEX));
    if (inlineOptions.length >= 2) {
      for (const match of inlineOptions) {
        const label = match[1];
        const text = normalizeOptionText(match[2]);
        currentQuestion.options.push({
          id: `${currentQuestion.id}_${label}`,
          label,
          text,
        });
      }
      continue;
    }

    const optionMatch = cleanedLine.match(LETTER_OPTION_REGEX);
    if (optionMatch) {
      const label = optionMatch[1];
      const text = normalizeOptionText(optionMatch[2]);
      currentQuestion.options.push({
        id: `${currentQuestion.id}_${label}`,
        label,
        text,
      });
    }
  }

  commitQuestion();

  const normalizedQuestions = questions.map((question) => {
    const uniqueOptions = question.options.filter(
      (option, idx, arr) => arr.findIndex((it) => it.id === option.id) === idx
    );
    return { ...question, options: uniqueOptions };
  });

  if (normalizedQuestions.length > 0) {
    return normalizedQuestions;
  }

  const standaloneQuestions: ParsedQuestion[] = [];
  let currentStandaloneQuestion: ParsedQuestion | null = null;
  let titleCandidate = "";

  const commitStandaloneQuestion = () => {
    if (!currentStandaloneQuestion) return;
    const dedupedOptions = currentStandaloneQuestion.options.filter(
      (option, idx, arr) =>
        arr.findIndex((it) => it.label === option.label && it.text === option.text) === idx
    );
    const hasEnoughOptions = dedupedOptions.length >= 2;
    if (hasEnoughOptions) {
      standaloneQuestions.push({
        ...currentStandaloneQuestion,
        options: dedupedOptions,
      });
    }
    currentStandaloneQuestion = null;
  };

  const startStandaloneQuestion = () => {
    const nextIndex = standaloneQuestions.length + 1;
    currentStandaloneQuestion = {
      id: `S${nextIndex}`,
      title: titleCandidate || "请选择",
      options: [],
    };
  };

  for (const rawLine of lines) {
    const cleanedLine = stripMarkdown(rawLine);
    if (!cleanedLine || cleanedLine === "---") {
      commitStandaloneQuestion();
      continue;
    }

    const option = parseStandaloneOptionLine(cleanedLine);
    if (option) {
      if (!currentStandaloneQuestion) {
        startStandaloneQuestion();
      } else {
        const labelReset =
          (option.label === "A" || option.label === "1") && currentStandaloneQuestion.options.length >= 2;
        if (labelReset) {
          commitStandaloneQuestion();
          startStandaloneQuestion();
        }
      }
      currentStandaloneQuestion!.options.push({
        id: `${currentStandaloneQuestion!.id}_${option.label}_${currentStandaloneQuestion!.options.length + 1}`,
        label: option.label,
        text: option.text,
      });
      continue;
    }

    if (currentStandaloneQuestion && currentStandaloneQuestion.options.length > 0) {
      const isHardBreakLine = /^([Qq]\d+|Step\s*\d+|📋|确认|⚠️|##|###)/.test(cleanedLine);
      if (isHardBreakLine) {
        commitStandaloneQuestion();
        titleCandidate = cleanedLine;
      } else {
        const lastOption = currentStandaloneQuestion.options[currentStandaloneQuestion.options.length - 1];
        lastOption.text = `${lastOption.text} ${normalizeOptionText(cleanedLine)}`.trim();
      }
      continue;
    }

    titleCandidate = cleanedLine;
  }

  commitStandaloneQuestion();
  return standaloneQuestions;
};

const hasConfirmationPrompt = (content: string) =>
  /确认无误[？?]/.test(content) && /确认后/.test(content);

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const WORD_XML_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`));
    reader.readAsDataURL(file);
  });

const extractDocxTextFromXml = (xmlContent: string) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("DOCX 内容解析失败");
  }

  const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS(WORD_XML_NS, "p"));
  const lines = paragraphs
    .map((paragraph) => {
      const textNodes = Array.from(paragraph.getElementsByTagNameNS(WORD_XML_NS, "t"));
      return textNodes.map((node) => node.textContent ?? "").join("").trimEnd();
    })
    .filter(Boolean);

  if (lines.length > 0) {
    return lines.join("\n");
  }

  return Array.from(xmlDoc.getElementsByTagNameNS(WORD_XML_NS, "t"))
    .map((node) => node.textContent ?? "")
    .join("\n")
    .trim();
};

const readDocxFileAsText = async (file: File) => {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file("word/document.xml")?.async("text");

  if (!documentXml) {
    throw new Error("DOCX 文件内容为空或结构异常");
  }

  const extractedText = extractDocxTextFromXml(documentXml).trim();
  if (!extractedText) {
    throw new Error("DOCX 文件未提取到可用文字");
  }

  return extractedText;
};

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
  const [selectedOptionsByMessage, setSelectedOptionsByMessage] = useState<Record<string, Record<string, string[]>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 虚拟键盘弹出时滚动到最新消息
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  const questionMapByMessage = useMemo(() => {
    const map: Record<string, ParsedQuestion[]> = {};
    for (const message of messages) {
      if (message.role !== "assistant" || !message.content) continue;
      const parsed = parseQuestionsFromContent(message.content);
      if (parsed.length > 0) {
        map[message.id] = parsed;
      }
    }
    return map;
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const nextFiles: Array<{ name: string; type: "image" | "text"; dataUrl: string; preview?: string }> = [];
    const unsupportedFiles: string[] = [];
    const failedFiles: string[] = [];

    for (const file of Array.from(files)) {
      const lowerName = file.name.toLowerCase();

      try {
        if (file.type.startsWith("image/")) {
          const dataUrl = await readFileAsDataUrl(file);
          nextFiles.push({ name: file.name, type: "image", dataUrl, preview: dataUrl });
          continue;
        }

        if (file.type === "text/plain" || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) {
          const text = await file.text();
          nextFiles.push({ name: file.name, type: "text", dataUrl: text });
          continue;
        }

        if (file.type === DOCX_MIME_TYPE || lowerName.endsWith(".docx")) {
          const text = await readDocxFileAsText(file);
          nextFiles.push({ name: file.name, type: "text", dataUrl: text });
          continue;
        }

        unsupportedFiles.push(file.name);
      } catch (error) {
        console.error("读取附件失败", file.name, error);
        failedFiles.push(file.name);
      }
    }

    if (nextFiles.length > 0) {
      setAttachedFiles((prev) => [...prev, ...nextFiles]);
    }

    if (unsupportedFiles.length > 0) {
      toast.error(`不支持的文件类型：${unsupportedFiles.join("、")}`);
    }

    if (failedFiles.length > 0) {
      toast.error(`文件读取失败：${failedFiles.join("、")}`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInsertKnowledge = (items: KnowledgeBaseItem[]) => {
    const text = items
      .map(i => `【知识库：${getCategoryLabel(i.category)} - ${i.title}】\n${i.content}`)
      .join('\n\n');
    setPrompt(prev => prev ? `${prev}\n\n${text}` : text);
  };

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = useCallback(async (manualPrompt?: string) => {
    const promptText = (manualPrompt ?? prompt).trim();
    const shouldUseAttachedFiles = manualPrompt === undefined;
    const filesForSend = shouldUseAttachedFiles ? attachedFiles : [];
    if ((!promptText && filesForSend.length === 0) || isGenerating) return;
    // 每轮探索扣5积分，生成阶段扣40积分
    const phaseCost = currentPhase === 'generate' ? 40 : 5;
    if (!checkCredits(featureCode, phaseCost)) return;

    // 构建发送内容：文本文件内容追加到 prompt
    const textFileContents = filesForSend
      .filter(f => f.type === 'text')
      .map(f => `【附件：${f.name}】\n${f.dataUrl}`)
      .join('\n\n');
    const imageDataUrls = filesForSend.filter(f => f.type === 'image').map(f => f.dataUrl);
    const finalPrompt = textFileContents ? `${promptText}\n\n${textFileContents}` : promptText;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: promptText,
      timestamp: new Date(),
      imageUrls: imageDataUrls.length > 0 ? imageDataUrls : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = finalPrompt;
    setPrompt("");
    if (shouldUseAttachedFiles) {
      setAttachedFiles([]);
    }
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

  const toggleQuestionOption = (messageId: string, questionId: string, optionId: string) => {
    setSelectedOptionsByMessage((prev) => {
      const selectedInMessage = prev[messageId] ?? {};
      const selectedInQuestion = selectedInMessage[questionId] ?? [];
      const alreadySelected = selectedInQuestion.includes(optionId);
      const nextQuestionSelection = alreadySelected
        ? selectedInQuestion.filter((id) => id !== optionId)
        : [...selectedInQuestion, optionId];

      return {
        ...prev,
        [messageId]: {
          ...selectedInMessage,
          [questionId]: nextQuestionSelection,
        },
      };
    });
  };

  const buildSelectionAnswer = (messageId: string, questions: ParsedQuestion[]) => {
    const selectedInMessage = selectedOptionsByMessage[messageId] ?? {};

    const lines = questions
      .map((question) => {
        const selectedIds = selectedInMessage[question.id] ?? [];
        if (selectedIds.length === 0) return null;

        const selected = question.options.filter((option) => selectedIds.includes(option.id));
        if (selected.length === 0) return null;

        const labels = selected.map((option) => option.label).join("、");
        const values = selected.map((option) => option.text).join("；");
        const prefix = /^Q\d+$/i.test(question.id) ? `${question.id}: ` : "选择: ";
        return `${prefix}${labels}（${values}）`;
      })
      .filter(Boolean) as string[];

    return lines.join("\n");
  };

  const handleSendSelections = async (messageId: string, questions: ParsedQuestion[]) => {
    const selectionAnswer = buildSelectionAnswer(messageId, questions);
    if (!selectionAnswer) return;

    await handleSend(selectionAnswer);
    setSelectedOptionsByMessage((prev) => ({
      ...prev,
      [messageId]: {},
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
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
      {/* 手机端紧凑 header：返回 + 工具名 + 阶段 badge */}
      <div className="flex md:hidden items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/copywriting")}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <img src={iconSrc} alt={title} className="w-6 h-6 object-contain flex-shrink-0" />
          <span className="font-semibold text-foreground text-sm truncate">{title}</span>
        </div>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
          currentPhase === 'explore' ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
        )}>
          {currentPhase === 'explore' ? '探索中' : '生成中'}
        </span>
      </div>

      {/* 桌面端：返回按钮 */}
      <button
        onClick={() => navigate("/copywriting")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回文案工具</span>
      </button>

      {/* 桌面端：页面标题 */}
      <div className="hidden md:flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
          <img src={iconSrc} alt={title} className="w-14 h-14 object-contain" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
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
                {/*
                  AI 问题场景下仅显示可点击选项，避免“原文题目 + 选项UI”重复展示
                */}
                {/**/}
                <div
                  className={cn(
                    "rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3",
                    message.role === "user"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                      : "glass-card"
                  )}
                >
                  {(() => {
                    const hasInteractiveQuestions =
                      message.role === "assistant" && questionMapByMessage[message.id]?.length > 0;

                    return (
                      <>
                  {message.role === "assistant" ? (
                    message.content ? (
                    !hasInteractiveQuestions ? (
                      <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-bold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2 prose-h4:text-sm prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3 prose-strong:text-foreground prose-ul:text-foreground prose-ul:my-2 prose-ol:text-foreground prose-ol:my-2 prose-li:text-foreground prose-li:my-0.5 prose-hr:my-6 prose-hr:border-border/50 text-sm leading-relaxed select-text">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : null
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

                  {message.role === "assistant" &&
                    questionMapByMessage[message.id]?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                        <div className="text-xs text-muted-foreground">点击选择（支持多选）</div>
                        {questionMapByMessage[message.id].map((question) => {
                          const selectedInQuestion =
                            selectedOptionsByMessage[message.id]?.[question.id] ?? [];
                          return (
                            <div key={question.id} className="space-y-2">
                              <p className="text-sm font-semibold text-foreground">{question.id} | {question.title}</p>
                              <div className="space-y-2">
                                {question.options.map((option) => {
                                  const isSelected = selectedInQuestion.includes(option.id);
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => toggleQuestionOption(message.id, question.id, option.id)}
                                      className={cn(
                                        "w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors min-h-[44px]",
                                        isSelected
                                          ? "border-orange-500 bg-orange-50 text-orange-700"
                                          : "border-border/70 bg-background/60 text-foreground hover:bg-secondary/40"
                                      )}
                                    >
                                      <span className={cn("font-semibold mr-2", isSelected ? "text-orange-700" : "text-foreground")}>
                                        {option.label}.
                                      </span>
                                      <span>{option.text}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleSendSelections(message.id, questionMapByMessage[message.id])}
                            disabled={!buildSelectionAnswer(message.id, questionMapByMessage[message.id]) || isGenerating}
                            className={cn(
                              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                              !buildSelectionAnswer(message.id, questionMapByMessage[message.id]) || isGenerating
                                ? "bg-secondary/50 text-muted-foreground/60 cursor-not-allowed"
                                : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                            )}
                          >
                            发送所选答案
                          </button>
                        </div>
                      </div>
                    )}

                  {message.role === "assistant" &&
                    (!questionMapByMessage[message.id] || questionMapByMessage[message.id].length === 0) &&
                    hasConfirmationPrompt(message.content) && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-2">点击选择</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleSend("确认，无需调整，开始生成")}
                            className="px-3 py-1.5 rounded-lg text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                          >
                            确认并开始生成
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSend("需要调整，我要修改选项")}
                            className="px-3 py-1.5 rounded-lg text-sm bg-secondary/60 text-foreground border border-border hover:bg-secondary transition-colors"
                          >
                            需要调整
                          </button>
                        </div>
                      </div>
                    )}
                      </>
                    );
                  })()}

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
          <div className="flex overflow-x-auto gap-2 mb-3 pb-1 -mx-1 px-1 scrollbar-hide">
            {attachedFiles.map((file, index) => (
              <div key={index} className="relative group flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2.5 py-1.5 text-xs flex-shrink-0">
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
          onFocus={() => {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
          }}
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
              accept="image/*,.txt,.md,.docx"
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
            <KnowledgeBasePopover onInsert={handleInsertKnowledge} disabled={isGenerating} />
          </div>
          <button
            onClick={() => void handleSend()}
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
