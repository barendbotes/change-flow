import { DashboardStats } from "@/components/dashboard-stats";
import { RecentRequests } from "@/components/recent-requests";
import { getDashboardStats } from "@/data/dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your requests and approvals.
        </p>
      </div>

      <DashboardStats stats={stats} />
      <RecentRequests requests={stats.recentRequests} />
    </div>
  );
}
