import { currentUser } from "@/lib/auth";
import { Navbar } from "./_components/navbar";
import { SidebarNav } from "./_components/sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await currentUser();
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-y-0 left-0 z-50">
        <SidebarNav user={user} />
      </div>
      <div className="pl-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
