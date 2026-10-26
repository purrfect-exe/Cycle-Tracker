import React, { useState } from 'react';
import { useCycle } from '../../context/CycleContext';
import { DailyLog } from '../../types/cycle';
import {
  formatDisplayDate,
  addDays,
  getDayStatus,
} from '../../utils/cycleCalculations';
import {
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { DailySymptomLogCard } from '../tracking/DailySymptomLogCard';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MaleDashboard } from './MaleDashboard';

export const HomeDashboard: React.FC = () => {
  const {
    settings,
    currentDate,
    cycleStatus,
    setActiveTab,
    setSelectedCalendarDate,
    cycles,
    logs,
    userRole,
    unlinkPartnerFromDb,
  } = useCycle();

  // If male, render dedicated simpler companion dashboard
  if (userRole === 'male') {
    return <MaleDashboard />;
  }

  const [copiedCode, setCopiedCode] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleCopySecretCode = () => {
    navigator.clipboard.writeText(settings.secretCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmUnlink = async () => {
    setUnlinking(true);
    await unlinkPartnerFromDb();
    setUnlinking(false);
    setShowUnlinkModal(false);
  };

  // Upcoming 10-day forecast preview strip
  const forecastDays = Array.from({ length: 10 }).map((_, i) => {
    const dStr = addDays(currentDate, i);
    return getDayStatus(dStr, currentDate, cycles, logs, {
      averageCycleLength: settings.averageCycleLength,
      averagePeriodLength: settings.averagePeriodLength,
      lutealPhaseLength: settings.lutealPhaseLength,
      confidenceMarginDays: cycleStatus.analytics.confidenceMarginDays,
    });
  });

  const todayLog = logs.find((l: DailyLog) => l.date === currentDate);
  const analytics = cycleStatus.analytics;

  return (
    <div className="space-y-5 animate-smooth-appear font-sans">
      {/* Main Cycle Status Hero Card with Soothing Breathing Ring */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F3CD97]/50 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Progress Ring with Gentle Soothing Animation */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-[#F7EFE8]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke={cycleStatus.phaseInfo.accentColor}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - cycleStatus.cycleProgressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>

              {/* Gentle breathing halo */}
              <div className="absolute inset-2 rounded-full bg-[#FFFDF9] border border-[#F3CD97]/30 flex flex-col items-center justify-center p-3 shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#BC4F4F]">
                  Cycle Day
                </span>
                <span className="text-4xl font-extrabold text-[#261C19] tabular-nums my-0.5">
                  {cycles.length === 0 && !settings.lastPeriodStartDate ? '—' : cycleStatus.currentCycleDay}
                </span>
                <span className="text-xs text-[#7A5B4F] font-medium">
                  {cycles.length === 0 && !settings.lastPeriodStartDate ? 'Awaiting Log' : `of ${cycleStatus.totalCycleLength} days`}
                </span>
              </div>
            </div>
          </div>

          {/* Key Forecast & Smart Prediction Information */}
          <div className="md:col-span-8 space-y-3.5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-bold text-[#E98B50] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E98B50]" />
                  <span>Next Period Prediction</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFFBD8] text-[#92400E] border border-[#F3CD97]">
                    {analytics.regularityStatus}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FCECEC] text-[#BC4F4F] border border-[#F3CD97]/50">
                    {analytics.predictionConfidencePercent}% Confidence
                  </span>
                </div>
              </div>

              <div className="text-2xl font-bold text-[#261C19] mt-1">
                {cycles.length === 0 && !settings.lastPeriodStartDate
                  ? 'No period logged yet'
                  : cycleStatus.daysUntilNextPeriod === 0
                  ? 'Expected Today'
                  : `${formatDisplayDate(cycleStatus.nextPeriodStartDate)} (${cycleStatus.daysUntilNextPeriod} days away)`}
              </div>

              {/* Estimated Variability Date Range Window */}
              <div className="text-xs text-[#7A5B4F] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {analytics.sampleSize === 0 && !settings.lastPeriodStartDate ? (
                  <span className="text-[11px] text-[#7A5B4F]">
                    Predictions will calibrate automatically once you log your period dates.
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-[#261C19]">
                      Estimated Start Window:
                    </span>
                    <span className="font-semibold text-[#BC4F4F] bg-[#FCECEC] px-2 py-0.5 rounded-md border border-[#BC4F4F]/30">
                      {formatDisplayDate(analytics.estimatedWindowStart, { short: true })} – {formatDisplayDate(analytics.estimatedWindowEnd, { short: true })}
                    </span>
                    <span className="text-[11px] text-[#7A5B4F]">
                      (Based on {analytics.sampleSize} tracked cycles)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Clear Status Metrics: Mean, Median, Bleeding, Range */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#F3CD97]/40">
                <div className="text-[10px] text-[#7A5B4F] uppercase font-semibold">Average Cycle</div>
                <div className="text-sm font-bold text-[#261C19] tabular-nums mt-0.5">
                  {analytics.meanCycleLength} <span className="text-[10px] font-normal text-[#7A5B4F]">days</span>
                </div>
              </div>
              <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#F3CD97]/40">
                <div className="text-[10px] text-[#7A5B4F] uppercase font-semibold">Bleeding Days</div>
                <div className="text-sm font-bold text-[#261C19] tabular-nums mt-0.5">
                  {analytics.averagePeriodLength} <span className="text-[10px] font-normal text-[#7A5B4F]">days</span>
                </div>
              </div>
              <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#F3CD97]/40">
                <div className="text-[10px] text-[#7A5B4F] uppercase font-semibold">Historical Range</div>
                <div className="text-sm font-bold text-[#261C19] tabular-nums mt-0.5">
                  {analytics.minCycleLength}–{analytics.maxCycleLength} <span className="text-[10px] font-normal text-[#7A5B4F]">days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automatic On-Device Cycle Summaries Card */}
      {analytics.automaticSummaries.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F3CD97]/50 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE8]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-[#261C19] uppercase tracking-wider">
                Cycle Summary
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {analytics.automaticSummaries.slice(0, 4).map((summary: string, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/30 text-xs text-[#261C19]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Symptom & Feeling Log (Right on Home screen) */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-[#BC4F4F] uppercase tracking-wider">
            Symptoms
          </span>
          {todayLog && (
            <span className="text-xs font-semibold text-emerald-800 bg-[#E8F5EE] px-2.5 py-0.5 rounded-md border border-[#C5E5D4]">
              ✓ Logged for Today
            </span>
          )}
        </div>
        <DailySymptomLogCard initialDate={currentDate} />
      </div>

      {/* 10-Day Cycle Forecast Strip */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F3CD97]/50 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F7EFE8]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#BC4F4F]" />
            <h3 className="text-xs font-bold text-[#261C19] uppercase tracking-wider">
              Upcoming 10 Days Forecast
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="text-xs font-bold text-[#BC4F4F] hover:underline flex items-center gap-1"
          >
            <span>Full Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex sm:grid sm:grid-cols-10 gap-2 overflow-x-auto pb-1 pt-2.5 scrollbar-none">
          {forecastDays.map((fDay) => {
            let bgClass = 'bg-[#FFFDF9] border-[#F3CD97]/50 text-[#261C19]';
            let label = fDay.phase.substring(0, 3);

            if (fDay.isRecordedPeriod) {
              bgClass = 'bg-[#BC4F4F] border-[#BC4F4F] text-white font-semibold';
              label = 'Period';
            } else if (fDay.isPredictedPeriod) {
              bgClass = 'bg-[#FCECEC] border border-dashed border-[#BC4F4F] text-[#8E2B2B] font-medium';
              label = 'Est.';
            } else if (fDay.isOvulationDay) {
              bgClass = 'bg-[#FFFBD8] border border-[#D97706] text-[#92400E] font-semibold';
              label = 'Ovul';
            } else if (fDay.isFertileWindow) {
              bgClass = 'bg-[#FEF4EC] border-[#F3CD97] text-[#C25B23] font-medium';
              label = 'Peak';
            } else if (cycles.length === 0 && !settings.lastPeriodStartDate) {
              label = fDay.isToday ? 'Today' : '—';
            }

            return (
              <button
                key={fDay.date}
                type="button"
                onClick={() => {
                  setSelectedCalendarDate(fDay.date);
                  setActiveTab('calendar');
                }}
                className={`flex flex-col items-center justify-between p-2 rounded-xl border transition-all min-h-[58px] min-w-[62px] sm:min-w-0 sm:flex-1 shrink-0 ${bgClass} ${
                  fDay.isToday ? 'ring-2 ring-offset-1 ring-[#BC4F4F]' : ''
                }`}
              >
                <span className="text-[10px] uppercase font-semibold opacity-75">
                  {fDay.dayOfWeek}
                </span>
                <span className="text-sm font-bold tabular-nums my-0.5">
                  {fDay.dayNumber}
                </span>
                <span className="text-[9px] uppercase tracking-tighter truncate w-full text-center">
                  {fDay.isToday ? 'Today' : label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog for Unlinking */}
      <ConfirmDialog
        isOpen={showUnlinkModal}
        title="Unlink Partner?"
        message={`Are you sure you want to disconnect ${settings.partnerName || 'your partner'}? They will no longer see your cycle updates until paired again with a new code.`}
        confirmLabel="Unlink Partner"
        cancelLabel="Keep Connected"
        isDestructive={true}
        onConfirm={handleConfirmUnlink}
        onCancel={() => setShowUnlinkModal(false)}
      />
    </div>
  );
};
