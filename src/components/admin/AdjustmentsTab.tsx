import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCredits } from "@/lib/credits";

interface AdjustmentRow {
  id: string;
  adjustment_type: "add" | "deduct";
  amount: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  created_at: string;
  admin_email: string;
  target_email: string;
}

const PAGE_SIZE = 20;

export const AdjustmentsTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdjustmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_adjustments", {
      p_page: page,
      p_page_size: PAGE_SIZE,
    });
    if (error || !data?.success) {
      toast({ title: "加载失败", description: error?.message || data?.error, variant: "destructive" });
      setLoading(false);
      return;
    }
    setRows(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <div className="text-sm text-muted-foreground mb-4">共 {total} 条记录</div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>目标用户</TableHead>
              <TableHead>类型</TableHead>
              <TableHead className="text-right">数量</TableHead>
              <TableHead className="hidden md:table-cell text-right">调整后余额</TableHead>
              <TableHead className="hidden md:table-cell">原因</TableHead>
              <TableHead className="hidden md:table-cell">操作管理员</TableHead>
              <TableHead className="hidden md:table-cell">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">加载中...</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">暂无记录</TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[160px] truncate text-sm">{r.target_email}</TableCell>
                  <TableCell>
                    <Badge variant={r.adjustment_type === "add" ? "default" : "destructive"}>
                      {r.adjustment_type === "add" ? "+增加" : "-扣减"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {r.adjustment_type === "add" ? "+" : "-"}{formatCredits(r.amount)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-muted-foreground">
                    {formatCredits(r.balance_after)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[120px] truncate">
                    {r.reason || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[140px] truncate">
                    {r.admin_email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {new Date(r.created_at).toLocaleDateString("zh-CN")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
};
