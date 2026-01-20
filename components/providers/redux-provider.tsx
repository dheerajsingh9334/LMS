"use client";

import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { store } from "@/lib/store";

interface ReduxProviderProps {
  children: ReactNode;
}

export const ReduxProvider = ({ children }: ReduxProviderProps) => {
  return <Provider store={store}>{children}</Provider>;
};
