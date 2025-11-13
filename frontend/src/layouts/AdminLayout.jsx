import { Outlet } from "react-router-dom";
import AdminPanelLayout from "@/components/common/SidebarMenu/admin-panel-layout";

export default function AdminLayout() {
  return (
    <AdminPanelLayout isAdminPanel={true}>
      <Outlet />
    </AdminPanelLayout>
  );
}
