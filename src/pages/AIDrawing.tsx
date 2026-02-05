import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIDrawing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gradient-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </button>

            {/* 页面标题 */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI 绘图</h1>
                <p className="text-muted-foreground">一句话生成，从 AI 绘画获取灵感</p>
              </div>
            </div>

            {/* 功能区域占位 */}
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">绘图生成功能开发中...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIDrawing;
