"use client";

import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Download, Eye, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IssuedCertificatesListProps {
  courseId: string;
  certificates: any[];
}

export const IssuedCertificatesList = ({
  courseId,
  certificates: initialCertificates,
}: IssuedCertificatesListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [issuing, setIssuing] = useState<Record<string, boolean>>({});

  const filteredCertificates = initialCertificates.filter((cert) => {
    const matchesSearch =
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.verificationCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = filterGrade === "all" || cert.grade === filterGrade;

    return matchesSearch && matchesGrade;
  });

  const getGradeBadgeColor = (grade: string) => {
    const colors: any = {
      "A+": "bg-green-500",
      A: "bg-green-400",
      "B+": "bg-blue-500",
      B: "bg-blue-400",
      "C+": "bg-yellow-500",
      C: "bg-yellow-400",
      D: "bg-orange-400",
      F: "bg-red-400",
    };
    return colors[grade] || "bg-gray-400";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or verification code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterGrade} onValueChange={setFilterGrade}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C+">C+</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
            <SelectItem value="F">F</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredCertificates.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {searchTerm || filterGrade !== "all"
              ? "No certificates match your filters"
              : "No certificates issued yet"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className="font-medium">
                    {certificate.studentName}
                    {certificate.studentRollNo && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({certificate.studentRollNo})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {certificate.studentEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getGradeBadgeColor(certificate.grade || "N/A")}
                    >
                      {certificate.grade || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {certificate.achievedScore}/{certificate.totalScore}
                      </div>
                      <div className="text-muted-foreground">
                        {certificate.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div>
                        Chapters: {certificate.completedChapters}/
                        {certificate.totalChapters}
                      </div>
                      <div>
                        Quizzes: {certificate.completedQuizzes}/
                        {certificate.totalQuizzes}
                      </div>
                      <div>
                        Assignments: {certificate.completedAssignments}/
                        {certificate.totalAssignments}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(certificate.issueDate), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {certificate.verificationCode}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Issue/Regenerate button */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!!issuing[certificate.id]}
                        onClick={async () => {
                          try {
                            setIssuing((s) => ({
                              ...s,
                              [certificate.id]: true,
                            }));
                            const res = await axios.post(
                              `/api/courses/${courseId}/certificate/issue`,
                              {
                                certificateId: certificate.id,
                              }
                            );
                            const url = res.data?.certificateUrl;
                            if (url) {
                              certificate.certificateUrl = url;
                            }
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIssuing((s) => ({
                              ...s,
                              [certificate.id]: false,
                            }));
                          }
                        }}
                      >
                        {issuing[certificate.id]
                          ? "Issuing..."
                          : certificate.certificateUrl
                          ? "Regenerate"
                          : "Issue"}
                      </Button>
                      {certificate.certificateUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(certificate.certificateUrl, "_blank")
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = certificate.certificateUrl;
                              link.download = `certificate-${certificate.verificationCode}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          Showing {filteredCertificates.length} of {initialCertificates.length}{" "}
          certificates
        </div>
        {initialCertificates.length > 0 && (
          <div>
            Average Score:{" "}
            {(
              initialCertificates.reduce(
                (sum, cert) => sum + cert.percentage,
                0
              ) / initialCertificates.length
            ).toFixed(1)}
            %
          </div>
        )}
      </div>
    </div>
  );
};
