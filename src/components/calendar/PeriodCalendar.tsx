import React, { useState } from 'react';
import { useCycle } from '../../context/CycleContext';
import {
  parseDateString,
  formatToDateString,
  formatDisplayDate,
  addDays,
  getDayStatus,
  PHASE_DETAILS,
} from '../../utils/cycleCalculations';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  TrendingUp,
  Edit2,
} from 'lucide-react';
import { InsightsComponent } from '../insights/InsightsComponent';

export const PeriodCalendar: React.FC = () => {
  const {
    cycles,
    logs,
    settings,
    currentDate,
    selectedCalendarDate,
    setSelectedCalendarDate,
    openLogModal,
    addOrUpdateCycle,
    userRole,
    cycleStatus,
  } = useCycle();

  const isMale = userRole === 'male';
  const isFemale = userRole === 'female';

  // Toggle between Monthly Grid and 6-Month Cycle Analytics
  const [activeSubView, setActiveSubView] = useState<'calendar' | 'trends'>('calendar');

  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    return parseDateString(selectedCalendarDate || currentDate);
  });

  const [isEditingCycleModalOpen, setIsEditingCycleModalOpen] = useState(false);
  const [editingCycleStartDate, setEditingCycleStartDate] = useState(currentDate);
  const [editingCycleDuration, setEditingCycleDuration] = useState(5);

  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = parseDateString(currentDate);
    setCurrentViewDate(today);
    setSelectedCalendarDate(currentDate);
  };

  // Month grid generation
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  const daysArray: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(viewYear, viewMonth, day);
    daysArray.push(formatToDateString(dateObj));
  }

  // Selected date info
  const selectedDayInfo = getDayStatus(
    selectedCalendarDate,
    currentDate,
    cycles,
    logs,
    {
      averageCycleLength: settings.averageCycleLength,
      averagePeriodLength: settings.averagePeriodLength,
      lutealPhaseLength: settings.lutealPhaseLength,
      confidenceMarginDays: cycleStatus.analytics.confidenceMarginDays,
    }
  );

  const monthLabel = currentViewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleSaveManualCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMale) return; // Read-only safety guard

    const endDate = addDays(editingCycleStartDate, editingCycleDuration - 1);
    addOrUpdateCycle({
      id: `cycle-manual-${editingCycleStartDate}-${Date.now()}`,
      startDate: editingCycleStartDate,
      endDate,
      cycleLengthDays: settings.averageCycleLength,
      periodDurationDays: editingCycleDuration,
      isConfirmed: true,
      notes: 'Logged via calendar',
    });
    setIsEditingCycleModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-smooth-appear font-sans">
      {/* Top Segmented Hub Switch: Calendar vs. 6-Month Trends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#F3CD97]/50 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF6F0] rounded-xl self-start sm:self-auto border border-[#F3CD97]/40">
          <button
            type="button"
            onClick={() => setActiveSubView('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubView === 'calendar'
                ? isMale
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-[#BC4F4F] text-white shadow-2xs'
                : 'text-[#7A5B4F] hover:text-[#261C19]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>This Month</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('trends')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubView === 'trends'
                ? isMale
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-[#BC4F4F] text-white shadow-2xs'
                : 'text-[#7A5B4F] hover:text-[#261C19]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>6-Month Insight</span>
          </button>
        </div>
      </div>

      {/* Render Trends subview if selected */}
      {activeSubView === 'trends' ? (
        <InsightsComponent />
      ) : (
        <>
          {/* Calendar Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F3CD97]/50 shadow-2xs">
            {/* Month Header & Controls */}
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#F7EFE8]">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#261C19]">
                  {monthLabel}
                </h2>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md transition-colors ${
                    isMale
                      ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                      : 'text-[#BC4F4F] bg-[#FCECEC] hover:bg-[#F8DADA]'
                  }`}
                >
                  Jump To Today
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#F3CD97]/60 text-[#7A5B4F] hover:bg-[#FEF2A0]/40 flex items-center justify-center transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#F3CD97]/60 text-[#7A5B4F] hover:bg-[#FEF2A0]/40 flex items-center justify-center transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Female Only: Log Period button */}
                {isFemale && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCycleStartDate(selectedCalendarDate);
                      setIsEditingCycleModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#BC4F4F] hover:bg-[#9E3A3A] text-white transition-all flex items-center gap-1 shadow-2xs active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Log Period</span>
                    <span className="sm:hidden">Log</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clean, Non-crowded Mobile-Responsive Calendar Grid */}
            <div className="mt-3">
              {/* Weekday Labels (1-letter on mobile for perfect spacing) */}
              <div className="grid grid-cols-7 mb-1.5 text-center text-[11px] font-bold text-[#7A5B4F]">
                <span className="sm:hidden">S</span>
                <span className="hidden sm:inline">Sun</span>
                <span className="sm:hidden">M</span>
                <span className="hidden sm:inline">Mon</span>
                <span className="sm:hidden">T</span>
                <span className="hidden sm:inline">Tue</span>
                <span className="sm:hidden">W</span>
                <span className="hidden sm:inline">Wed</span>
                <span className="sm:hidden">T</span>
                <span className="hidden sm:inline">Thu</span>
                <span className="sm:hidden">F</span>
                <span className="hidden sm:inline">Fri</span>
                <span className="sm:hidden">S</span>
                <span className="hidden sm:inline">Sat</span>
              </div>

              {/* Days Grid: Spacious, uncluttered, touchable targets */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {/* Blank leading slots */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
                ))}

                {daysArray.map((dateStr) => {
                  const status = getDayStatus(dateStr, currentDate, cycles, logs, {
                    averageCycleLength: settings.averageCycleLength,
                    averagePeriodLength: settings.averagePeriodLength,
                    lutealPhaseLength: settings.lutealPhaseLength,
                    confidenceMarginDays: cycleStatus.analytics.confidenceMarginDays,
                  });

                  const isSelected = selectedCalendarDate === dateStr;

                  // Rich palette styles (#FEF2A0, #F3CD97, #E98B50, #BC4F4F)
                  let cellBg = 'bg-[#FFFDF9] text-[#261C19] hover:bg-[#FAF6F0] border border-transparent';

                  if (status.isRecordedPeriod) {
                    cellBg = 'bg-[#BC4F4F] text-white font-bold shadow-2xs';
                  } else if (status.isPredictedPeriod) {
                    cellBg = 'bg-[#FCECEC] border border-dashed border-[#BC4F4F] text-[#8E2B2B] font-semibold';
                  } else if (status.isEstimatedWindow) {
                    cellBg = 'bg-[#FFF8F0] border border-dotted border-[#E98B50] text-[#9A3412] font-medium';
                  } else if (status.isOvulationDay) {
                    cellBg = 'bg-[#FFFBD8] border border-[#D97706] text-[#92400E] font-semibold';
                  } else if (status.isFertileWindow) {
                    cellBg = 'bg-[#FEF4EC] text-[#C25B23] border border-[#F3CD97]';
                  }

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedCalendarDate(dateStr)}
                      className={`aspect-square w-full rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${cellBg} ${
                        isSelected
                          ? isMale
                            ? 'ring-2 ring-offset-1 ring-slate-900 z-10'
                            : 'ring-2 ring-offset-1 ring-[#BC4F4F] z-10'
                          : ''
                      } ${status.isToday && !status.isRecordedPeriod ? 'ring-1 ring-[#E98B50] font-extrabold' : ''}`}
                    >
                      {/* Clean number centered */}
                      <span className="text-xs sm:text-sm tabular-nums leading-none">
                        {status.dayNumber}
                      </span>

                      {/* Clean bottom status indicator dots */}
                      <div className="flex items-center gap-0.5 mt-1 h-1.5">
                        {status.isRecordedPeriod && (
                          <span className="w-1 h-1 rounded-full bg-white opacity-90" title="Confirmed Period" />
                        )}
                        {status.isPredictedPeriod && (
                          <span className="w-1 h-1 rounded-full bg-[#BC4F4F]" title="Predicted Period" />
                        )}
                        {status.isEstimatedWindow && !status.isPredictedPeriod && (
                          <span className="w-1 h-1 rounded-full bg-[#E98B50]" title="Estimated Start Window" />
                        )}
                        {status.isOvulationDay && (
                          <span className="text-[9px] text-[#D97706] leading-none">★</span>
                        )}
                        {!status.isRecordedPeriod && status.hasLog && (
                          <span className="w-1 h-1 rounded-full bg-[#E98B50]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clean, Calm Legend Strip */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-3.5 mt-3 border-t border-[#F7EFE8] text-[11px] text-[#7A5B4F]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BC4F4F]" />
                <span className="font-medium">Confirmed Period</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FCECEC] border border-dashed border-[#BC4F4F]" />
                <span className="font-medium">Predicted Flow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFF8F0] border border-dotted border-[#E98B50]" />
                <span className="font-medium">Estimated Window (±{cycleStatus.analytics.confidenceMarginDays}d)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFFBD8] border border-[#D97706]" />
                <span className="font-medium">Ovulation Peak (★)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FEF4EC] border border-[#F3CD97]" />
                <span className="font-medium">Peak Energy Window</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E98B50]" />
                <span className="font-medium">Logged Check-in</span>
              </div>
            </div>
          </div>

          {/* Selected Day Inspector Panel */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F3CD97]/50 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F7EFE8]">
              <div>
                <div className="text-[11px] text-[#7A5B4F] font-bold uppercase tracking-wider">
                  Selected Date Summary
                </div>
                <h3 className="text-lg font-bold text-[#261C19] flex items-center gap-2 mt-0.5">
                  <span>{formatDisplayDate(selectedCalendarDate, { showYear: true })}</span>
                  {selectedCalendarDate === currentDate && (
                    <span className="text-[10px] font-bold text-[#BC4F4F] bg-[#FCECEC] px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h3>
              </div>

              {/* Female Only Check-in CTA (Hidden for Male) */}
              {isFemale && (
                <button
                  type="button"
                  onClick={() => openLogModal(selectedCalendarDate)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#BC4F4F] hover:bg-[#9E3A3A] transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-2xs active:scale-[0.98]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{selectedDayInfo.hasLog ? 'Edit Check-in' : '+ Check-in for this Day'}</span>
                </button>
              )}
            </div>

            {/* Selected Day 3-Col Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Phase Status */}
              <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40 space-y-1">
                <div className="text-[10px] font-bold text-[#BC4F4F] uppercase tracking-wider">
                  Cycle Phase & Status
                </div>
                <div className="font-bold text-[#261C19] text-sm">
                  {selectedDayInfo.isRecordedPeriod
                    ? 'Confirmed Period (Logged Flow)'
                    : selectedDayInfo.isPredictedPeriod
                    ? 'Predicted Period (Expected Flow)'
                    : selectedDayInfo.isEstimatedWindow
                    ? `Estimated Start Window (±${cycleStatus.analytics.confidenceMarginDays}d)`
                    : selectedDayInfo.isOvulationDay
                    ? 'Ovulation Day'
                    : selectedDayInfo.isFertileWindow
                    ? 'Peak Energy Window'
                    : 'Regular Cycle Day'}
                </div>
                <div className="text-[11px] text-[#7A5B4F] leading-relaxed">
                  {selectedDayInfo.isRecordedPeriod
                    ? 'Confirmed bleeding day recorded in your period logs.'
                    : selectedDayInfo.isPredictedPeriod
                    ? 'On-device prediction based on your typical cycle length.'
                    : selectedDayInfo.isEstimatedWindow
                    ? `Variability window where period is expected to begin.`
                    : PHASE_DETAILS[selectedDayInfo.phase]?.trackerFeeling || 'Normal cycle rhythm'}
                </div>
              </div>

              {/* Logged Feelings */}
              <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40 space-y-1">
                <div className="text-[10px] font-bold text-[#E98B50] uppercase tracking-wider">
                  Symptoms & Flow
                </div>
                {selectedDayInfo.log ? (
                  <div className="space-y-1 text-[#261C19]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A5B4F]">Flow:</span>
                      <span className="font-bold capitalize text-[#BC4F4F]">
                        {selectedDayInfo.log.flow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A5B4F]">Energy:</span>
                      <span className="font-bold capitalize text-[#E98B50]">
                        {selectedDayInfo.log.energyLabel || `${selectedDayInfo.log.energyLevel}/10`}
                      </span>
                    </div>
                    {selectedDayInfo.log.moods.length > 0 && (
                      <div className="truncate">
                        <span className="text-[#7A5B4F]">Moods: </span>
                        <span className="font-medium">{selectedDayInfo.log.moods.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#7A5B4F] italic pt-1">
                    No check-in recorded for this day yet.
                  </div>
                )}
              </div>

              {/* Note / Partner Guidance */}
              <div className="p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40 space-y-1">
                <div className="text-[10px] font-bold text-[#BC4F4F] uppercase tracking-wider">
                  {selectedDayInfo.log?.customNote ? 'Personal Note' : 'Companion Care'}
                </div>
                {selectedDayInfo.log?.customNote ? (
                  <div className="text-[11px] text-[#261C19] bg-white p-2.5 rounded-lg border border-[#F3CD97]/50 italic">
                    "{selectedDayInfo.log.customNote}"
                  </div>
                ) : (
                  <div className="text-[11px] text-[#7A5B4F] leading-relaxed">
                    {PHASE_DETAILS[selectedDayInfo.phase]?.partnerSupportTip || 'Keep comfortable and restful.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Period Modal (Female Only) */}
          {isEditingCycleModalOpen && isFemale && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-sans">
              <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl border border-[#F3CD97]/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE8]">
                  <h3 className="text-sm font-bold text-[#261C19]">Log Period Start Date</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingCycleModalOpen(false)}
                    className="text-[#7A5B4F] hover:text-[#261C19] text-xs font-semibold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveManualCycle} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#7A5B4F] mb-1">
                      Period Start Date
                    </label>
                    <input
                      type="date"
                      value={editingCycleStartDate}
                      onChange={(e) => setEditingCycleStartDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#FFFDF9] border border-[#F3CD97]/60 rounded-xl text-[#261C19] focus:outline-none focus:ring-2 focus:ring-[#BC4F4F]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#7A5B4F] mb-1">
                      Bleeding Days (Duration)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={editingCycleDuration}
                      onChange={(e) => setEditingCycleDuration(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-[#FFFDF9] border border-[#F3CD97]/60 rounded-xl text-[#261C19] focus:outline-none focus:ring-2 focus:ring-[#BC4F4F]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCycleModalOpen(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#7A5B4F] hover:text-[#261C19]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#BC4F4F] hover:bg-[#9E3A3A] shadow-xs active:scale-[0.98]"
                    >
                      Save Period
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
