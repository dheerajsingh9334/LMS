"use client";

import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/lib/store";
import { ConfettiProvider } from "./confetti-provider";
import { ToastProvider } from "./toaster-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        <ConfettiProvider />
        <ToastProvider />
        {children}
      </ReduxProvider>
    </SessionProvider>
  );
}
