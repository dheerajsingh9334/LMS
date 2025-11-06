// app/teacher/analytics/layout.tsx
import React from 'react';
import { Topbar } from './_components/topbar';
import { AnalyticsSidebar } from './_components/analytics-sidebar';

const AnalyticsLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Topbar />
      <div className="flex h-screen">
        <AnalyticsSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </>
  );
};

export default AnalyticsLayout;
