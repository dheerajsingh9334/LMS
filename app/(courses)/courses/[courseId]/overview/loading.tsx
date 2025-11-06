import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Back button skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Skeleton className="h-8 w-32 bg-white/20" />
              <Skeleton className="h-12 w-full bg-white/20" />
              <Skeleton className="h-6 w-full bg-white/20" />
              <Skeleton className="h-6 w-3/4 bg-white/20" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32 bg-white/20" />
                <Skeleton className="h-12 w-32 bg-white/20" />
                <Skeleton className="h-12 w-32 bg-white/20" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl bg-white/20" />
            </div>

            {/* Right Column - Image */}
            <Skeleton className="h-[400px] rounded-xl bg-white/20" />
          </div>
        </div>
      </div>

      {/* Content Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
