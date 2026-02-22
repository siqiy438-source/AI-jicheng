import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PageLayout } from "@/components/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Minus, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCredits } from "@/lib/credits";

interface UserRow {
  id: string;
  email: string;
  credits: number;
  role: string;
  plan_tier: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 调整积分弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserRow | null>(null);
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users", {
      p_page: page,
      p_page_size: PAGE_SIZE,
      p_search: search || null,
    });
    if (error || !data?.success) {
      toast({ title: "加载失败", description: error?.message || data?.error, variant: "destructive" });
      setLoading(false);
      return;
    }
    setUsers(data.data || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openAdjustDialog = (user: UserRow) => {
    setTargetUser(user);
    setAdjustType("add");
    setAdjustAmount("");
    setAdjustReason("");
    setDialogOpen(true);
  };

  const handleAdjust = async () => {
    if (!targetUser || !adjustAmount) return;
    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "请输入有效的积分数量", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("admin_adjust_credits", {
      p_target_user_id: targetUser.id,
      p_type: adjustType,
      p_amount: amount,
      p_reason: adjustReason,
    });
    setSubmitting(false);
    if (error || !data?.success) {
      const msg = data?.error === "INSUFFICIENT_BALANCE" ? "余额不足" : (error?.message || data?.error);
      toast({ title: "操作失败", description: msg, variant: "destructive" });
      return;
    }
    toast({
      title: adjustType === "add" ? "积分已增加" : "积分已扣减",
      description: `${targetUser.email}: ${formatCredits(data.balance_before)} → ${formatCredits(data.balance_after)}`,
    });
    setDialogOpen(false);
    fetchUsers();
  };

  return (
    <PageLayout maxWidth="6xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">用户管理</h1>
          <p className="text-sm text-muted-foreground">共 {total} 位用户</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜索邮箱..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 用户表格 */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮箱</TableHead>
              <TableHead className="text-right">积分</TableHead>
              <TableHead className="hidden md:table-cell">角色</TableHead>
              <TableHead className="hidden md:table-cell">注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  暂无用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{u.email}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCredits(u.credits)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "管理员" : "用户"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openAdjustDialog(u)}>
                      调整积分
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            size="sm" variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            size="sm" variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 调整积分弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>调整积分</DialogTitle>
          </DialogHeader>
          {targetUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                用户：{targetUser.email}（当前余额：{formatCredits(targetUser.credits)}）
              </p>
              <div className="space-y-2">
                <Label>操作类型</Label>
                <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "add" | "deduct")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> 增加积分</span>
                    </SelectItem>
                    <SelectItem value="deduct">
                      <span className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5" /> 扣减积分</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>数量</Label>
                <Input
                  type="number" min="0.01" step="0.01" placeholder="输入积分数量"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>原因（可选）</Label>
                <Textarea
                  placeholder="例如：店员福利充值"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdjust} disabled={submitting || !adjustAmount}>
              {submitting ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Admin;
