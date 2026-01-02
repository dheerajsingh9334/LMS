"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Award, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Certificate {
  id: string;
  studentName: string;
  percentage: number;
  issueDate: string;
  certificateUrl?: string;
  verificationCode: string;
}

interface CertificateSectionProps {
  courseId: string;
  userId: string;
}

export const CertificateSection = ({ courseId, userId }: CertificateSectionProps) => {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}/certificate`);
        setCertificate(response.data);
      } catch (error) {
        // No certificate found - this is normal
        setCertificate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Certificate
        </h3>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 text-sm">
            Complete all chapters, quizzes, and assignments to earn your certificate of completion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-600" />
        Certificate Earned!
      </h3>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-green-800">Certificate of Completion</h4>
            <p className="text-sm text-green-700 mt-1">
              Congratulations! You have successfully completed this course.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-green-600">
              <div>Score: {certificate.percentage}%</div>
              <div>Issued: {new Date(certificate.issueDate).toLocaleDateString()}</div>
              <div>Code: {certificate.verificationCode}</div>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Link href={`/courses/${courseId}/certificate`}>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            {certificate.certificateUrl && (
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};