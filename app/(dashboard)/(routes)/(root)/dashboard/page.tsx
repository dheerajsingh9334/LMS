"use client";

import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UpdateDialog } from "@/components/dashboard/update-dialog";
import { db } from "@/lib/db";
import DoughnutChart from "../../../_components/doughnutChart";
import { redirect } from "next/navigation";
import DashboardCoursesCard from "./_components/dashboard-courses";
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
  // Remove rollNo check since User model doesn't have rollNo field
  // useEffect(() => {
  //   const checkRollNo = () => {
  //     try {
  //       if (user && user?.role === UserRole.USER && user.rollNo === "") {
  //         setShowDialog(true);
  //       } else {
  //         setShowDialog(false);
  //       }
  //     } catch (error) {
  //       console.error("Error checking rollNo:", error);
  //     }
  //   };
  //   checkRollNo();
  // }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/analytics/doughnutData?userId=${user.id}`
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
    const dailyCheckIn=async () => {
     
      try {
           const response= await axios.post(`/api/user/trackUserActivity`);
           setCheckInDates(response.data.checkInDates);
          if(response.data.message==="First time" && !checkInShown){
         toast.success("Daily Check-in");
            setCheckInShown(true);
          }
      } catch (error) {
          console.error("Error tracking daily check-In progress:", error);
      }
   
    }

    fetchData();
   dailyCheckIn();
  }, [user.id,checkInShown]);
  
  const handleCloseDialog = () => {
    // Close the Dialog
    setShowDialog(false);
  };

  return (
    <>
      {showDialog && user && (
        <UpdateDialog onClose={() => setShowDialog(false)} userId={user?.id} />
      )}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        {/* Main content area */}
        <div className="flex-1 p-4 md:p-6 space-y-6 md:mr-80">
          <DashboardCoursesCard userId={user.id!} />
        </div>

        {/* Sidebar with Chart only */}
        <div className="hidden md:block fixed right-0 top-[80px] bottom-0 w-80 p-6 bg-gradient-to-b from-gray-50 to-white border-l border-gray-200 overflow-y-auto">
          {chartData.data.length === 0 || chartData.labels.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-[400px] flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No data available</p>
              <p className="text-gray-400 text-sm mt-1">Start enrolling in courses to see progress</p>
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
