"use client";

import Link from "next/link";
import { Award, CheckCircle, Download, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CertificationDetailsProps {
  courseTitle: string;
  hasCertificate: boolean;
  courseId: string;
}

export const CertificationDetails = ({
  courseTitle,
  hasCertificate,
  courseId,
}: CertificationDetailsProps) => {
  if (!hasCertificate) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-500 rounded-lg">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Certificate of Completion
          </h2>
          <p className="text-sm text-slate-600">
            Earn a verified certificate upon completion
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border-amber-200">
          <h3 className="font-semibold text-lg mb-4 text-slate-900">
            What&apos;s Included:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                Official certificate with course completion verification
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                Shareable on LinkedIn, resume, and social media
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                Downloadable PDF format for printing
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">
                Verification code for authenticity
              </span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 bg-white border-amber-200">
          <h3 className="font-semibold text-lg mb-4 text-slate-900">
            How to Earn Your Certificate:
          </h3>
          <ol className="space-y-3 list-decimal list-inside text-slate-700">
            <li>Complete all course chapters and lessons</li>
            <li>Pass all quizzes and assignments</li>
            <li>Submit required projects (if applicable)</li>
            <li>Receive your certificate automatically</li>
          </ol>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Link
              href={`/courses/${courseId}/certificate`}
              className="block hover:bg-amber-100 rounded-md px-2 py-1 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-sm text-amber-900">
                  Certificate Preview
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Click to view a live preview of your certificate with your
                details, course title, completion date, and instructor
                signature.
              </p>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg border-2 border-amber-300">
        <div className="flex items-start gap-3">
          <Share2 className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">
              Share Your Achievement
            </h4>
            <p className="text-sm text-slate-600">
              Add your certificate to your LinkedIn profile to showcase your
              skills and stand out to employers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
