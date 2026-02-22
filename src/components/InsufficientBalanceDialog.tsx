import { Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCredits } from '@/lib/credits';

interface InsufficientBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  required: number;
  featureName: string;
  onRecharge: () => void;
}

export function InsufficientBalanceDialog({
  open,
  onOpenChange,
  balance,
  required,
  featureName,
  onRecharge,
}: InsufficientBalanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            积分不足
          </DialogTitle>
          <DialogDescription>
            {featureName} 需要 {formatCredits(required)} 积分
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">当前余额</span>
            <span className="font-medium">{formatCredits(balance)} 积分</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">还需</span>
            <span className="font-medium text-red-500">
              {formatCredits(required - balance)} 积分
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onRecharge}>去充值</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
