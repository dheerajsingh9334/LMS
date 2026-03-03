"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { newVerification } from "@/actions/new-verification";

export default function NewVerificationPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    try {
      const result = await newVerification(token);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
      } else {
        setStatus("success");
        setMessage(result.success || "Email verified successfully!");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {/* Icon header */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-blue-100">
            <ShieldCheck className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Email Verification
        </h1>

        {/* Status area */}
        <div className="mt-6 flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-gray-600">Verifying your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-green-700 font-medium">{message}</p>
              <Link
                href="/auth"
                className="mt-2 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Continue to Login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-700 font-medium">{message}</p>
              <Link
                href="/auth"
                className="mt-2 inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
