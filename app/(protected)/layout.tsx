import { Navbar as DashboardNavbar } from "../(dashboard)/_components/navbar";
import { Sidebar } from "../(dashboard)/_components/sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return (
    <div className="h-full dashboard-container">
      <div className="h-[80px] md:pl-64 fixed inset-y-0 w-full z-50">
        <DashboardNavbar />
      </div>
      <div className="hidden md:flex h-full w-64 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-64 pt-[80px] h-full">{children}</main>
    </div>
  );
};

export default ProtectedLayout;
