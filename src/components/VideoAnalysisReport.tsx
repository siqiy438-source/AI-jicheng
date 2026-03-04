import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Target,
  Zap,
  Eye,
  MessageSquare,
  Award,
  Flame,
  Clock,
  Sparkles,
  TrendingDown,
} from 'lucide-react'

interface VideoAnalysisResult {
  basic_info: {
    duration: number
    scene_count: number
    main_characters: string[]
  }
  viral_analysis?: {
    why_viral: string
    key_techniques: string[]
  }
  topic_analysis: {
    topic_type: string
    pain_point: string
    target_audience: string
    score: number
    topic_formula?: string
    replication_tips?: string
  }
  script_type: {
    primary_type: string
    confidence: number
  }
  script_structure?: {
    structure_breakdown: Array<{
      time_range: string
      content: string
      purpose: string
      replicable_pattern: string
    }>
    script_formula: string
  }
  viral_elements: {
    detected: string[]
    missing: string[]
    highlight_moments: Array<{
      element: string
      timestamp: number
      description: string
      why_works?: string
      how_to_copy?: string
    }>
  }
  hook_analysis: {
    first_3_seconds: string
    hook_type: string
    effectiveness_score: number
    suggestions?: string[]
    hook_formula?: string
  }
  completion_prediction: {
    predicted_rate: number
    pacing_score: number
    info_density_score: number
    emotion_curve: string
    retention_techniques?: string[]
  }
  copywriting_patterns?: {
    opening_line: string
    key_phrases: string[]
    closing_cta: string
  }
  visual_techniques?: {
    shooting_style: string
    editing_rhythm: string
    key_techniques: string[]
  }
  strengths: string[]
  weaknesses: string[]
  optimization_suggestions: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    suggestion: string
  }>
  replication_guide?: {
    top_3_learnings: string[]
    quick_wins: string[]
    step_by_step: string[]
  }
  overall_scores: {
    viral_potential: number
    topic_quality: number
    script_structure: number
    visual_presentation: number
    completion_expectation: number
  }
}

interface VideoAnalysisReportProps {
  result: VideoAnalysisResult
  videoFilename: string
  videoDuration?: number
}

// 十大钩子技巧
const TEN_HOOKS = [
  { name: '送温暖', icon: '🤗', color: 'from-orange-500 to-pink-500' },
  { name: '金钱', icon: '💰', color: 'from-orange-500 to-orange-600' },
  { name: '怀旧', icon: '📼', color: 'from-purple-500 to-indigo-500' },
  { name: '对抗', icon: '⚔️', color: 'from-red-500 to-rose-500' },
  { name: '意外惊喜', icon: '🎁', color: 'from-pink-500 to-fuchsia-500' },
  { name: '盲盒', icon: '📦', color: 'from-orange-500 to-orange-600' },
  { name: '验证', icon: '✅', color: 'from-green-500 to-emerald-500' },
  { name: '解密', icon: '🔍', color: 'from-indigo-500 to-violet-500' },
  { name: '整蛊', icon: '😈', color: 'from-orange-500 to-red-500' },
  { name: '荷尔蒙', icon: '💋', color: 'from-rose-500 to-pink-500' },
]

// 八大爆款元素（薛辉方法论）
const EIGHT_ELEMENTS = [
  { name: '反差', icon: '🔄', desc: '意料之外的对比' },
  { name: '共鸣', icon: '💭', desc: '触动情感共鸣' },
  { name: '新奇', icon: '✨', desc: '新鲜独特内容' },
  { name: '实用', icon: '🛠️', desc: '实际价值提供' },
  { name: '争议', icon: '💬', desc: '引发讨论话题' },
  { name: '颜值', icon: '😍', desc: '视觉吸引力强' },
  { name: '情绪', icon: '😊', desc: '情绪价值传递' },
  { name: '热点', icon: '🔥', desc: '蹭热点话题' },
]

export function VideoAnalysisReport({ result, videoFilename, videoDuration }: VideoAnalysisReportProps) {
  // 准备雷达图数据
  const radarData = [
    { subject: '爆款潜力', value: result.overall_scores.viral_potential, fullMark: 100 },
    { subject: '选题质量', value: result.overall_scores.topic_quality, fullMark: 100 },
    { subject: '脚本结构', value: result.overall_scores.script_structure, fullMark: 100 },
    { subject: '视觉呈现', value: result.overall_scores.visual_presentation, fullMark: 100 },
    { subject: '完播预期', value: result.overall_scores.completion_expectation, fullMark: 100 },
  ]

  // 准备柱状图数据
  const barData = [
    { name: '节奏控制', score: result.completion_prediction.pacing_score },
    { name: '信息密度', score: result.completion_prediction.info_density_score },
  ]

  // 生成模拟情绪曲线数据（基于视频时长）
  const emotionCurveData = generateEmotionCurveData(videoDuration || result.basic_info.duration)

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-primary'
    return 'text-orange-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20'
    if (score >= 60) return 'bg-primary/10 border-primary/20'
    return 'bg-orange-500/10 border-orange-500/20'
  }

  // 获取优先级样式
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-red-500/10 text-red-600 border-red-500/20',
      medium: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      low: 'bg-secondary text-muted-foreground border-border',
    }
    const labels = {
      high: '高优先级',
      medium: '中优先级',
      low: '低优先级',
    }
    return { style: styles[priority], label: labels[priority] }
  }

  // 格式化时间戳
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  // 识别钩子类型
  const identifyHookTechnique = (hookType: string) => {
    const hookMap: Record<string, string> = {
      送温暖: '送温暖',
      金钱: '金钱',
      怀旧: '怀旧',
      对抗: '对抗',
      意外: '意外惊喜',
      惊喜: '意外惊喜',
      盲盒: '盲盒',
      验证: '验证',
      解密: '解密',
      整蛊: '整蛊',
      荷尔蒙: '荷尔蒙',
    }

    for (const [key, value] of Object.entries(hookMap)) {
      if (hookType.includes(key)) return value
    }
    return null
  }

  const detectedHook = identifyHookTechnique(result.hook_analysis.hook_type)

  return (
    <div className="space-y-3 md:space-y-6">
      {/* 封面区域 */}
      <div className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg">
        <div className="text-center mb-3 md:mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2 md:mb-3">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">薛辉短视频创作方法论</span>
          </div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground mb-2">
            视频深度拉片报告
            </h1>
            <p className="text-center text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">AI-Powered Video Analysis Report</p>
            <div className="grid grid-cols-3 gap-2 md:gap-3 max-w-2xl mx-auto">
              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 border border-border">
                <div className="text-lg md:text-2xl font-bold text-foreground mb-0.5 md:mb-1">{videoDuration || result.basic_info.duration}s</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">视频时长</div>
              </div>
              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 border border-border">
                <div className="text-lg md:text-2xl font-bold text-foreground mb-0.5 md:mb-1">{result.basic_info.scene_count}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">场景数量</div>
              </div>
              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-2 md:p-4 border border-border">
                <div className="text-lg md:text-2xl font-bold text-foreground mb-0.5 md:mb-1">{new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">分析日期</div>
              </div>
            </div>
          </div>
        </div>

        {/* 爆款拆解 - 核心成功要素 */}
        {result.viral_analysis && (
          <div className="glass-card rounded-xl md:rounded-2xl border border-orange-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">🔥 爆款拆解</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Why This Video Went Viral</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 md:space-y-6">
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <h3 className="text-lg font-bold text-orange-600 mb-3">💡 为什么能火？</h3>
                  <p className="text-foreground leading-relaxed text-sm md:text-base">{result.viral_analysis.why_viral}</p>
                </div>

                {result.viral_analysis.key_techniques && result.viral_analysis.key_techniques.length > 0 && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-orange-600 mb-4">🎯 关键成功技巧</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                      {result.viral_analysis.key_techniques.map((technique, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-orange-500/10 border border-orange-500/20">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <span className="text-foreground leading-relaxed">{technique}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 选题公式 */}
        {(result.topic_analysis.topic_formula || result.topic_analysis.replication_tips) && (
          <div className="glass-card rounded-xl md:rounded-2xl border border-green-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">📝 选题公式</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Topic Formula & Replication Guide</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 md:space-y-6">
                {result.topic_analysis.topic_formula && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-green-600 mb-3">🧪 选题公式</h3>
                    <div className="text-lg md:text-2xl font-bold text-foreground text-center py-4 px-6 rounded-xl bg-green-500/10 border border-green-500/20">
                      {result.topic_analysis.topic_formula}
                    </div>
                  </div>
                )}

                {result.topic_analysis.replication_tips && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-green-600 mb-3">💡 如何复制这个选题？</h3>
                    <p className="text-foreground leading-relaxed">{result.topic_analysis.replication_tips}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 脚本结构拆解 */}
        {result.script_structure && result.script_structure.structure_breakdown && (
          <div className="glass-card rounded-xl md:rounded-2xl border border-purple-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">📋 脚本结构拆解</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Script Structure Breakdown</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-4">
                {result.script_structure.structure_breakdown.map((segment, index) => (
                  <div key={index} className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-foreground border-0">
                        {segment.time_range}
                      </Badge>
                      <h4 className="font-bold text-foreground">{segment.purpose}</h4>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">内容：</span>
                        <p className="text-foreground mt-1">{segment.content}</p>
                      </div>
                      <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <span className="text-sm text-purple-600 font-medium">💡 可复制套路：</span>
                        <p className="text-foreground mt-2">{segment.replicable_pattern}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {result.script_structure.script_formula && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-purple-600 mb-3">🎯 整体脚本公式</h3>
                    <div className="text-base md:text-xl font-bold text-foreground text-center py-4 px-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      {result.script_structure.script_formula}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 爆点分析 - 新增核心功能 */}
        <div className="glass-card rounded-xl md:rounded-2xl border border-orange-500/20 shadow-lg">
          
          <div className="relative p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">爆点分析</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Viral Moment Analysis</p>
              </div>
            </div>

            {result.viral_elements.highlight_moments.length > 0 ? (
              <div className="space-y-2 md:space-y-3 md:space-y-6">
                {/* 时间轴可视化 */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <div className="pl-8 space-y-2 md:space-y-3 md:space-y-6">
                    {result.viral_elements.highlight_moments
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((moment, index) => (
                        <div key={index} className="relative group">
                          <div className="absolute -left-[33px] top-3 w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 ring-4 ring-card group-hover:ring-orange-500/30 transition-all"></div>
                          <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border hover:border-orange-500/50 transition-all group-hover:shadow-lg group-hover:shadow-orange-500/20">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-500/10 border border-orange-500/20">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-orange-600" />
                                    <span className="text-sm font-mono font-bold text-orange-600">{formatTimestamp(moment.timestamp)}</span>
                                  </div>
                                </div>
                                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-foreground border-0 shadow-lg">
                                  {moment.element}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4 text-orange-600" />
                                <span className="text-xs text-orange-600 font-medium">爆点 #{index + 1}</span>
                              </div>
                            </div>
                            <p className="text-foreground leading-relaxed">{moment.description}</p>

                            {/* 新增：为什么有效 + 如何复制 */}
                            {(moment.why_works || moment.how_to_copy) && (
                              <div className="mt-4 space-y-2 md:space-y-3">
                                {moment.why_works && (
                                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <div className="text-xs font-medium text-orange-600 mb-1">💡 为什么有效？</div>
                                    <p className="text-sm text-foreground">{moment.why_works}</p>
                                  </div>
                                )}
                                {moment.how_to_copy && (
                                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <div className="text-xs font-medium text-green-600 mb-1">🎯 如何复制？</div>
                                    <p className="text-sm text-foreground">{moment.how_to_copy}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 爆点密度指示器 */}
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">爆点密度</span>
                    <span className="text-lg font-bold text-orange-600">
                      {((result.viral_elements.highlight_moments.length / (videoDuration || result.basic_info.duration)) * 60).toFixed(1)} 个/分钟
                    </span>
                  </div>
                  <Progress
                    value={Math.min((result.viral_elements.highlight_moments.length / 5) * 100, 100)}
                    className="h-3 bg-secondary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.viral_elements.highlight_moments.length >= 5
                      ? '✨ 爆点密度优秀，能够持续吸引观众注意力'
                      : result.viral_elements.highlight_moments.length >= 3
                        ? '👍 爆点密度良好，建议增加更多高光时刻'
                        : '⚠️ 爆点密度偏低，建议增强内容吸引力'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-secondary/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-12 border border-border text-center">
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">未检测到明显爆点</p>
                <p className="text-sm text-muted-foreground">建议增加更多能够引发情绪波动或惊喜的内容元素</p>
              </div>
            )}
          </div>
        </div>

        {/* 开篇钩子分析 - 整合十大钩子技巧 */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-primary/20 shadow-lg">
          
          <div className="relative p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">开篇钩子分析</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Hook Analysis (First 3 Seconds)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-8">
              <div className="md:col-span-2 space-y-2 md:space-y-4">
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    前3秒内容
                  </div>
                  <p className="text-foreground leading-relaxed text-lg">{result.hook_analysis.first_3_seconds}</p>
                </div>
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <div className="text-sm text-muted-foreground mb-3">钩子类型</div>
                  <Badge className="text-sm md:text-lg px-3 md:px-6 py-1.5 md:py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-foreground border-0 shadow-lg">
                    {result.hook_analysis.hook_type}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                <div className={`text-4xl md:text-6xl font-black mb-2 ${getScoreColor(result.hook_analysis.effectiveness_score)}`}>
                  {result.hook_analysis.effectiveness_score}
                </div>
                <div className="text-sm text-muted-foreground mb-4">有效性评分</div>
                <div className="w-full">
                  <Progress value={result.hook_analysis.effectiveness_score} className="h-3 bg-secondary" />
                </div>
              </div>
            </div>

            {/* 十大钩子技巧展示 */}
            <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border mb-4">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                薛辉十大钩子技巧
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                {TEN_HOOKS.map((hook) => {
                  const isDetected = detectedHook === hook.name
                  return (
                    <div
                      key={hook.name}
                      className={`relative overflow-hidden rounded-lg md:rounded-xl p-2 md:p-4 border-2 transition-all ${
                        isDetected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : 'border-border bg-secondary/50 opacity-60'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl mb-1 md:mb-2">{hook.icon}</div>
                        <div className="text-sm font-medium text-foreground">{hook.name}</div>
                        {isDetected && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 钩子公式 */}
            {result.hook_analysis.hook_formula && (
              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border mb-4">
                <h3 className="text-lg font-bold text-primary mb-3">🧪 钩子公式</h3>
                <div className="text-base md:text-xl font-bold text-foreground text-center py-4 px-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  {result.hook_analysis.hook_formula}
                </div>
              </div>
            )}

            {/* 优化建议 */}
            {result.hook_analysis.suggestions && result.hook_analysis.suggestions.length > 0 && (
              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  优化建议
                </h4>
                <div className="space-y-2 md:space-y-3">
                  {result.hook_analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-secondary/50 border border-border/30">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-foreground leading-relaxed">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 八大爆款元素 - 重新设计 */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-green-500/20 shadow-lg">
          
          <div className="relative p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">八大爆款元素</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">8 Viral Elements (薛辉方法论)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
              {EIGHT_ELEMENTS.map((element) => {
                const detected = result.viral_elements.detected.includes(element.name)
                return (
                  <div
                    key={element.name}
                    className={`relative overflow-hidden rounded-lg md:rounded-xl p-3 md:p-6 border-2 transition-all ${
                      detected
                        ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                        : 'border-border bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-4xl">{element.icon}</div>
                      {detected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-lg font-bold text-foreground mb-1">{element.name}</div>
                    <div className="text-xs text-muted-foreground">{element.desc}</div>
                    <div className={`text-xs font-medium mt-2 ${detected ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {detected ? '✓ 已检出' : '✗ 未检出'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 元素检出统计 */}
            <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">元素检出率</span>
                <span className="text-2xl font-bold text-green-600">
                  {result.viral_elements.detected.length}/8
                </span>
              </div>
              <Progress
                value={(result.viral_elements.detected.length / 8) * 100}
                className="h-3 bg-secondary"
              />
              <p className="text-xs text-muted-foreground mt-3">
                {result.viral_elements.detected.length >= 6
                  ? '🎉 优秀！包含多种爆款元素，具有很强的传播潜力'
                  : result.viral_elements.detected.length >= 4
                    ? '👍 良好！建议继续强化缺失的元素'
                    : '⚠️ 建议增加更多爆款元素以提升传播力'}
              </p>
            </div>
          </div>
        </div>

        {/* 综合评分雷达图 - 重新设计 */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-purple-500/20 shadow-lg">
          
          <div className="relative p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">综合评分</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Overall Performance Metrics</p>
              </div>
            </div>

            <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" strokeWidth={1} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#cbd5e1', fontSize: 14, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Radar
                    name="评分"
                    dataKey="value"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              {radarData.map((item) => (
                <div
                  key={item.subject}
                  className={`text-center p-5 rounded-xl md:rounded-2xl border-2 ${getScoreBgColor(item.value)}`}
                >
                  <div className={`text-4xl font-black mb-2 ${getScoreColor(item.value)}`}>{item.value}</div>
                  <div className="text-sm text-foreground font-medium mb-2">{item.subject}</div>
                  <Progress value={item.value} className="h-2 bg-secondary" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 完播率预测 & 情绪曲线 - 新增 */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-primary/20 shadow-lg">
          
          <div className="relative p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">完播率预测</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Completion Rate Prediction</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border text-center">
                <div className="text-5xl md:text-7xl font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-3">
                  {result.completion_prediction.predicted_rate}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">预测完播率</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar dataKey="score" fill="#f97316" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  情绪曲线分析
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={emotionCurveData}>
                    <defs>
                      <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="emotion"
                      stroke="#f97316"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#emotionGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-sm text-muted-foreground mt-4">{result.completion_prediction.emotion_curve}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 选题分析 & 脚本类型 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-orange-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">选题分析</h2>
                  <p className="text-xs text-muted-foreground mt-1">Topic Analysis</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-4">
                <div className="bg-secondary/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 border border-border">
                  <div className="text-xs text-muted-foreground mb-2">选题类型</div>
                  <Badge className="text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-foreground border-0">
                    {result.topic_analysis.topic_type}
                  </Badge>
                </div>
                <div className="bg-secondary/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 border border-border">
                  <div className="text-xs text-muted-foreground mb-2">目标人群</div>
                  <div className="text-sm text-foreground">{result.topic_analysis.target_audience}</div>
                </div>
                <div className="bg-secondary/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 border border-border">
                  <div className="text-xs text-muted-foreground mb-2">触及痛点</div>
                  <div className="text-sm text-foreground">{result.topic_analysis.pain_point}</div>
                </div>
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border text-center">
                  <div className={`text-5xl font-black mb-2 ${getScoreColor(result.topic_analysis.score)}`}>
                    {result.topic_analysis.score}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">选题质量评分</div>
                  <Progress value={result.topic_analysis.score} className="h-2 bg-secondary" />
                </div>
              </div>
            </div>
          </div>

          {/* 脚本类型识别 */}
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-purple-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">脚本类型</h2>
                  <p className="text-xs text-muted-foreground mt-1">Script Type</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 md:space-y-6">
                <div className="flex items-center justify-center">
                  <Badge className="text-lg md:text-2xl px-4 md:px-8 py-2 md:py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-foreground border-0 shadow-lg">
                    {result.script_type.primary_type}
                  </Badge>
                </div>

                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-muted-foreground">识别置信度</span>
                    <span className="font-bold text-purple-600">{result.script_type.confidence}%</span>
                  </div>
                  <Progress value={result.script_type.confidence} className="h-3 bg-secondary" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['晒过程', '聊观点', '教知识', '讲故事'].map((type) => (
                    <div
                      key={type}
                      className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 text-center transition-all ${
                        result.script_type.primary_type.includes(type)
                          ? 'border-fuchsia-400 bg-fuchsia-500/20'
                          : 'border-border bg-secondary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground text-sm">{type}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {type === '晒过程' && '展示制作/体验'}
                        {type === '聊观点' && '表达个人看法'}
                        {type === '教知识' && '传授技能方法'}
                        {type === '讲故事' && '叙述完整故事'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 优缺点对比 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-green-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <h3 className="text-lg md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                优点
              </h3>
              <div className="space-y-2 md:space-y-3">
                {result.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-red-500/30 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <h3 className="text-lg md:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                缺点
              </h3>
              <div className="space-y-2 md:space-y-3">
                {result.weaknesses.map((weakness, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
                  >
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">{weakness}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 优化建议 */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-primary/20 shadow-lg">
          
          <div className="relative p-3 md:p-6">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-foreground">优化建议</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Optimization Suggestions</p>
              </div>
            </div>

            <div className="space-y-2 md:space-y-4">
              {result.optimization_suggestions
                .sort((a, b) => {
                  const priority = { high: 0, medium: 1, low: 2 }
                  return priority[a.priority] - priority[b.priority]
                })
                .map((suggestion, index) => {
                  const badge = getPriorityBadge(suggestion.priority)
                  return (
                    <div
                      key={index}
                      className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h4 className="font-bold text-foreground text-lg">建议 {index + 1}</h4>
                        <Badge variant="outline" className={`${badge.style} border-2`}>
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">类别:</span>
                          <Badge className="bg-indigo-500/20 text-primary border-primary/20">
                            {suggestion.category}
                          </Badge>
                        </div>
                        <p className="text-foreground leading-relaxed">{suggestion.suggestion}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* 文案套路 */}
        {result.copywriting_patterns && (
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-orange-500/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">💬 文案套路</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Copywriting Patterns</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <h3 className="text-lg font-bold text-orange-600 mb-3">🎬 开篇第一句</h3>
                  <p className="text-foreground leading-relaxed">{result.copywriting_patterns.opening_line}</p>
                </div>

                {result.copywriting_patterns.key_phrases && result.copywriting_patterns.key_phrases.length > 0 && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-orange-600 mb-3">🔑 关键话术</h3>
                    <div className="space-y-2">
                      {result.copywriting_patterns.key_phrases.map((phrase, index) => (
                        <div key={index} className="text-sm text-foreground p-2 rounded bg-pink-500/10 border border-pink-500/20">
                          "{phrase}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <h3 className="text-lg font-bold text-orange-600 mb-3">📢 结尾号召</h3>
                  <p className="text-foreground leading-relaxed">{result.copywriting_patterns.closing_cta}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 视觉技巧 */}
        {result.visual_techniques && (
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-orange-500/30 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">📹 视觉技巧</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Visual Techniques</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <h3 className="text-lg font-bold text-orange-600 mb-3">🎥 拍摄手法</h3>
                  <p className="text-foreground leading-relaxed">{result.visual_techniques.shooting_style}</p>
                </div>

                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                  <h3 className="text-lg font-bold text-orange-600 mb-3">✂️ 剪辑节奏</h3>
                  <p className="text-foreground leading-relaxed">{result.visual_techniques.editing_rhythm}</p>
                </div>
              </div>

              {result.visual_techniques.key_techniques && result.visual_techniques.key_techniques.length > 0 && (
                <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border mt-6">
                  <h3 className="text-lg font-bold text-orange-600 mb-4">🎯 关键技巧</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {result.visual_techniques.key_techniques.map((technique, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="text-foreground leading-relaxed">{technique}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 复制指南 - 最重要的部分 */}
        {result.replication_guide && (
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-primary/20 shadow-lg">
            
            <div className="relative p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">🎯 复制指南</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">Replication Guide - How to Apply</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 md:space-y-6">
                {result.replication_guide.top_3_learnings && result.replication_guide.top_3_learnings.length > 0 && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-primary mb-4">📚 Top 3 学习要点</h3>
                    <div className="space-y-2 md:space-y-3">
                      {result.replication_guide.top_3_learnings.map((learning, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-primary/10 border border-primary/20">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-foreground text-lg font-bold">
                            {index + 1}
                          </div>
                          <p className="text-foreground leading-relaxed pt-1">{learning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.replication_guide.quick_wins && result.replication_guide.quick_wins.length > 0 && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-green-600 mb-4">⚡ 快速见效技巧</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {result.replication_guide.quick_wins.map((win, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 md:p-4 rounded-lg md:rounded-xl bg-green-500/10 border border-green-500/20">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-foreground leading-relaxed">{win}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.replication_guide.step_by_step && result.replication_guide.step_by_step.length > 0 && (
                  <div className="bg-secondary/50 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 border border-border">
                    <h3 className="text-lg font-bold text-primary mb-4">📝 复制步骤</h3>
                    <div className="space-y-2 md:space-y-3">
                      {result.replication_guide.step_by_step.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-indigo-500/10 border border-primary/20">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <p className="text-foreground leading-relaxed pt-1">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl glass-card border border-border">
          <div className="relative p-3 md:p-6 text-center space-y-2 md:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-secondary/50 border border-border">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">基于薛辉短视频创作方法论</span>
            </div>
            <div className="text-sm text-muted-foreground">{new Date().toLocaleString('zh-CN')}</div>
            <div className="text-xs text-muted-foreground">AI 视频分析报告 | 仅供参考</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 生成模拟情绪曲线数据
function generateEmotionCurveData(duration: number) {
  const points = Math.min(Math.max(Math.floor(duration / 5), 8), 20)
  const data = []

  for (let i = 0; i <= points; i++) {
    const time = Math.floor((i / points) * duration)
    // 模拟情绪波动：开头高，中间起伏，结尾回升
    let emotion = 70
    if (i === 0) emotion = 85 // 开头钩子
    else if (i < points * 0.3) emotion = 60 + Math.random() * 15
    else if (i < points * 0.6) emotion = 50 + Math.random() * 20
    else if (i < points * 0.8) emotion = 55 + Math.random() * 25
    else emotion = 70 + Math.random() * 20 // 结尾高潮

    data.push({
      time: `${time}s`,
      emotion: Math.round(emotion),
    })
  }

  return data
}
