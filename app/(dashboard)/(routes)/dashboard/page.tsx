"use client";

import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UpdateDialog } from "@/components/dashboard/update-dialog";
import DoughnutChart from "../../_components/doughnutChart";
import { redirect } from "next/navigation";
import DashboardCoursesCard from "../(root)/dashboard/_components/dashboard-courses";
import { trackUserActivity } from "@/lib/trackUserActivity";
import axios from "axios";
import toast from "react-hot-toast";

enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER",
  USER = "USER",
}

interface CategoryData {
  category: string;
  percentage: number;
}

const Dashboard = () => {
  const user = useCurrentUser();
  const [showDialog, setShowDialog] = useState(false);
  const [chartData, setChartData] = useState<{
    labels: string[];
    data: number[];
  }>({ labels: [], data: [] });
  const [checkInShown, setCheckInShown] = useState(false);
  const [checkInDates, setCheckInDates] = React.useState<string[]>([]);

  if (!user) {
    redirect("/");
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/analytics/doughnutData?userId=${user.id}`,
        );
        const data = await response.json();

        if (response.ok) {
          setChartData({ labels: data.labels, data: data.data });
        } else {
          console.error("Failed to fetch chart data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };
    const dailyCheckIn = async () => {
      try {
        const response = await axios.post(`/api/user/trackUserActivity`);
        setCheckInDates(response.data.checkInDates);
        if (response.data.message === "First time" && !checkInShown) {
          toast.success("Daily Check-in");
          setCheckInShown(true);
        }
      } catch (error) {
        console.error("Error tracking daily check-In progress:", error);
      }
    };

    fetchData();
    dailyCheckIn();
  }, [user.id, checkInShown]);

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  return (
    <>
      {showDialog && user && (
        <UpdateDialog onClose={() => setShowDialog(false)} userId={user?.id} />
      )}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <div className="flex-1 p-4 md:p-6 space-y-6 md:mr-80">
          <DashboardCoursesCard userId={user.id!} />
        </div>

        <div className="hidden md:block fixed right-0 top-[80px] bottom-0 w-80 p-6 bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 overflow-y-auto">
          {chartData.data.length === 0 || chartData.labels.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[400px] flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2">...</div>
              <p className="text-gray-600 font-medium">No data available</p>
              <p className="text-gray-400 text-sm mt-1">
                Start enrolling in courses to see progress
              </p>
            </div>
          ) : (
            <DoughnutChart labels={chartData.labels} data={chartData.data} />
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
