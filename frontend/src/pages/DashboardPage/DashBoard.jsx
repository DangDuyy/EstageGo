import { ContentLayout } from "@/components/common/SidebarMenu/content-layout";

export default function DashboardPage() {
  return (
    <ContentLayout title="Dashboard">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Welcome back!</h2>
        <p className="text-muted-foreground">This is your dashboard overview area. Add stats / charts here.</p>
      </div>
    </ContentLayout>
  );
}
