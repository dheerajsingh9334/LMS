import { AnalyticsDashboard } from "./_components/analytics";
import { RoleProtectedPage } from "@/components/auth/role-protected-page";
import { UserRole } from "@prisma/client";

const AnalyticsPage = () => {
    return ( 
        <RoleProtectedPage allowedRole={UserRole.TEACHER}>
            <AnalyticsDashboard/>
        </RoleProtectedPage>
     );
  }
   
  export default AnalyticsPage;