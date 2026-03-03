import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export const ErrorCard = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            An error occurred during authentication. Please try again.
          </p>
          <Link
            href="/auth"
            className="inline-block w-full text-center py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
