"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface QuickSetupBannerProps {
  courseId: string;
  isTeacher?: boolean;
  missingSetups: string[];
}

export const QuickSetupBanner = ({ 
  courseId, 
  isTeacher = false, 
  missingSetups 
}: QuickSetupBannerProps) => {
  const [loading, setLoading] = useState(false);

  const handleQuickSetup = async () => {
    setLoading(true);
    try {
      // First verify assignments
      if (missingSetups.includes('assignments')) {
        const verifyResponse = await fetch(`/api/courses/${courseId}/verify-assignments`, {
          method: 'POST'
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          toast.success(verifyData.message);
        }
      }

      // Then enable final exam
      if (missingSetups.includes('finalExam')) {
        const setupResponse = await fetch(`/api/courses/${courseId}/quick-setup`, {
          method: 'POST'
        });
        
        if (setupResponse.ok) {
          const setupData = await setupResponse.json();
          toast.success(setupData.message);
        }
      }

      // Reload page after setup
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Quick setup failed:', error);
      toast.error('Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher || missingSetups.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-grow">
            <h3 className="font-semibold text-orange-800 mb-1">
              Course Setup Required
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              Complete the setup to enable final exam and certification for your students.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {missingSetups.includes('assignments') && (
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  Verify Assignments
                </Badge>
              )}
              {missingSetups.includes('finalExam') && (
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  Enable Final Exam
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleQuickSetup}
                disabled={loading}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Setting up...' : 'Quick Setup (Auto)'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a href={`/teacher/courses/${courseId}/assignments`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manual Setup
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};