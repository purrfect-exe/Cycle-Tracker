import React from 'react';
import { useCycle } from '../../context/CycleContext';
import { DailySymptomLogCard } from './DailySymptomLogCard';
import { X } from 'lucide-react';

export const DailyTrackingModal: React.FC = () => {
  const { isLogModalOpen, closeLogModal, logModalDate, userRole } = useCycle();

  if (!isLogModalOpen || userRole === 'male') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#FFFDF9] w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden border border-[#F3CD97]/40">
        {/* Top bar with close */}
        <div className="px-5 py-3 bg-white/95 border-b border-[#F7E7CE] flex items-center justify-between">
          <span className="text-xs font-bold text-[#8E2B2B] uppercase tracking-wider">
            Daily Symptom Logging
          </span>
          <button
            type="button"
            onClick={closeLogModal}
            className="w-7 h-7 rounded-lg bg-[#F8FAF9] border border-[#DFECE5] text-[#526A5E] hover:bg-[#EAF2ED] flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable symptom card */}
        <div className="overflow-y-auto p-4 sm:p-5">
          <DailySymptomLogCard initialDate={logModalDate} onSaved={closeLogModal} />
        </div>
      </div>
    </div>
  );
};
