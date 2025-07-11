'use client';

import { useLifeData } from '@/contexts/LifeDataContext';
import SetupForm from '@/components/SetupForm';
import EventForm from '@/components/EventForm';
import LifeGrid from '@/components/LifeGrid';

export default function Home() {
  const { state } = useLifeData();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your life calendar...</p>
        </div>
      </div>
    );
  }

  // Render different components based on current phase
  switch (state.currentPhase) {
    case 'setup':
      return <SetupForm />;
    case 'events':
      return <EventForm />;
    case 'calendar':
      return <LifeGrid />;
    default:
      return <SetupForm />;
  }
}
