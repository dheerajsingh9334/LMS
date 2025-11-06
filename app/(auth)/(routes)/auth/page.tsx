"use client";

import Link from "next/link";
import { GraduationCap, BookOpen } from "lucide-react";

const AuthSelectionPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to LMS Platform
          </h1>
          <p className="text-xl text-gray-300">
            Choose your role to continue
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Card */}
          <div className="group relative bg-white rounded-3xl shadow-2xl p-8 hover:scale-105 transition-all duration-300 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                I&apos;m a Student
              </h2>
              <p className="text-gray-600 mb-6">
                Access your courses, complete assignments, and track your
                learning progress.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span>Browse and enroll in courses</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span>Track your learning progress</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span>Complete quizzes and earn certificates</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  <span>Join live classes</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/auth/student/login"
                  className="flex-1 bg-blue-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/student/register"
                  className="flex-1 border-2 border-blue-500 text-blue-500 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* Teacher Card */}
          <div className="group relative bg-white rounded-3xl shadow-2xl p-8 hover:scale-105 transition-all duration-300 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                I&apos;m a Teacher
              </h2>
              <p className="text-gray-600 mb-6">
                Create and manage courses, engage with students, and track
                their progress.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  <span>Create and publish courses</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  <span>Manage course content and materials</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  <span>Host live sessions with students</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                  <span>Monitor student performance</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/auth/teacher/login"
                  className="flex-1 bg-purple-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/teacher/register"
                  className="flex-1 border-2 border-purple-500 text-purple-500 text-center py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-gray-300 hover:text-white underline text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthSelectionPage;
