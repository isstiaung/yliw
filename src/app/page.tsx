'use client';

import { useLifeData } from '@/contexts/LifeDataContext';
import SetupForm from '@/components/SetupForm';
import EventForm from '@/components/EventForm';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const { state } = useLifeData();

  if (state.isLoading) {
    return <LoadingScreen />;
  }

  // Render different components based on current phase
  switch (state.currentPhase) {
    case 'setup':
      return <SetupForm />;
    case 'events':
      return <EventForm />;
    default:
      return <SetupForm />;
  }
}
