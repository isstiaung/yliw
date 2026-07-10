"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLifeData } from "@/contexts/LifeDataContext";
import LifeGrid from "@/components/LifeGrid";
import LoadingScreen from "@/components/LoadingScreen";

export default function Calendar() {
  const { state } = useLifeData();
  const router = useRouter();

  // No saved data (e.g. direct navigation) — send the user to setup
  // instead of rendering a blank page.
  useEffect(() => {
    if (!state.isLoading && !state.userData) {
      router.replace("/");
    }
  }, [state.isLoading, state.userData, router]);

  if (state.isLoading || !state.userData) {
    return <LoadingScreen />;
  }
  return <LifeGrid />;
}
