import React from 'react';
import { useCycle, AppTab } from '../../context/CycleContext';
import { Plus, LogOut, CheckCircle2 } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, openLogModal, userRole, signOut, currentDate, logs } = useCycle();
  const isFemale = userRole === 'female';
  const isMale = userRole === 'male';

  const isTodayLogged = logs.some((l) => l.date === currentDate);

  // Consolidated to 3 clean intuitive tabs
  const navLinks: { id: AppTab; label: string }[] = isMale
    ? [
        { id: 'home', label: "Today" },
        { id: 'calendar', label: 'Calendar' },
        { id: 'couple', label: 'Partner' },
      ]
    : [
        { id: 'home', label: 'Today' },
        { id: 'calendar', label: 'Calendar' },
        { id: 'couple', label: 'Settings' },
      ];

  const headerBg = isMale
    ? 'bg-white/95 border-b border-slate-200'
    : 'bg-[#FFFDF9]/95 border-b border-[#F3CD97]/50';

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md transition-all ${headerBg}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mode Identity */}
        <div className="flex items-center gap-2">
          {isMale ? (
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              Partner View
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Cycle Tracker
            </span>
          )}
        </div>

        {/* Streamlined 3-Tab Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => setActiveTab(link.id)}
                className={`transition-all whitespace-nowrap py-1.5 border-b-2 text-sm ${
                  isActive
                    ? isMale
                      ? 'text-sky-700 border-sky-600 font-bold'
                      : 'text-[#BC4F4F] border-[#BC4F4F] font-bold'
                    : isMale
                    ? 'text-slate-500 border-transparent hover:text-slate-900'
                    : 'text-[#7A5B4F] border-transparent hover:text-[#261C19]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Status & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Female Only Quick Check-in CTA (Updates dynamically if already logged) */}
          {isFemale && (
            <button
              type="button"
              onClick={() => openLogModal(currentDate)}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all active:scale-[0.98] min-h-[38px] ${
                isTodayLogged
                  ? 'text-[#8E2B2B] bg-[#FCECEC] hover:bg-[#F8DADA] border border-[#BC4F4F]/30 shadow-2xs'
                  : 'text-white bg-[#BC4F4F] hover:bg-[#9E3A3A] shadow-xs'
              }`}
              title={isTodayLogged ? "Today is already logged. Click to edit." : "Record today's log"}
            >
              {isTodayLogged ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#BC4F4F]" />
                  <span>Logged Today</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Log Today</span>
                </>
              )}
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Sign Out / Exit */}
          <button
            type="button"
            onClick={() => signOut()}
            className={`p-2 rounded-xl transition-all border border-transparent ${
              isMale
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'
                : 'text-[#7A5B4F] hover:text-[#261C19] hover:bg-white hover:border-[#F3CD97]/60'
            }`}
            title="Sign out or switch account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
