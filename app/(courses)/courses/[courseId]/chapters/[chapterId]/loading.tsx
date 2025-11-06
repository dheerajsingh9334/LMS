import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
      {/* Back button skeleton */}
      <Skeleton className="h-10 w-40" />
      
      {/* Video player skeleton */}
      <Skeleton className="aspect-video w-full rounded-lg" />
      
      {/* Chapter info skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      {/* Attachments skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
