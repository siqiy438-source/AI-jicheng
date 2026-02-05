import { useState, useRef } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// 模拟文件夹数据
const mockFolders = [
  { id: "1", name: "产品图片", count: 12 },
  { id: "2", name: "Logo素材", count: 5 },
  { id: "3", name: "背景图", count: 8 },
  { id: "4", name: "字体素材", count: 3 },
];

// 模拟素材数据
const mockMaterials = [
  {
    id: "1",
    name: "产品主图.png",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    size: "2.4 MB",
    uploadedAt: "2024-01-15",
    folder: "产品图片",
  },
  {
    id: "2",
    name: "品牌Logo.svg",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400",
    size: "156 KB",
    uploadedAt: "2024-01-14",
    folder: "Logo素材",
  },
  {
    id: "3",
    name: "渐变背景.jpg",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400",
    size: "1.8 MB",
    uploadedAt: "2024-01-13",
    folder: "背景图",
  },
  {
    id: "4",
    name: "产品细节图1.png",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    size: "3.1 MB",
    uploadedAt: "2024-01-12",
    folder: "产品图片",
  },
  {
    id: "5",
    name: "宣传视频.mp4",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400",
    size: "15.6 MB",
    uploadedAt: "2024-01-11",
    folder: null,
  },
  {
    id: "6",
    name: "产品说明.txt",
    type: "document",
    thumbnail: null,
    size: "12 KB",
    uploadedAt: "2024-01-10",
    folder: null,
  },
];

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // 过滤素材
  const filteredMaterials = mockMaterials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !currentFolder || material.folder === currentFolder;
    return matchesSearch && matchesFolder;
  });

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      alert(`已选择 ${files.length} 个文件，将上传到素材库`);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      alert(`已拖入 ${files.length} 个文件，将上传到素材库`);
    }
  };

  // 创建新文件夹
  const createNewFolder = () => {
    if (newFolderName.trim()) {
      alert(`创建文件夹: ${newFolderName}`);
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

      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
            <Upload className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">我的素材</h1>
            <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">管理你上传的所有素材文件</p>
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
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg md:rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md touch-target text-sm md:text-base"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">上传素材</span>
          <span className="sm:hidden">上传</span>
        </button>
      </div>

      {/* 移动端文件夹横向滚动 */}
      <div className="md:hidden mb-4 -mx-4 px-4">
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
            <span className="text-xs opacity-70">{mockMaterials.length}</span>
          </button>
          {mockFolders.map((folder) => (
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
              <span className="text-xs opacity-70">{folder.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 面包屑导航 - 仅桌面端 */}
      <div className="hidden md:flex items-center gap-2 mb-6 text-sm">
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
      </div>

      <div className="flex gap-6">
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
                <span className="text-xs text-muted-foreground">{mockMaterials.length}</span>
              </button>
              {mockFolders.map((folder) => (
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
                    <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
                      已选 {selectedItems.length} 项
                    </span>
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target">
                      <Move className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg transition-colors touch-target">
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
            <p className={cn("text-xs md:text-sm", isDragging ? "text-amber-600" : "text-muted-foreground")}>
              {isDragging ? "松开鼠标上传文件" : "拖拽文件到此处上传"}
            </p>
          </div>

          {/* 素材列表 */}
          {filteredMaterials.length > 0 ? (
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
                        {selectedItems.includes(material.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
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
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {getFileIcon(material.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{material.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.size} · {material.uploadedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors touch-target">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors touch-target">
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
      </div>
    </PageLayout>
  );
};

export default MyMaterials;
