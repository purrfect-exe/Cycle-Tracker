/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CycleProvider, useCycle } from './context/CycleContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { PeriodCalendar } from './components/calendar/PeriodCalendar';
import { CoupleModeScreen } from './components/couple/CoupleModeScreen';
import { DailySymptomLogCard } from './components/tracking/DailySymptomLogCard';
import { DailyTrackingModal } from './components/tracking/DailyTrackingModal';
import { InsightsComponent } from './components/insights/InsightsComponent';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    isOnboarding,
    activeTab,
    loginAsFemaleWithGoogle,
    loginAsMaleWithCode,
    startSampleDemo,
    startPreviewAsRole,
    finishOnboarding,
    currentDate,
    selectedCalendarDate,
    userRole,
  } = useCycle();

  const isMale = userRole === 'male';

  // If not authenticated, render dual-option Login Screen with 1-tap testing previews
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginFemale={loginAsFemaleWithGoogle}
        onLoginMaleWithCode={loginAsMaleWithCode}
        onEnterSampleDemo={startSampleDemo}
        onPreviewRole={startPreviewAsRole}
      />
    );
  }

  // If female user just created account, show Onboarding Walkthrough
  if (isOnboarding) {
    return <OnboardingFlow onComplete={finishOnboarding} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isMale
          ? 'bg-[#F8FAFC] selection:bg-indigo-500/20 selection:text-indigo-950'
          : 'bg-[#F7FAF8] selection:bg-[#D8F3DC] selection:text-[#1B3B2B]'
      }`}
    >
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'calendar' && <PeriodCalendar />}
        {activeTab === 'tracking' && (
          <div className="max-w-2xl mx-auto">
            <DailySymptomLogCard initialDate={selectedCalendarDate || currentDate} />
          </div>
        )}
        {activeTab === 'insights' && <InsightsComponent />}
        {activeTab === 'couple' && <CoupleModeScreen />}
      </main>

      <DailyTrackingModal />
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <CycleProvider>
      <AppContent />
    </CycleProvider>
  );
}
