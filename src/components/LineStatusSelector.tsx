import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LineStatus, LineStatusMap } from '@/hooks/use-line-status'

interface LineOption {
  id: string
  name: string
  badge?: string
}

interface LineStatusSelectorProps {
  selectedLine: string
  lineOptions: LineOption[]
  statuses: LineStatusMap
  onSelect: (lineId: string) => void
  disabled?: boolean
  /** 面板在移动端靠右对齐（AIDrawing 等窄容器场景） */
  alignRight?: boolean
}

function StatusDot({ status, className }: { status: LineStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full flex-shrink-0',
        status === 'normal'   && 'bg-emerald-500',
        status === 'degraded' && 'bg-amber-500',
        status === 'down'     && 'bg-red-500',
        status === 'unknown'  && 'bg-gray-300 animate-pulse',
        className
      )}
    />
  )
}

export function LineStatusSelector({
  selectedLine,
  lineOptions,
  statuses,
  onSelect,
  disabled,
  alignRight = false,
}: LineStatusSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentOption = lineOptions.find(o => o.id === selectedLine)
  const currentStatus = statuses[selectedLine]?.status ?? 'unknown'

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => { if (!disabled) setOpen(v => !v) }}
        className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 rounded-full text-[11px] md:text-sm bg-secondary/50 text-muted-foreground hover:bg-secondary transition-all duration-200 border border-transparent touch-target whitespace-nowrap"
      >
        <StatusDot status={currentStatus} className="w-1.5 h-1.5" />
        <Zap className="w-3.5 h-3.5" />
        <span>{currentOption?.name}</span>
        {currentOption?.badge && (
          <span className="px-1 py-0.5 text-[10px] md:text-xs leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
            {currentOption.badge}
          </span>
        )}
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-2 bg-card border border-border rounded-xl shadow-[0_8px_30px_-8px_hsl(30_20%_20%/0.15)] py-1 z-10 w-[200px] max-w-[calc(100vw-2rem)] animate-dropdown dropdown-panel',
            alignRight ? 'right-0 sm:left-0 sm:right-auto' : 'left-0'
          )}
        >
          {lineOptions.map(option => {
            const status = statuses[option.id]?.status ?? 'unknown'
            const isDown = status === 'down'
            const isDegraded = status === 'degraded'

            return (
              <button
                key={option.id}
                onClick={() => { onSelect(option.id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-secondary/50 transition-all duration-200 text-left touch-target',
                  selectedLine === option.id && 'bg-orange-50 text-orange-700',
                  isDown && 'bg-red-50/50'
                )}
              >
                <StatusDot status={status} className="w-2 h-2" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-sm', selectedLine === option.id && 'font-medium')}>
                      {option.name}
                    </span>
                    {option.badge && (
                      <span className="px-1 py-0.5 text-[10px] leading-none font-medium bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {isDown && (
                    <p className="text-[10px] text-red-400 leading-none mt-0.5">可能不稳定</p>
                  )}
                  {isDegraded && (
                    <p className="text-[10px] text-amber-500 leading-none mt-0.5">响应较慢</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
