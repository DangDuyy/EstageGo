import NavBar from "@/components/common/NavBar";
import AdminPanelLayout from "@/components/common/SidebarMenu/admin-panel-layout";
import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";

function DashboardPage() {
  return (
    <AdminPanelLayout>
      <NavBar hideLogo />
      <ContentLayout title="Dashboard">
        <div>Welcome to the Dashboard</div>
      </ContentLayout>
    </AdminPanelLayout>
  );
}

export default DashboardPage;
