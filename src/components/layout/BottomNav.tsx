import React from 'react';
import { useCycle, AppTab } from '../../context/CycleContext';
import { Home, Calendar, Users } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, userRole } = useCycle();
  const isMale = userRole === 'male';

  const items: {
    id: AppTab;
    label: string;
    icon: React.ReactNode;
  }[] = isMale
    ? [
        {
          id: 'home',
          label: 'Support',
          icon: <Home className="w-5 h-5" />,
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: <Calendar className="w-5 h-5" />,
        },
        {
          id: 'couple',
          label: 'Partner',
          icon: <Users className="w-5 h-5" />,
        },
      ]
    : [
        {
          id: 'home',
          label: 'Today',
          icon: <Home className="w-5 h-5" />,
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: <Calendar className="w-5 h-5" />,
        },
        {
          id: 'couple',
          label: 'Partner',
          icon: <Users className="w-5 h-5" />,
        },
      ];

  const barBg = isMale
    ? 'bg-white/95 border-t border-slate-200'
    : 'bg-[#FFFDF9]/95 border-t border-[#F3CD97]/50';

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg shadow-lg shadow-black/5 ${barBg}`}
    >
      <div className="grid grid-cols-3 items-center h-16 max-w-md mx-auto px-4">
        {items.map((item) => {
          const isActive = activeTab === item.id;

          const activeColor = isMale ? 'text-sky-700 font-bold' : 'text-[#BC4F4F] font-bold';
          const inactiveColor = isMale ? 'text-slate-500 hover:text-slate-900' : 'text-[#7A5B4F] hover:text-[#261C19]';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all relative ${
                isActive ? activeColor : inactiveColor
              }`}
            >
              <div className="relative">
                {item.icon}
              </div>
              <span className="text-[11px] font-bold tracking-tight mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
