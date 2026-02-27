import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { callAdminUsers } from "@/lib/admin-api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Plus, Minus, ChevronLeft, ChevronRight, MoreHorizontal,
  UserPlus, Trash2, ShieldCheck, ShieldOff, Ban, CheckCircle2,
  Eye, Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCredits, FEATURE_PRICES } from "@/lib/credits";

interface UserRow {
  id: string;
  email: string;
  nickname: string | null;
  credits: number;
  role: string;
  plan_tier: string | null;
  created_at: string;
  banned: boolean;
}

interface UserDetail {
  profile: UserRow;
  works_count: number;
  materials_count: number;
  knowledge_count: number;
  recent_transactions: Array<{
    id: string; type: string; amount: number;
    balance_after: number; description: string; created_at: string;
  }>;
  usage_summary: Array<{
    event_type: string; count: number; last_used: string;
  }>;
}

const PAGE_SIZE = 20;

const TX_TYPE_LABELS: Record<string, string> = {
  add: "积分增加", deduct: "积分扣减", purchase: "用户充值",
  refund: "退款", register: "注册赠送",
};

function translateTx(type: string, description: string): string {
  // 先尝试从 description 中提取 feature code（格式如 "ai_fashion_standard#xxx"）
  const featureKey = description?.split("#")[0];
  if (featureKey && FEATURE_PRICES[featureKey]) {
    return FEATURE_PRICES[featureKey].name;
  }
  // 再尝试 type 映射
  if (TX_TYPE_LABELS[type]) return TX_TYPE_LABELS[type];
  // description 本身可能已经是中文
  if (description && /[\u4e00-\u9fa5]/.test(description)) return description;
  return description || type;
}

export const UsersTab = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 弹窗状态
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<UserRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 调整积分
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // 创建用户
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createCredits, setCreateCredits] = useState("");
  const [createRole, setCreateRole] = useState("user");

  // 删除确认
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  // 角色修改
  const [newRole, setNewRole] = useState("user");

  // 用户详情
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users", {
      p_page: page, p_page_size: PAGE_SIZE, p_search: search || null,
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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── 操作处理 ──

  const openAdjust = (u: UserRow) => {
    setTargetUser(u); setAdjustType("add"); setAdjustAmount(""); setAdjustReason(""); setAdjustOpen(true);
  };

  const handleAdjust = async () => {
    if (!targetUser || !adjustAmount) return;
    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "请输入有效的积分数量", variant: "destructive" }); return; }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("admin_adjust_credits", {
      p_target_user_id: targetUser.id, p_type: adjustType, p_amount: amount, p_reason: adjustReason,
    });
    setSubmitting(false);
    if (error || !data?.success) {
      const msg = data?.error === "INSUFFICIENT_BALANCE" ? "余额不足" : (error?.message || data?.error);
      toast({ title: "操作失败", description: msg, variant: "destructive" }); return;
    }
    toast({ title: adjustType === "add" ? "积分已增加" : "积分已扣减",
      description: `${targetUser.email}: ${formatCredits(data.balance_before)} → ${formatCredits(data.balance_after)}` });
    setAdjustOpen(false); fetchUsers();
  };

  const handleCreate = async () => {
    if (!createEmail || !createPassword) { toast({ title: "请填写邮箱和密码", variant: "destructive" }); return; }
    setSubmitting(true);
    const result = await callAdminUsers({
      action: "create", email: createEmail, password: createPassword,
      credits: createCredits ? Number(createCredits) : undefined, role: createRole,
    });
    setSubmitting(false);
    if (!result.success) { toast({ title: "创建失败", description: result.error, variant: "destructive" }); return; }
    toast({ title: "用户已创建", description: createEmail });
    setCreateOpen(false); setCreateEmail(""); setCreatePassword(""); setCreateCredits(""); setCreateRole("user");
    fetchUsers();
  };

  const openDelete = (u: UserRow) => { setTargetUser(u); setDeleteConfirmEmail(""); setDeleteOpen(true); };

  const handleDelete = async () => {
    if (!targetUser) return;
    setSubmitting(true);
    const result = await callAdminUsers({ action: "delete", userId: targetUser.id });
    setSubmitting(false);
    if (!result.success) { toast({ title: "删除失败", description: result.error, variant: "destructive" }); return; }
    toast({ title: "用户已删除", description: targetUser.email });
    setDeleteOpen(false); fetchUsers();
  };

  const openRole = (u: UserRow) => { setTargetUser(u); setNewRole(u.role); setRoleOpen(true); };

  const handleRoleChange = async () => {
    if (!targetUser) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("admin_update_user_role", {
      p_target_user_id: targetUser.id, p_new_role: newRole,
    });
    setSubmitting(false);
    if (error || !data?.success) {
      const msg = data?.error === "CANNOT_DEMOTE_SELF" ? "不能降级自己" : (error?.message || data?.error);
      toast({ title: "操作失败", description: msg, variant: "destructive" }); return;
    }
    toast({ title: "角色已修改", description: `${targetUser.email} → ${newRole === "admin" ? "管理员" : "用户"}` });
    setRoleOpen(false); fetchUsers();
  };

  const openBan = (u: UserRow) => { setTargetUser(u); setBanOpen(true); };

  const handleBanToggle = async () => {
    if (!targetUser) return;
    const action = targetUser.banned ? "unban" : "ban";
    setSubmitting(true);
    const result = await callAdminUsers({ action, userId: targetUser.id });
    setSubmitting(false);
    if (!result.success) { toast({ title: "操作失败", description: result.error, variant: "destructive" }); return; }
    toast({ title: targetUser.banned ? "已解禁" : "已禁用", description: targetUser.email });
    setBanOpen(false); fetchUsers();
  };

  const openDetail = async (u: UserRow) => {
    setTargetUser(u); setDetail(null); setDetailOpen(true); setDetailLoading(true);
    const { data, error } = await supabase.rpc("admin_get_user_detail", { p_user_id: u.id });
    setDetailLoading(false);
    if (error || !data?.success) { toast({ title: "加载失败", variant: "destructive" }); return; }
    setDetail(data as unknown as UserDetail);
  };

  const isSelf = (u: UserRow) => u.id === currentUser?.id;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">共 {total} 位用户</div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" /> 添加用户
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="搜索邮箱或昵称..." value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>邮箱</TableHead>
              <TableHead className="text-right">积分</TableHead>
              <TableHead className="hidden md:table-cell">角色</TableHead>
              <TableHead className="hidden md:table-cell">状态</TableHead>
              <TableHead className="hidden md:table-cell">注册时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">加载中...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">暂无用户</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} className={u.banned ? "opacity-60" : ""}>
                <TableCell className="max-w-[200px]">
                  <div className="font-medium truncate">{u.nickname || u.email.split("@")[0]}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCredits(u.credits)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                    {u.role === "admin" ? "管理员" : "用户"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {u.banned ? (
                    <Badge variant="destructive">已禁用</Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">正常</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {new Date(u.created_at).toLocaleDateString("zh-CN")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(u)}>
                        <Eye className="w-4 h-4 mr-2" /> 查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAdjust(u)}>
                        <Coins className="w-4 h-4 mr-2" /> 调整积分
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRole(u)} disabled={isSelf(u)}>
                        {u.role === "admin" ? <ShieldOff className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                        {u.role === "admin" ? "降为用户" : "设为管理员"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openBan(u)} disabled={isSelf(u)}>
                        {u.banned ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                        {u.banned ? "解除禁用" : "禁用账号"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDelete(u)} disabled={isSelf(u)}>
                        <Trash2 className="w-4 h-4 mr-2" /> 删除用户
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
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

      {/* 调整积分弹窗 */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>调整积分</DialogTitle></DialogHeader>
          {targetUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                用户：{targetUser.email}（当前余额：{formatCredits(targetUser.credits)}）
              </p>
              <div className="space-y-2">
                <Label>操作类型</Label>
                <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "add" | "deduct")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add"><span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> 增加积分</span></SelectItem>
                    <SelectItem value="deduct"><span className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5" /> 扣减积分</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>数量</Label>
                <Input type="number" min="0.01" step="0.01" placeholder="输入积分数量"
                  value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>原因（可选）</Label>
                <Textarea placeholder="例如：店员福利充值" value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>取消</Button>
            <Button onClick={handleAdjust} disabled={submitting || !adjustAmount}>
              {submitting ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建用户弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>添加用户</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>邮箱 *</Label>
              <Input type="email" placeholder="user@example.com" value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>密码 *</Label>
              <Input type="password" placeholder="至少6位" value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>初始积分（默认注册赠送）</Label>
              <Input type="number" min="0" step="1" placeholder="留空使用默认值"
                value={createCredits} onChange={(e) => setCreateCredits(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={createRole} onValueChange={setCreateRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting || !createEmail || !createPassword}>
              {submitting ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">删除用户</DialogTitle>
            <DialogDescription>
              此操作不可撤销，将永久删除该用户的所有数据（作品、素材、积分记录等）。
            </DialogDescription>
          </DialogHeader>
          {targetUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm">请输入 <span className="font-semibold">{targetUser.email}</span> 确认删除：</p>
              <Input value={deleteConfirmEmail} onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder="输入用户邮箱确认" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}
              disabled={submitting || deleteConfirmEmail !== targetUser?.email}>
              {submitting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 角色修改弹窗 */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>修改角色</DialogTitle></DialogHeader>
          {targetUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">{targetUser.email}</p>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>取消</Button>
            <Button onClick={handleRoleChange} disabled={submitting || newRole === targetUser?.role}>
              {submitting ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 禁用/启用确认弹窗 */}
      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{targetUser?.banned ? "解除禁用" : "禁用账号"}</DialogTitle>
            <DialogDescription>
              {targetUser?.banned
                ? `确定要解除 ${targetUser?.email} 的禁用状态吗？`
                : `禁用后该用户将无法登录。确定要禁用 ${targetUser?.email} 吗？`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(false)}>取消</Button>
            <Button variant={targetUser?.banned ? "default" : "destructive"} onClick={handleBanToggle} disabled={submitting}>
              {submitting ? "处理中..." : targetUser?.banned ? "确认解禁" : "确认禁用"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 用户详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>
              {targetUser?.nickname && <span className="font-medium text-foreground">{targetUser.nickname} · </span>}
              {targetUser?.email}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-12 text-center text-muted-foreground">加载中...</div>
          ) : detail ? (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "作品", value: detail.works_count },
                  { label: "素材", value: detail.materials_count },
                  { label: "知识库", value: detail.knowledge_count },
                  { label: "积分余额", value: formatCredits(targetUser?.credits ?? 0) },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border p-3 text-center">
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              {detail.recent_transactions && detail.recent_transactions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">最近积分记录</h4>
                  <div className="space-y-1.5">
                    {detail.recent_transactions.map((t: { id: string; type: string; amount: number; description: string; created_at: string }) => {
                      const isDeduct = t.type === "deduct";
                      const displayAmount = isDeduct ? -Math.abs(t.amount) : Math.abs(t.amount);
                      return (
                      <div key={t.id} className="flex items-center justify-between text-sm rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={isDeduct ? "secondary" : "default"} className="text-xs">
                            {displayAmount > 0 ? "+" : ""}{displayAmount}
                          </Badge>
                          <span className="truncate max-w-[160px] text-muted-foreground">{translateTx(t.type, t.description)}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString("zh-CN")}</span>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detail.usage_summary && detail.usage_summary.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">功能使用统计</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {detail.usage_summary.map((u: { event_type: string; count: number; last_used: string }) => (
                      <div key={u.event_type} className="flex items-center justify-between text-sm rounded-lg border px-3 py-2">
                        <span className="truncate text-muted-foreground">{FEATURE_PRICES[u.event_type]?.name || u.event_type}</span>
                        <span className="font-medium tabular-nums ml-2">{u.count}次</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">加载失败</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}