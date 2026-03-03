import { useState } from 'react'
import { useVideoAnalysis } from '@/hooks/use-video-analysis'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, AlertCircle, Loader2, Video, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function VideoAnalysis() {
  const {
    session,
    isAnalyzing,
    progress,
    error,
    startAnalysis,
    reset,
  } = useVideoAnalysis()

  const [dragActive, setDragActive] = useState(false)

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

  const handleDownloadReport = () => {
    if (!session?.report_image_url) return

    const a = document.createElement('a')
    a.href = session.report_image_url
    a.download = `视频分析报告-${session.video_filename}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('报告已下载')
  }

  const handleReset = () => {
    reset()
    toast.success('已重置')
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Video className="h-8 w-8" />
          视频深度拉片
        </h1>
        <p className="text-muted-foreground">
          基于薛辉短视频创作方法论，深度分析视频爆款潜力 · 200 积分/次
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!session ? (
        <Card>
          <CardHeader>
            <CardTitle>上传视频</CardTitle>
            <CardDescription>
              支持 MP4、MOV 格式，最大 100MB，时长不超过 120 秒
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {isAnalyzing ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">{getProgressMessage()}</p>
                  <Progress value={getProgressPercentage()} className="w-full max-w-xs mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {getProgressPercentage()}%
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">拖拽视频到这里</p>
                  <p className="text-sm text-muted-foreground mb-4">或</p>
                  <Button asChild>
                    <label className="cursor-pointer">
                      选择文件
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
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm mb-1">爆款元素识别</h3>
                  <p className="text-xs text-muted-foreground">
                    检测反差、共鸣、新奇等 8 大爆款元素
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm mb-1">完播率预测</h3>
                  <p className="text-xs text-muted-foreground">
                    分析节奏、信息密度、情绪曲线
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm mb-1">可视化报告</h3>
                  <p className="text-xs text-muted-foreground">
                    生成深色主题数据可视化长图
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 视频信息卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{session.video_filename}</CardTitle>
                  <CardDescription>
                    {session.video_duration && `时长: ${session.video_duration} 秒 · `}
                    状态: {session.status === 'completed' ? '已完成' : session.status === 'analyzing' ? '分析中' : session.status}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {session.status === 'completed' && session.report_image_url && (
                    <Button onClick={handleDownloadReport}>
                      <Download className="mr-2 h-4 w-4" />
                      下载报告
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleReset}>
                    重新分析
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 分析结果展示 */}
          {session.status === 'completed' && session.report_image_url && (
            <Card>
              <CardHeader>
                <CardTitle>分析报告</CardTitle>
                <CardDescription>
                  基于薛辉短视频创作方法论的深度分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={session.report_image_url}
                    alt="视频分析报告"
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 关键帧展示 */}
          {session.keyframes && session.keyframes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>关键帧</CardTitle>
                <CardDescription>
                  从视频中提取的 {session.keyframes.length} 个关键帧
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {session.keyframes.map((kf, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border">
                      <img
                        src={kf.data_url}
                        alt={`关键帧 ${idx + 1}`}
                        className="w-full h-auto"
                      />
                      <div className="p-2 text-xs text-center text-muted-foreground bg-muted">
                        {kf.timestamp.toFixed(1)}s
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 分析结果数据（可选，用于调试） */}
          {session.analysis_result && (
            <Card>
              <CardHeader>
                <CardTitle>分析数据</CardTitle>
                <CardDescription>
                  详细的分析结果数据
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 综合评分 */}
                  <div>
                    <h3 className="font-medium mb-2">综合评分</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {session.analysis_result.overall_scores.viral_potential}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">爆款潜力</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {session.analysis_result.overall_scores.topic_quality}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">选题质量</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {session.analysis_result.overall_scores.script_structure}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">脚本结构</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {session.analysis_result.overall_scores.visual_presentation}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">视觉呈现</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted">
                        <div className="text-2xl font-bold text-primary">
                          {session.analysis_result.overall_scores.completion_expectation}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">完播预期</div>
                      </div>
                    </div>
                  </div>

                  {/* 爆款元素 */}
                  <div>
                    <h3 className="font-medium mb-2">爆款元素</h3>
                    <div className="flex flex-wrap gap-2">
                      {session.analysis_result.viral_elements.detected.map((element, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-700 dark:text-green-400"
                        >
                          ✓ {element}
                        </span>
                      ))}
                      {session.analysis_result.viral_elements.missing.map((element, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-700 dark:text-red-400"
                        >
                          ✗ {element}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 优缺点 */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2 text-green-700 dark:text-green-400">优点</h3>
                      <ul className="space-y-1">
                        {session.analysis_result.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2 text-red-700 dark:text-red-400">缺点</h3>
                      <ul className="space-y-1">
                        {session.analysis_result.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 优化建议 */}
                  <div>
                    <h3 className="font-medium mb-2">优化建议</h3>
                    <div className="space-y-2">
                      {session.analysis_result.optimization_suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-muted text-sm flex items-start gap-3"
                        >
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              suggestion.priority === 'high'
                                ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                                : suggestion.priority === 'medium'
                                ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            {suggestion.priority === 'high' ? '高' : suggestion.priority === 'medium' ? '中' : '低'}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium mb-1">{suggestion.category}</div>
                            <div className="text-muted-foreground">{suggestion.suggestion}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
