import NavBar from "@/components/common/NavBar";
import AdminPanelLayout from "@/components/common/SidebarMenu/admin-panel-layout";
import { Outlet } from "react-router-dom";

// DashboardLayout keeps Sidebar + NavBar mounted and only swaps the nested route content via <Outlet />
export default function DashboardLayout() {
  return (
    <AdminPanelLayout>
      <NavBar hideLogo />
      <Outlet />
    </AdminPanelLayout>
  );
}
