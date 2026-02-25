import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrderRow {
  id: string;
  order_no: string;
  amount: number;
  credits_total: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  user_email: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid:    { label: "已支付", variant: "default" },
  pending: { label: "待支付", variant: "secondary" },
  failed:  { label: "失败",   variant: "destructive" },
  expired: { label: "已过期", variant: "outline" },
};

const PAGE_SIZE = 20;

export const OrdersTab = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_orders", {
      p_page: page,
      p_page_size: PAGE_SIZE,
      p_status: statusFilter === "all" ? null : statusFilter,
    });
    if (error || !data?.success) {
      toast({ title: "加载失败", description: error?.message || data?.error, variant: "destructive" });
      setLoading(false);
      return;
    }
    setOrders(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, statusFilter, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">共 {total} 条订单</span>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="paid">已支付</SelectItem>
            <SelectItem value="pending">待支付</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead className="hidden md:table-cell">订单号</TableHead>
              <TableHead className="text-right">金额</TableHead>
              <TableHead className="text-right hidden md:table-cell">积分</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="hidden md:table-cell">时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">加载中...</TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">暂无订单</TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const s = STATUS_MAP[o.status] ?? { label: o.status, variant: "secondary" as const };
                return (
                  <TableRow key={o.id}>
                    <TableCell className="max-w-[160px] truncate text-sm">{o.user_email}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">{o.order_no}</TableCell>
                    <TableCell className="text-right tabular-nums">¥{Number(o.amount).toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums hidden md:table-cell">{o.credits_total}</TableCell>
                    <TableCell><Badge variant={s.variant}>{s.label}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {new Date(o.created_at).toLocaleDateString("zh-CN")}
                    </TableCell>
                  </TableRow>
                );
              })
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
