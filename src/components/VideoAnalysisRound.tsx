import { VideoAnalysisRound as VideoAnalysisRoundType } from '@/lib/video-analysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface VideoAnalysisRoundProps {
  round: VideoAnalysisRoundType
  onExecute: () => void
  isAnalyzing: boolean
}

export function VideoAnalysisRound({ round, onExecute, isAnalyzing }: VideoAnalysisRoundProps) {
  const getStatusBadge = () => {
    switch (round.status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            已完成
          </Badge>
        )
      case 'analyzing':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            分析中
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            失败
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            待执行
          </Badge>
        )
    }
  }

  const renderResult = () => {
    if (!round.result) return null

    // 如果是原始文本
    if (round.result.raw_text) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{round.result.raw_text}</ReactMarkdown>
        </div>
      )
    }

    // 如果是 JSON 结构，格式化显示
    return (
      <div className="space-y-4">
        {Object.entries(round.result).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <h4 className="font-medium text-sm capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <div className="text-sm text-muted-foreground">
              {typeof value === 'object' ? (
                <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <p>{String(value)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
              {round.round_number}
            </div>
            <div>
              <CardTitle className="text-lg">{round.round_name}</CardTitle>
              <CardDescription>消耗 {round.credits_cost} 积分</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {round.status === 'pending' && (
              <Button
                size="sm"
                onClick={onExecute}
                disabled={isAnalyzing}
              >
                <Play className="mr-1 h-3 w-3" />
                执行分析
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {round.status === 'completed' && round.result && (
        <CardContent>
          {renderResult()}
        </CardContent>
      )}
      {round.status === 'analyzing' && (
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
