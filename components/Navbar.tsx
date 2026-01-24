"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Logo } from "@/components/logo";

interface NavBarProps {
  userId?: string;
}

function NavBar({ userId }: NavBarProps) {
  const [menu, setMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="landing-section">
        <div className="md:top-0 md:shadow-none mx-auto max-w-[1200px]">
          <div className="animate-in fade-in zoom-in bg-white py-4">
            <div className="flex justify-between items-center">
              <Logo />
              <div className="flex gap-[20px] xl:gap-[50px] text-[16px] items-center select-none"></div>
              <div className="flex items-center gap-1 select-none">
                <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-10 w-20 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const toggleMenu = () => {
    setMenu(!menu);
  };

  return (
    <section className="landing-section">
      <div className=" md:top-0   md:shadow-none  mx-auto max-w-[1200px]  ">
        {/* DESKTOP */}
        <div className=" animate-in fade-in zoom-in bg-white py-4">
          <div className="flex justify-between items-center">
            <Logo />
            <div className="flex gap-[20px] xl:gap-[50px] text-[16px] items-center select-none"></div>
            <div className="flex items-center gap-1 select-none">
              {!userId && (
                <Link href={"/auth/login"}>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-md hover:bg-custom-primary/15"
                  >
                    Sign In
                  </Button>
                </Link>
              )}

              <Link href={"/auth/register"}>
                <Button variant="outline" size="lg" className="text-md">
                  {userId ? "Sign Out" : "Sign Up"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NavBar;
