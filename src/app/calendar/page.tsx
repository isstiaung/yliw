"use client";

import { useLifeData } from "@/contexts/LifeDataContext";
import LifeGrid from "@/components/LifeGrid";
import LoadingScreen from "@/components/LoadingScreen";

export default function Calendar() {
  const { state } = useLifeData();

  if (state.isLoading) {
    return <LoadingScreen />;
  }
  return <LifeGrid />;
}
