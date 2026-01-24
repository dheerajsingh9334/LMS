import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import dynamic from "next/dynamic";

// Dynamic import with no SSR to completely avoid client module issues
const HeroSectionClient = dynamic(
  () => import("@/components/HeroSectionClient"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="animate-pulse">
          <div className="h-12 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
);

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <HeroSectionClient userId={user?.id} />
    </main>
  );
}
