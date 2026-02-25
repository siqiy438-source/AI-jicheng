import { Coins } from 'lucide-react'
import { FEATURE_PRICES } from '@/lib/credits'
import { cn } from '@/lib/utils'

interface CreditCostHintProps {
  featureCode?: string
  label?: string
  className?: string
}

export function CreditCostHint({ featureCode, label, className }: CreditCostHintProps) {
  let text = label
  if (!text) {
    if (!featureCode) return null
    const feature = FEATURE_PRICES[featureCode]
    if (!feature) return null
    text = feature.billing === 'token' ? '按用量计费' : `${feature.cost} 积分`
  }

  return (
    <span className={cn("flex items-center gap-1 text-xs text-muted-foreground/70", className)}>
      <Coins className="w-3 h-3" />
      {text}
    </span>
  )
}
