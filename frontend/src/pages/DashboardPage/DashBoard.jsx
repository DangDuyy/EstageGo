import NavBar from "@/components/common/NavBar";
import AdminPanelLayout from "@/components/common/SidebarMenu/admin-panel-layout";
import Profile from "./Profile";

function DashboardPage() {
  return (
    <AdminPanelLayout>
      <NavBar hideLogo />
      <Profile title="Account Settings"/>
    </AdminPanelLayout>
  );
}

export default DashboardPage;
