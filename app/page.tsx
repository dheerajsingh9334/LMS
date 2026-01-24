import HeroSection from "@/components/HeroSection";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="h-screen w-screen overflow-hidden">
      <div>
        <HeroSection userId={user?.id} />
      </div>
    </main>
  );
}
