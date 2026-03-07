import { useState } from 'react'
import { useVideoAnalysis } from '@/hooks/use-video-analysis'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, AlertCircle, Loader2, Video, Sparkles, Clock, ArrowLeft, Download, FileImage, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { VideoAnalysisReport } from '@/components/VideoAnalysisReport'
import { PageLayout } from '@/components/PageLayout'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { exportReportAsPNG, exportReportAsPDF } from '@/lib/report-export'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/hooks/use-mobile'

export default function VideoAnalysis() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const {
    session,
    isAnalyzing,
    progress,
    error,
    startAnalysis,
    reset,
  } = useVideoAnalysis()

  const [dragActive, setDragActive] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      await startAnalysis(file)
      toast.success('分析完成！')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '分析失败')
    }
  }

  const handleReset = () => {
    reset()
    toast.success('已重置')
  }

  const handleExportPNG = async () => {
    setIsExporting(true)
    try {
      const filename = session?.video_filename
        ? `${session.video_filename.replace(/\.[^/.]+$/, '')}-分析报告`
        : `视频分析报告-${Date.now()}`

      await exportReportAsPNG('video-analysis-report', filename)
      setExportDialogOpen(false)
    } catch (error) {
      console.error('导出 PNG 失败:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const filename = session?.video_filename
        ? `${session.video_filename.replace(/\.[^/.]+$/, '')}-分析报告`
        : `视频分析报告-${Date.now()}`

      await exportReportAsPDF('video-analysis-report', filename)
      setExportDialogOpen(false)
    } catch (error) {
      console.error('导出 PDF 失败:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    // 移动端直接导出 PNG
    if (isMobile) {
      handleExportPNG()
    } else {
      // 桌面端打开对话框选择格式
      setExportDialogOpen(true)
    }
  }

  const getProgressPercentage = () => {
    if (!progress) return 0
    return progress.percentage
  }

  const getProgressMessage = () => {
    if (!progress) return ''
    return progress.message
  }

  return (
    <PageLayout className="py-4 md:py-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 md:mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">返回首页</span>
      </button>

      {/* 页面标题 */}
      <div className="mb-6 md:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-primary/10 border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">薛辉短视频创作方法论</span>
        </div>

        <div className="flex items-center gap-3 md:gap-4 mb-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center">
            <img
              src="/icons/video-analysis-custom.png"
              alt="视频深度拉片"
              className="w-12 h-12 md:w-14 md:h-14 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<div class="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"><svg class="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></div>'
              }}
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">视频深度拉片</h1>
            <p className="text-muted-foreground text-sm">深度分析爆款视频，学习可复制的方法论 · 200 积分/次</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 md:mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!session ? (
        <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-2">上传爆款视频</h2>
            <p className="text-muted-foreground text-sm">
              支持 MP4、MOV 格式 · 最大 50MB · 建议 30MB 以内
            </p>
          </div>

          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl p-12 md:p-16 text-center transition-all duration-300",
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-secondary/30"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isAnalyzing ? (
              <div className="space-y-4 md:space-y-6">
                <div className="relative inline-block">
                  <Loader2 className="h-12 w-12 md:h-16 md:w-16 mx-auto animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary/20 animate-ping"></div>
                  </div>
                </div>
                <div>
                  <p className="text-base md:text-lg font-medium text-foreground mb-2">{getProgressMessage()}</p>
                  <div className="max-w-md mx-auto">
                    <Progress value={getProgressPercentage()} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">{getProgressPercentage()}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 md:mb-6">
                  <div className="relative inline-block">
                    <Upload className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground" />
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <p className="text-lg md:text-xl font-semibold text-foreground mb-2">拖拽视频到这里</p>
                <p className="text-sm text-muted-foreground mb-4 md:mb-6">或点击下方按钮选择文件</p>
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                >
                  <label className="cursor-pointer">
                    <Video className="h-4 w-4 mr-2" />
                    选择视频文件
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={isAnalyzing}
                    />
                  </label>
                </Button>
              </>
            )}
          </div>

          {/* 功能说明 */}
          <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="glass-card rounded-xl p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 md:h-5 md:h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">爆款拆解</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    分析为什么能火，提取可复制的方法论
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Video className="h-4 w-4 md:h-5 md:h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">脚本结构</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    时间轴拆解，可复制的文案模板
                  </p>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Sparkles className="h-4 w-4 md:h-5 md:h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">复制指南</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    一步步教你如何应用到自己的创作
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* 视频信息卡片 */}
          <div className="glass-card rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg">
            {/* 分析中状态 */}
            {(session.status === 'pending' || session.status === 'analyzing') && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <div className="absolute inset-0 h-6 w-6 rounded-full bg-primary/20 animate-ping"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">正在深度分析中...</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.status === 'pending' ? '准备开始分析' : getProgressMessage()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{getProgressPercentage()}%</div>
                    <div className="text-xs text-muted-foreground">预计 2-3 分钟</div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="relative">
                  <Progress value={getProgressPercentage()} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>已完成 {getProgressPercentage()}%</span>
                    <span>剩余约 {Math.ceil((100 - getProgressPercentage()) / 50)} 分钟</span>
                  </div>
                </div>

                {/* 分析步骤指示器 */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    getProgressPercentage() >= 20
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {getProgressPercentage() >= 20 ? (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                      )}
                      <span className="text-xs font-medium">视频上传</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">解析视频内容</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    getProgressPercentage() >= 50
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {getProgressPercentage() >= 50 ? (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                      )}
                      <span className="text-xs font-medium">AI 分析</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">提取爆款要素</p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    getProgressPercentage() >= 90
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {getProgressPercentage() >= 90 ? (
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                      )}
                      <span className="text-xs font-medium">生成报告</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">整理分析结果</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between gap-4 md:gap-6">
              {/* 左侧：视频信息 */}
              <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                {/* 视频图标 */}
                <div className="relative flex-shrink-0">
                  <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
                    <Video className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  {session.status === 'completed' && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                      <Sparkles className="h-2 w-2 md:h-3 md:w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* 视频详情 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base md:text-xl font-bold text-foreground">
                      {session.status === 'completed' ? '分析完成' : '已上传的视频'}
                    </h3>
                    {session.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-green-600">已完成</span>
                      </span>
                    )}
                    {(session.status === 'pending' || session.status === 'analyzing') && (
                      <span className="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-primary/10 border border-primary/20">
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        <span className="text-xs font-medium text-primary">分析中</span>
                      </span>
                    )}
                  </div>

                  {/* 视频元信息 */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-muted-foreground mb-2 md:mb-3">
                    {session.video_duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{session.video_duration} 秒</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Video className="h-4 w-4" />
                      <span className="truncate max-w-[150px] md:max-w-[200px]" title={session.video_filename}>
                        {session.video_filename.split('.').pop()?.toUpperCase()} 格式
                      </span>
                    </div>
                  </div>

                  {/* 原始文件名（折叠显示） */}
                  <details className="group">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      查看文件名
                    </summary>
                    <div className="mt-2 p-2 md:p-3 rounded-lg bg-secondary/50 border border-border">
                      <code className="text-xs text-muted-foreground break-all">{session.video_filename}</code>
                    </div>
                  </details>
                </div>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex-shrink-0 flex gap-2">
                {/* 导出报告按钮 */}
                {session.status === 'completed' && (
                  <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={handleExport}
                        size="sm"
                        variant="outline"
                        disabled={isExporting}
                        className="border-primary/20 hover:bg-primary/10"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        <span className="hidden md:inline">
                          {isExporting ? '导出中...' : '导出报告'}
                        </span>
                        <span className="md:hidden">
                          {isExporting ? '...' : '导出'}
                        </span>
                      </Button>
                    </DialogTrigger>
                    {!isMobile && (
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>导出报告</DialogTitle>
                          <DialogDescription>
                            选择导出格式
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 py-4">
                          <Button
                            onClick={handleExportPNG}
                            disabled={isExporting}
                            className="w-full justify-start h-auto py-4"
                            variant="outline"
                          >
                            <FileImage className="h-5 w-5 mr-3 text-primary" />
                            <div className="text-left">
                              <div className="font-medium">PNG 图片</div>
                              <div className="text-xs text-muted-foreground">
                                导出为高清长图，适合分享
                              </div>
                            </div>
                          </Button>
                          <Button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="w-full justify-start h-auto py-4"
                            variant="outline"
                          >
                            <FileText className="h-5 w-5 mr-3 text-primary" />
                            <div className="text-left">
                              <div className="font-medium">PDF 文档</div>
                              <div className="text-xs text-muted-foreground">
                                自动分页，适合打印和存档
                              </div>
                            </div>
                          </Button>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                )}

                {/* 重新分析按钮 */}
                <Button
                  onClick={handleReset}
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">重新分析</span>
                  <span className="md:hidden">重新</span>
                </Button>
              </div>
            </div>

            {/* 底部：快速统计（如果分析完成） */}
            {session.status === 'completed' && session.analysis_result && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                      {session.analysis_result.overall_scores.viral_potential}
                    </div>
                    <div className="text-xs text-muted-foreground">爆款潜力</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
                      {session.analysis_result.overall_scores.topic_quality}
                    </div>
                    <div className="text-xs text-muted-foreground">选题质量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-orange-600 mb-1">
                      {session.analysis_result.completion_prediction.predicted_rate}%
                    </div>
                    <div className="text-xs text-muted-foreground">预测完播率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                      {session.analysis_result.viral_elements.detected.length}/8
                    </div>
                    <div className="text-xs text-muted-foreground">爆款元素</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 分析结果展示 */}
          {session.status === 'completed' && session.analysis_result && (
            <VideoAnalysisReport
              result={session.analysis_result}
              videoFilename={session.video_filename}
              videoDuration={session.video_duration}
            />
          )}
        </div>
      )}
    </PageLayout>
  )
}
