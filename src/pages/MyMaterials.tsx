import { useEffect, useMemo, useRef, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import {
  ArrowLeft,
  Upload,
  Grid3X3,
  List,
  Search,
  FolderPlus,
  Download,
  Trash2,
  Move,
  Image,
  FileImage,
  Film,
  FileText,
  Folder,
  ChevronRight,
  Plus,
  X,
  Check,
  BookOpen,
  Pencil,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  createMaterialFolder,
  deleteMaterial,
  getMaterialDownloadUrl,
  listMaterialFolders,
  listMaterials,
  type MaterialFolderItem,
  type MaterialListItem,
  uploadMaterials,
} from "@/lib/repositories/materials";
import {
  createKnowledgeEntry,
  deleteKnowledgeEntry,
  getCategoryLabel,
  KNOWLEDGE_CATEGORIES,
  type KnowledgeBaseItem,
  listKnowledgeBase,
  updateKnowledgeEntry,
} from "@/lib/repositories/knowledge-base";
import { chatStream } from "@/lib/zenmux";
import { toast } from "sonner";
import { downloadGeneratedImage } from "@/lib/image-utils";

// 获取文件类型图标
const getFileIcon = (type: string) => {
  switch (type) {
    case "image":
      return <FileImage className="w-5 h-5" />;
    case "video":
      return <Film className="w-5 h-5" />;
    case "document":
      return <FileText className="w-5 h-5" />;
    default:
      return <FileImage className="w-5 h-5" />;
  }
};

const MyMaterials = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'knowledge'>('materials');
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [folders, setFolders] = useState<MaterialFolderItem[]>([]);
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 知识库状态
  const [kbItems, setKbItems] = useState<KnowledgeBaseItem[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbActiveCategory, setKbActiveCategory] = useState<string>('all');
  const [showKbDialog, setShowKbDialog] = useState(false);
  const [editingKbItem, setEditingKbItem] = useState<KnowledgeBaseItem | null>(null);
  const [kbForm, setKbForm] = useState({ title: '', category: 'store_basic', content: '' });

  // AI 导入状态
  const [showAiImport, setShowAiImport] = useState(false);
  const [aiImportText, setAiImportText] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiPreviewEntries, setAiPreviewEntries] = useState<Array<{ title: string; category: string; content: string; selected: boolean }>>([]);
  const [aiSaving, setAiSaving] = useState(false);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [folderRows, materialRows] = await Promise.all([listMaterialFolders(), listMaterials()]);
      setFolders(folderRows);
      setMaterials(materialRows);
    } catch (error) {
      console.error("加载素材失败", error);
      toast.error("加载素材失败");
    } finally {
      setLoading(false);
    }
  };

  const refreshKbData = async () => {
    setKbLoading(true);
    try {
      setKbItems(await listKnowledgeBase());
    } catch {
      toast.error("加载知识库失败");
    } finally {
      setKbLoading(false);
    }
  };

  const openKbDialog = (item?: KnowledgeBaseItem) => {
    if (item) {
      setEditingKbItem(item);
      setKbForm({ title: item.title, category: item.category, content: item.content });
    } else {
      setEditingKbItem(null);
      setKbForm({ title: '', category: 'store_basic', content: '' });
    }
    setShowKbDialog(true);
  };

  const handleKbSave = async () => {
    if (!kbForm.title.trim() || !kbForm.content.trim()) {
      toast.error("标题和内容不能为空");
      return;
    }
    try {
      if (editingKbItem) {
        await updateKnowledgeEntry(editingKbItem.id, kbForm);
        toast.success("已更新");
      } else {
        await createKnowledgeEntry(kbForm);
        toast.success("已添加");
      }
      setShowKbDialog(false);
      await refreshKbData();
    } catch {
      toast.error("保存失败");
    }
  };

  const handleKbDelete = async (id: string) => {
    try {
      await deleteKnowledgeEntry(id);
      setKbItems(prev => prev.filter(i => i.id !== id));
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleAiAnalyze = async () => {
    if (!aiImportText.trim()) {
      toast.error("请先粘贴你的店铺信息");
      return;
    }
    setAiAnalyzing(true);
    setAiPreviewEntries([]);
    let fullText = '';
    chatStream(
      aiImportText,
      'kb_analyzer',
      {
        onToken: (token) => { fullText += token; },
        onComplete: (text) => {
          try {
            // 提取 JSON（兼容 AI 可能包裹在 ```json 里的情况）
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
            const entries = (parsed.entries ?? []).map((e: { title: string; category: string; content: string }) => ({
              ...e,
              selected: true,
            }));
            setAiPreviewEntries(entries);
            if (entries.length === 0) toast.error("未能提取到有效条目，请检查输入内容");
          } catch {
            toast.error("AI 返回格式异常，请重试");
          }
          setAiAnalyzing(false);
        },
        onError: () => {
          toast.error("AI 分析失败，请重试");
          setAiAnalyzing(false);
        },
      },
    );
  };

  const handleAiSave = async () => {
    const toSave = aiPreviewEntries.filter(e => e.selected);
    if (toSave.length === 0) {
      toast.error("请至少选择一条条目");
      return;
    }
    setAiSaving(true);
    try {
      for (const entry of toSave) {
        await createKnowledgeEntry({ title: entry.title, category: entry.category, content: entry.content });
      }
      toast.success(`已保存 ${toSave.length} 条知识库条目`);
      setShowAiImport(false);
      setAiImportText('');
      setAiPreviewEntries([]);
      await refreshKbData();
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setAiSaving(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (activeTab === 'knowledge' && kbItems.length === 0) {
      refreshKbData();
    }
  }, [activeTab]);

  // 过滤素材
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = !currentFolder || material.folder === currentFolder;
      return matchesSearch && matchesFolder;
    });
  }, [materials, searchQuery, currentFolder]);

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    try {
      await uploadMaterials(files, currentFolder);
      toast.success(`已上传 ${files.length} 个文件`);
      await refreshData();
    } catch (error) {
      console.error("上传素材失败", error);
      toast.error("上传素材失败");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;

    if (!files || files.length === 0) {
      return;
    }

    try {
      await uploadMaterials(files, currentFolder);
      toast.success(`已上传 ${files.length} 个文件`);
      await refreshData();
    } catch (error) {
      console.error("拖拽上传失败", error);
      toast.error("拖拽上传失败");
    }
  };

  // 创建新文件夹
  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }

    try {
      const folder = await createMaterialFolder(newFolderName);
      if (folder) {
        toast.success("文件夹创建成功");
        setCurrentFolder(folder.name);
        await refreshData();
      }
    } catch (error) {
      console.error("创建文件夹失败", error);
      toast.error("创建文件夹失败，可能名称重复");
    } finally {
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };

  // 切换选择
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDownload = async (material: MaterialListItem) => {
    try {
      const signedUrl = await getMaterialDownloadUrl(material.storageBucket, material.storagePath);
      if (!signedUrl) {
        toast.error("获取下载链接失败");
        return;
      }
      await downloadGeneratedImage(signedUrl, material.name);
    } catch (error) {
      console.error("下载失败", error);
      toast.error("下载失败");
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      await deleteMaterial(materialId);
      setSelectedItems((prev) => prev.filter((id) => id !== materialId));
      setMaterials((prev) => prev.filter((item) => item.id !== materialId));
      setFolders((prev) =>
        prev.map((folder) => {
          const material = materials.find((item) => item.id === materialId);
          if (!material || material.folder !== folder.name) {
            return folder;
          }
          return { ...folder, count: Math.max(0, folder.count - 1) };
        })
      );
      toast.success("素材已删除");
    } catch (error) {
      console.error("删除素材失败", error);
      toast.error("删除素材失败");
    }
  };

  return (
    <PageLayout className="py-4 md:py-8" maxWidth="6xl">
      {/* 返回按钮 - 仅桌面端显示 */}
      <button
        onClick={() => navigate("/")}
        className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回首页</span>
      </button>

      {/* 移动端页面切换 Tab */}
      <div className="flex md:hidden gap-1 p-1 bg-secondary/50 rounded-xl mb-4 w-fit">
        <button
          onClick={() => navigate("/my-works")}
          className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          我的作品
        </button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-sm text-foreground">
          我的素材
        </button>
      </div>

      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
            {activeTab === 'materials'
              ? <Upload className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />
              : <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />
            }
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {activeTab === 'materials' ? '我的素材' : '文字知识库'}
            </h1>
            <p className="text-muted-foreground text-sm hidden sm:block">
              {activeTab === 'materials' ? '管理你上传的所有素材文件' : '存储店铺信息，在文案创作中一键调用'}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        {activeTab === 'materials' ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg md:rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md touch-target text-sm md:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">上传素材</span>
            <span className="sm:hidden">上传</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAiImport(true); setAiPreviewEntries([]); setAiImportText(''); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg md:rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all shadow-md touch-target text-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI 智能导入</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button
              onClick={() => openKbDialog()}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg md:rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md touch-target text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新建条目</span>
              <span className="sm:hidden">新建</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('materials')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'materials' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          图片素材
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'knowledge' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          文字知识库
        </button>
      </div>

      {/* 移动端文件夹横向滚动 */}
      {activeTab === 'materials' && <div className="md:hidden mb-4 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          <button
            onClick={() => setCurrentFolder(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors touch-target flex-shrink-0",
              !currentFolder ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
            )}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>全部</span>
            <span className="text-sm opacity-70">{materials.length}</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.name)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors touch-target flex-shrink-0",
                currentFolder === folder.name ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
              )}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{folder.name}</span>
              <span className="text-sm opacity-70">{folder.count}</span>
            </button>
          ))}
        </div>
      </div>}

      {/* 面包屑导航 - 仅桌面端 */}
      {activeTab === 'materials' && <div className="hidden md:flex items-center gap-2 mb-6 text-sm">
        <button
          onClick={() => setCurrentFolder(null)}
          className={cn(
            "hover:text-foreground transition-colors",
            !currentFolder ? "text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          全部素材
        </button>
        {currentFolder && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{currentFolder}</span>
          </>
        )}
      </div>}

      {activeTab === 'materials' && <div className="flex gap-6">
        {/* 左侧文件夹列表 - 仅桌面端显示 */}
        <div className="hidden md:block w-48 flex-shrink-0">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">文件夹</h3>
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="p-1 hover:bg-secondary rounded transition-colors touch-target"
              >
                <FolderPlus className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 新建文件夹输入 */}
            {showNewFolderInput && (
              <div className="flex items-center gap-1 mb-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="文件夹名称"
                  className="flex-1 px-2 py-1 text-sm bg-secondary/50 rounded focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && createNewFolder()}
                />
                <button onClick={createNewFolder} className="p-1 hover:bg-secondary rounded touch-target">
                  <Check className="w-3 h-3 text-green-500" />
                </button>
                <button
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName("");
                  }}
                  className="p-1 hover:bg-secondary rounded touch-target"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => setCurrentFolder(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors text-left touch-target",
                  !currentFolder ? "bg-amber-50 text-amber-700" : "hover:bg-secondary"
                )}
              >
                <Folder className="w-4 h-4" />
                <span className="flex-1">全部</span>
                <span className="text-xs text-muted-foreground">{materials.length}</span>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.name)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors text-left touch-target",
                    currentFolder === folder.name ? "bg-amber-50 text-amber-700" : "hover:bg-secondary"
                  )}
                >
                  <Folder className="w-4 h-4" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folder.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 min-w-0">
          {/* 工具栏 */}
          <div className="glass-card rounded-xl p-3 md:p-4 mb-4">
            <div className="flex items-center justify-between gap-2 md:gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索素材..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  enterKeyHint="search"
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                {/* 批量操作 */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-1 md:gap-2 mr-1 md:mr-2">
                    <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">已选 {selectedItems.length} 项</span>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target">
                      <Move className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors touch-target"
                      onClick={async () => {
                        const ids = [...selectedItems];
                        for (const id of ids) {
                          await handleDelete(id);
                        }
                        setSelectedItems([]);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}

                {/* 视图切换 */}
                <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-md transition-all touch-target",
                      viewMode === "grid" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 rounded-md transition-all touch-target",
                      viewMode === "list" ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 拖拽上传区域 - 仅桌面端显示完整版 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-4 md:p-8 mb-4 text-center transition-all",
              isDragging
                ? "border-amber-500 bg-amber-50"
                : "border-border hover:border-amber-300 hover:bg-amber-50/30"
            )}
          >
            <Upload className={cn("w-6 h-6 md:w-8 md:h-8 mx-auto mb-2", isDragging ? "text-amber-500" : "text-muted-foreground")} />
            <p className={cn("text-xs md:text-sm", isDragging ? "text-amber-600" : "text-muted-foreground")}>{isDragging ? "松开鼠标上传文件" : "拖拽文件到此处上传"}</p>
          </div>

          {/* 素材列表 */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : filteredMaterials.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className={cn(
                      "glass-card rounded-lg md:rounded-xl overflow-hidden group cursor-pointer transition-all",
                      selectedItems.includes(material.id) && "ring-2 ring-amber-500"
                    )}
                    onClick={() => toggleSelect(material.id)}
                  >
                    <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                      {material.thumbnail ? (
                        <img
                          src={material.thumbnail}
                          alt={material.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getFileIcon(material.type)}
                        </div>
                      )}
                      {/* 选择指示 */}
                      <div
                        className={cn(
                          "absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedItems.includes(material.id)
                            ? "bg-amber-500 border-amber-500"
                            : "border-white/70 bg-black/20 md:opacity-0 md:group-hover:opacity-100"
                        )}
                      >
                        {selectedItems.includes(material.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div className="p-2 md:p-3">
                      <p className="text-xs md:text-sm font-medium text-foreground truncate">{material.name}</p>
                      <p className="text-xs text-muted-foreground">{material.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className={cn(
                      "glass-card rounded-lg md:rounded-xl p-2 md:p-3 flex items-center gap-3 md:gap-4 cursor-pointer transition-all",
                      selectedItems.includes(material.id) && "ring-2 ring-amber-500"
                    )}
                    onClick={() => toggleSelect(material.id)}
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                      {material.thumbnail ? (
                        <img
                          src={material.thumbnail}
                          alt={material.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">{getFileIcon(material.type)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{material.name}</p>
                      <p className="text-xs text-muted-foreground">{material.size} · {material.uploadedAt}</p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(material);
                        }}
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors touch-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(material.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 md:py-16">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground mb-2 text-sm md:text-base">暂无素材</p>
              <p className="text-xs md:text-sm text-muted-foreground/70">上传素材以便在创作中使用</p>
            </div>
          )}
        </div>
      </div>}

      {/* 知识库 Tab 内容 */}
      {activeTab === 'knowledge' && (
        <div>
          {/* 分类筛选 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setKbActiveCategory('all')}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                kbActiveCategory === 'all' ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
              )}
            >
              全部
            </button>
            {KNOWLEDGE_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setKbActiveCategory(c.value)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  kbActiveCategory === c.value ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* 条目列表 */}
          {kbLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">加载中...</div>
          ) : (
            <div className="space-y-3">
              {(kbActiveCategory === 'all' ? kbItems : kbItems.filter(i => i.category === kbActiveCategory)).map(item => (
                <div key={item.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{item.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openKbDialog(item)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleKbDelete(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors touch-target"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {kbItems.length === 0 && (
                <div className="text-center py-12 md:py-16">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground mb-2 text-sm md:text-base">暂无知识库条目</p>
                  <p className="text-xs md:text-sm text-muted-foreground/70">添加店铺信息，在文案创作中一键调用</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 新建/编辑知识库条目 Dialog */}
      {showKbDialog && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] sm:pb-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowKbDialog(false)} />
          <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 shadow-xl">
            <h2 className="text-base font-semibold mb-4">{editingKbItem ? '编辑条目' : '新建条目'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">标题</label>
                <input
                  type="text"
                  value={kbForm.title}
                  onChange={e => setKbForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="例如：店铺地址和营业时间"
                  className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">分类</label>
                <select
                  value={kbForm.category}
                  onChange={e => setKbForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {KNOWLEDGE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">内容</label>
                <textarea
                  value={kbForm.content}
                  onChange={e => setKbForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="输入详细内容..."
                  rows={5}
                  className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowKbDialog(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-secondary"
              >
                取消
              </button>
              <button
                onClick={handleKbSave}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium transition-colors hover:bg-amber-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 智能导入 Dialog */}
      {showAiImport && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] sm:pb-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !aiAnalyzing && !aiSaving && setShowAiImport(false)} />
          <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-5 pt-5 pb-3 border-b shrink-0">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                AI 智能导入
              </h2>
              <p className="text-xs text-muted-foreground mt-1">粘贴你的店铺信息，AI 自动拆分成知识库条目</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {/* 输入阶段 */}
              {aiPreviewEntries.length === 0 && (
                <textarea
                  value={aiImportText}
                  onChange={e => setAiImportText(e.target.value)}
                  placeholder={"例如：\n我的店叫「XX女装」，在XX路XX号，营业时间10:00-21:00。\n主打法式轻熟风，价格带300-800元，主要客群是25-40岁职场女性。\n我们家的特色是每周上新，所有款式都是买手精选，不撞款..."}
                  rows={10}
                  disabled={aiAnalyzing}
                  className="w-full px-3 py-2.5 bg-secondary/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none disabled:opacity-50"
                />
              )}

              {/* 分析中 */}
              {aiAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <p className="text-sm text-muted-foreground">AI 正在分析中...</p>
                </div>
              )}

              {/* 预览阶段 */}
              {!aiAnalyzing && aiPreviewEntries.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-3">共提取 {aiPreviewEntries.length} 条，勾选要保存的条目</p>
                  {aiPreviewEntries.map((entry, idx) => (
                    <label
                      key={idx}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                        entry.selected ? "border-violet-400 bg-violet-50/50" : "border-border opacity-60"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={entry.selected}
                        onChange={() => setAiPreviewEntries(prev => prev.map((e, i) => i === idx ? { ...e, selected: !e.selected } : e))}
                        className="mt-0.5 shrink-0 accent-violet-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                            {getCategoryLabel(entry.category)}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{entry.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.content}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t shrink-0 flex gap-2">
              {aiPreviewEntries.length === 0 && !aiAnalyzing ? (
                <>
                  <button
                    onClick={() => setShowAiImport(false)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAiAnalyze}
                    disabled={!aiImportText.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    开始分析
                  </button>
                </>
              ) : !aiAnalyzing ? (
                <>
                  <button
                    onClick={() => setAiPreviewEntries([])}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    重新输入
                  </button>
                  <button
                    onClick={handleAiSave}
                    disabled={aiSaving || aiPreviewEntries.every(e => !e.selected)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {aiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    保存 {aiPreviewEntries.filter(e => e.selected).length} 条
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default MyMaterials;
