import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Streaming Test",
  description: "Test page for live streaming functionality",
};

export default function TestLivePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold">Live Streaming Test</h1>
        
        <div className="space-y-4">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-xl font-semibold text-green-800 mb-2">✅ SSR Issues Fixed</h2>
            <p className="text-green-700">
              Agora SDK is now loaded dynamically to prevent &quot;window is not defined&quot; errors during server-side rendering.
            </p>
          </div>
          
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">🎥 Live Session Routes</h2>
            <div className="text-blue-700 space-y-2">
              <p><strong>Teacher Route:</strong> /teacher/courses/[courseId] (Live session form)</p>
              <p><strong>Student Route:</strong> /courses/[courseId]/live/[liveSessionId]</p>
              <p><strong>API Routes:</strong> /api/courses/[courseId]/live/* (Token generation, etc.)</p>
            </div>
          </div>
          
          <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
            <h2 className="text-xl font-semibold text-purple-800 mb-2">🚀 Dynamic Loading</h2>
            <p className="text-purple-700">
              All Agora components now use dynamic imports with SSR disabled to ensure client-side only loading.
            </p>
          </div>
        </div>
        
        <div className="mt-8 space-y-3">
          <a 
            href="/dashboard" 
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
          <br />
          <a 
            href="/courses" 
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Courses
          </a>
        </div>
      </div>
    </div>
  );
}