import { PageLayout } from "@/components/PageLayout";
import { LayoutDashboard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { AdjustmentsTab } from "@/components/admin/AdjustmentsTab";

const Admin = () => {
  return (
    <PageLayout maxWidth="6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-semibold">管理后台</h1>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">数据看板</TabsTrigger>
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="orders">订单管理</TabsTrigger>
          <TabsTrigger value="adjustments">调整记录</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="adjustments"><AdjustmentsTab /></TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Admin;
