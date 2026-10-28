/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { Bell, X } from 'lucide-react';
import { setupForegroundNotificationListener } from './services/notificationService';

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
  const [foregroundAlert, setForegroundAlert] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    setupForegroundNotificationListener((payload) => {
      setForegroundAlert({ title: payload.title, body: payload.body });
      setTimeout(() => setForegroundAlert(null), 7000);
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

      {/* Foreground Push Notification In-App Toast */}
      {foregroundAlert && (
        <div className="fixed top-18 right-4 z-50 max-w-sm w-full bg-white rounded-2xl p-3.5 shadow-xl border border-emerald-300 text-slate-800 animate-fade-in flex items-start justify-between gap-3 font-sans">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">{foregroundAlert.title}</div>
              <div className="text-[11px] text-slate-600 leading-snug">{foregroundAlert.body}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForegroundAlert(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
