import React, { useState } from 'react';
import { useCycle } from '../../context/CycleContext';
import { DailyLog, CyclePhase } from '../../types/cycle';
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
  Smile,
  Zap,
  Droplet,
  Flame,
  Activity,
  AlertCircle,
  BarChart2,
  Unlink,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

// Soft, soothing phase colors and plain-English meanings for male companion
interface PhaseTranslation {
  simpleName: string;
  plainMeaning: string;
  ringColor: string;
  glowColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  vitalityPhase: string;
  vitalityScore: 1 | 2 | 3 | 4;
  typicalEnergy: number;
  energyDescription: string;
  bodyFeeling: string;
}

const SOFT_PHASE_CONFIG: Record<CyclePhase, PhaseTranslation> = {
  menstrual: {
    simpleName: 'Period',
    plainMeaning: 'Body resting & recovering',
    ringColor: '#FB7185', // Soft Rose
    glowColor: 'rgba(251, 113, 133, 0.2)',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-400/30',
    badgeText: 'text-rose-300',
    vitalityPhase: 'Resting',
    vitalityScore: 1,
    typicalEnergy: 3,
    energyDescription: 'Low Energy (Tired / Needs rest)',
    bodyFeeling: 'May experience cramps, tiredness, or back ache',
  },
  follicular: {
    simpleName: 'Post-Period',
    plainMeaning: 'Period ended. Natural energy and mood rising',
    ringColor: '#38BDF8', // Soft Sky
    glowColor: 'rgba(56, 189, 248, 0.2)',
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-400/30',
    badgeText: 'text-sky-300',
    vitalityPhase: 'Rising',
    vitalityScore: 3,
    typicalEnergy: 7,
    energyDescription: 'Good Energy (Active & upbeat)',
    bodyFeeling: 'Feeling fresh, clear-headed, and motivated',
  },
  ovulatory: {
    simpleName: 'Ovulation',
    plainMeaning: 'Mid-cycle natural peak in energy and mood',
    ringColor: '#FBBF24', // Soft Amber
    glowColor: 'rgba(251, 191, 36, 0.2)',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-400/30',
    badgeText: 'text-amber-300',
    vitalityPhase: 'Peak Vitality',
    vitalityScore: 4,
    typicalEnergy: 9,
    energyDescription: 'Peak Energy (Feeling great & radiant)',
    bodyFeeling: 'High vitality, affectionate, and outgoing',
  },
  luteal: {
    simpleName: 'Pre-Period',
    plainMeaning: 'Days before next period. Body winding down',
    ringColor: '#818CF8', // Soft Indigo
    glowColor: 'rgba(129, 140, 248, 0.2)',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-400/30',
    badgeText: 'text-indigo-300',
    vitalityPhase: 'Winding Down',
    vitalityScore: 2,
    typicalEnergy: 5,
    energyDescription: 'Lower Energy (Body is slowing down)',
    bodyFeeling: 'Possible bloating, cravings, or sensitive emotions',
  },
};

export const MaleDashboard: React.FC = () => {
  const {
    settings,
    currentDate,
    cycleStatus,
    setActiveTab,
    setSelectedCalendarDate,
    cycles,
    logs,
    unlinkPartnerFromDb,
  } = useCycle();

  const [inspectedDate, setInspectedDate] = useState<string>(currentDate);
  const [showUnlinkModal, setShowUnlinkModal] = useState<boolean>(false);
  const [unlinking, setUnlinking] = useState<boolean>(false);

  // Today's log submitted by female partner
  const todayLog = logs.find((l: DailyLog) => l.date === currentDate);
  const analytics = cycleStatus.analytics;
  const phaseInfo = SOFT_PHASE_CONFIG[cycleStatus.phase] || SOFT_PHASE_CONFIG.follicular;

  // Upcoming 10 days forecast strip
  const forecastDays = Array.from({ length: 10 }).map((_, i) => {
    const dStr = addDays(currentDate, i);
    return getDayStatus(dStr, currentDate, cycles, logs, {
      averageCycleLength: settings.averageCycleLength,
      averagePeriodLength: settings.averagePeriodLength,
      lutealPhaseLength: settings.lutealPhaseLength,
      confidenceMarginDays: cycleStatus.analytics.confidenceMarginDays,
    });
  });

  // Recent cycles for data comparison
  const sortedCycles = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const recentCycles = sortedCycles.slice(-4);

  // Battery / Energy Calculation
  const actualEnergy = todayLog?.energyLevel ?? phaseInfo.typicalEnergy;

  // Friendly vitality status text (no medical/pregnancy words)
  const vitalityStatusText =
    cycleStatus.phase === 'ovulatory'
      ? 'Peak Energy & Vibe'
      : cycleStatus.phase === 'follicular'
      ? 'Rising Vitality'
      : cycleStatus.phase === 'luteal'
      ? 'Winding Down'
      : 'Rest & Recovery';

  const handleConfirmUnlink = async () => {
    setUnlinking(true);
    await unlinkPartnerFromDb();
    setUnlinking(false);
    setShowUnlinkModal(false);
  };

  return (
    <div className="space-y-5 font-sans text-slate-800 animate-smooth-appear max-w-5xl mx-auto">
      {/* EXECUTIVE DATA HERO: Softer Slate Palette with Gentle Lighting */}
      <div className="bg-[#1E293B] text-slate-100 rounded-3xl p-5 sm:p-7 border border-slate-700/60 shadow-sm relative overflow-hidden">
        {/* Soft background glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: phaseInfo.ringColor }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Radial Dial: Cycle Day */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r="54"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="65"
                  cy="65"
                  r="54"
                  stroke={phaseInfo.ringColor}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - cycleStatus.cycleProgressPercent / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 4px ${phaseInfo.glowColor})`,
                  }}
                />
              </svg>

              {/* Dial Center Info */}
              <div className="absolute inset-3 rounded-full bg-slate-900/90 border border-slate-700/60 flex flex-col items-center justify-center p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CYCLE DAY
                </span>
                <span className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight my-0.5">
                  {cycles.length === 0 && !settings.lastPeriodStartDate ? '—' : cycleStatus.currentCycleDay}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {cycles.length === 0 && !settings.lastPeriodStartDate ? 'Awaiting Log' : `of ${cycleStatus.totalCycleLength} days`}
                </span>
                <div className="w-12 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cycles.length === 0 && !settings.lastPeriodStartDate ? 0 : cycleStatus.cycleProgressPercent}%`,
                      backgroundColor: phaseInfo.ringColor,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Simple Phase Badge */}
            <div className="mt-3.5 flex flex-col items-center gap-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${phaseInfo.badgeBg} ${phaseInfo.badgeBorder} ${phaseInfo.badgeText}`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: phaseInfo.ringColor }}
                />
                {phaseInfo.simpleName}
              </span>
              <span className="text-[11px] text-slate-300 max-w-xs leading-snug">
                {phaseInfo.plainMeaning}
              </span>
            </div>
          </div>

          {/* 3 Glanceable Data Indicators */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Next Period Countdown */}
            <div className="bg-slate-850/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Next Period</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-400/25">
                    {analytics.predictionConfidencePercent}% Accuracy
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tabular-nums tracking-tight">
                    {cycles.length === 0 && !settings.lastPeriodStartDate ? '—' : cycleStatus.daysUntilNextPeriod}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    {cycles.length === 0 && !settings.lastPeriodStartDate
                      ? 'No period recorded yet'
                      : cycleStatus.daysUntilNextPeriod === 1
                      ? 'day left'
                      : 'days left'}
                  </span>
                </div>

                <div className="text-xs text-slate-300 mt-1">
                  {cycles.length === 0 && !settings.lastPeriodStartDate ? (
                    <span>Waiting for {settings.trackerName || 'partner'} to record first period</span>
                  ) : (
                    <>
                      Starts around{' '}
                      <span className="font-bold text-white">
                        {formatDisplayDate(cycleStatus.nextPeriodStartDate, { short: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Window: ±{analytics.confidenceMarginDays} day</span>
                <span className="text-slate-300">
                  {analytics.sampleSize} cycles analyzed
                </span>
              </div>
            </div>

            {/* 2. Vitality Window Gauge (Friendly, non-medical) */}
            <div className="bg-slate-850/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Vitality Window</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      phaseInfo.vitalityScore >= 3
                        ? 'bg-amber-500/15 text-amber-300 border-amber-400/25'
                        : 'bg-slate-700/60 text-slate-300 border-slate-600'
                    }`}
                  >
                    {phaseInfo.vitalityPhase}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-xl font-bold text-white">
                    {vitalityStatusText}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Mid-cycle peak: {formatDisplayDate(cycleStatus.estimatedOvulationDate, { short: true })}
                  </div>
                </div>
              </div>

              {/* 4-Step Soft Visual Meter */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((step) => {
                    const active = step <= phaseInfo.vitalityScore;
                    return (
                      <div
                        key={step}
                        className={`h-2 flex-1 rounded-full transition-all ${
                          active
                            ? phaseInfo.vitalityScore === 4
                              ? 'bg-amber-400'
                              : 'bg-sky-400'
                            : 'bg-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Resting</span>
                  <span>Steady</span>
                  <span>Rising</span>
                  <span>Peak</span>
                </div>
              </div>
            </div>

            {/* 3. Partner Energy Level (Visual Battery) */}
            <div className="bg-slate-850/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>{settings.trackerName}'s Energy Level</span>
                </div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="tabular-nums text-sky-300 font-black text-base">
                    {actualEnergy}
                  </span>
                  <span className="text-slate-400 font-normal">/ 10</span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    ({todayLog ? 'Checked In Today' : 'Typical for this day'})
                  </span>
                </div>
              </div>

              {/* 10-Segment Soft Visual Battery Bar */}
              <div className="my-2.5 space-y-1">
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isLit = idx < actualEnergy;
                    let segmentColor = 'bg-sky-400';
                    if (actualEnergy <= 3) segmentColor = 'bg-rose-400';
                    else if (actualEnergy <= 6) segmentColor = 'bg-amber-400';
                    else segmentColor = 'bg-emerald-400';

                    return (
                      <div
                        key={idx}
                        className={`h-2.5 rounded-sm transition-all duration-300 ${
                          isLit ? segmentColor : 'bg-slate-700/80'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>1-3 (Needs Rest)</span>
                  <span>4-6 (Moderate)</span>
                  <span>7-10 (Feeling Great)</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 flex items-center justify-between pt-1 border-t border-slate-700/60">
                <span className="text-slate-400">Current status:</span>
                <span className="font-semibold text-slate-200">{phaseInfo.bodyFeeling}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S VITALS & SYMPTOM SUMMARY (COMPACT STATUS INDICATORS & ICONS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Activity className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Today's Vitals at a Glance
              </h2>
              <div className="text-[11px] text-slate-500">
                {todayLog ? 'Live check-in recorded by your partner' : 'Estimated daily baseline'}
              </div>
            </div>
          </div>

          {todayLog ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Checked in today</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span>Day {cycleStatus.currentCycleDay} Estimate</span>
            </span>
          )}
        </div>

        {/* 4 Compact Data Status Tiles with Icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tile 1: Bleeding / Flow */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Bleeding
              </span>
              <Droplet
                className={`w-4 h-4 ${
                  todayLog && todayLog.flow !== 'none' ? 'text-rose-600' : 'text-slate-400'
                }`}
              />
            </div>
            <div className="my-2">
              <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    todayLog && todayLog.flow !== 'none'
                      ? 'bg-rose-500'
                      : cycleStatus.isPeriodActiveToday
                      ? 'bg-rose-500'
                      : 'bg-slate-300'
                  }`}
                />
                <span>
                  {todayLog
                    ? todayLog.flow !== 'none'
                      ? `${todayLog.flow} flow`
                      : 'No bleeding'
                    : cycleStatus.isPeriodActiveToday
                    ? 'Active Period'
                    : 'No bleeding'}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              {todayLog?.flow !== 'none' ? 'Period in progress' : 'Not bleeding today'}
            </div>
          </div>

          {/* Tile 2: Cramps & Discomfort */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Cramps
              </span>
              <Activity
                className={`w-4 h-4 ${
                  todayLog && todayLog.cramps !== 'none' ? 'text-amber-500' : 'text-slate-400'
                }`}
              />
            </div>
            <div className="my-2">
              <div className="text-sm font-bold text-slate-900 capitalize flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    todayLog?.cramps === 'severe'
                      ? 'bg-rose-500'
                      : todayLog?.cramps === 'moderate'
                      ? 'bg-amber-500'
                      : todayLog?.cramps === 'mild'
                      ? 'bg-yellow-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span>
                  {todayLog ? (todayLog.cramps !== 'none' ? `${todayLog.cramps} cramps` : 'No cramps') : 'None expected'}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              {todayLog?.crampLocations && todayLog.crampLocations.length > 0
                ? todayLog.crampLocations.join(', ')
                : 'Physical comfort normal'}
            </div>
          </div>

          {/* Tile 3: Mood & Feelings */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Mood
              </span>
              <Smile className="w-4 h-4 text-sky-600" />
            </div>
            <div className="my-2">
              <div className="text-sm font-bold text-slate-900 truncate">
                {todayLog && todayLog.moods && todayLog.moods.length > 0
                  ? todayLog.moods.join(', ')
                  : cycleStatus.phase === 'ovulatory'
                  ? 'Happy & Radiant'
                  : cycleStatus.phase === 'menstrual'
                  ? 'Quiet & Resting'
                  : 'Calm & Steady'}
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              Overall emotional vibe
            </div>
          </div>

          {/* Tile 4: Physical Symptoms */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Symptoms
              </span>
              <AlertCircle className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="my-2">
              <div className="text-sm font-bold text-slate-900 truncate">
                {todayLog && todayLog.symptoms && todayLog.symptoms.length > 0
                  ? `${todayLog.symptoms.length} reported`
                  : 'None logged'}
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              {todayLog && todayLog.symptoms && todayLog.symptoms.length > 0
                ? todayLog.symptoms.slice(0, 2).join(', ')
                : 'No symptoms today'}
            </div>
          </div>
        </div>

        {/* Compact Symptoms Chips if present */}
        {todayLog?.symptoms && todayLog.symptoms.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500">Logged Symptoms:</span>
            {todayLog.symptoms.map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Compact Note from Partner if present */}
        {todayLog?.customNote && (
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-950 flex items-start gap-2">
            <span className="font-bold text-sky-900 shrink-0">Note from {settings.trackerName}:</span>
            <span className="italic font-medium">"{todayLog.customNote}"</span>
          </div>
        )}
      </div>

      {/* CYCLE BENCHMARKS & PREDICTABILITY (PURE NUMERICAL DATA & MINI BARS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <BarChart2 className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cycle Benchmarks & Predictability
              </h2>
              <div className="text-[11px] text-slate-500">
                Calculated on-device from her past {analytics.sampleSize} tracked cycles
              </div>
            </div>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            {analytics.regularityStatus} Cycle
          </span>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Average Cycle</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
              {analytics.meanCycleLength} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Median: {analytics.medianCycleLength}d</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Period Duration</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
              {analytics.averagePeriodLength} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Bleeding days</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Variability Window</div>
            <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
              ±{analytics.confidenceMarginDays} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Normal cycle shift</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Prediction Accuracy</div>
            <div className="text-2xl font-black text-sky-600 tabular-nums mt-1">
              {analytics.predictionConfidencePercent}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">High Confidence</div>
          </div>
        </div>

        {/* Mini Cycle Comparison Bars */}
        {recentCycles.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recent Cycle Lengths vs. Her Average ({analytics.meanCycleLength}d)
            </div>
            <div className="space-y-2">
              {recentCycles.map((c, i) => {
                const len = c.cycleLengthDays || settings.averageCycleLength;
                const pct = Math.min(100, Math.max(20, (len / 35) * 100));
                const delta = Math.round((len - analytics.meanCycleLength) * 10) / 10;
                return (
                  <div key={c.id || i} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-semibold text-slate-600 shrink-0">
                      Cycle {sortedCycles.length - recentCycles.length + i + 1}
                    </span>
                    <div className="flex-1 bg-slate-200 h-3 rounded-full overflow-hidden relative">
                      <div
                        className="bg-sky-600 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-bold tabular-nums text-slate-900 shrink-0">
                      {len}d{' '}
                      <span className={`text-[10px] ${delta > 0 ? 'text-amber-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ({delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta})
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 10-DAY FORECAST STRIP: Simplified High-Contrast Visual Strip */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Upcoming 10 Days Forecast
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>Full Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 overflow-x-auto pb-1 pt-1">
          {forecastDays.map((fDay) => {
            let bgClass = 'bg-slate-50 border-slate-200 text-slate-700';
            let label = 'Normal';
            let pillColor = 'bg-slate-200 text-slate-700';

            if (fDay.isRecordedPeriod) {
              bgClass = 'bg-rose-50 border-rose-300 text-rose-950 font-bold';
              label = 'Period';
              pillColor = 'bg-rose-500 text-white';
            } else if (fDay.isPredictedPeriod) {
              bgClass = 'bg-rose-50/50 border-dashed border-rose-300 text-rose-800';
              label = 'Period';
              pillColor = 'bg-rose-200 text-rose-800';
            } else if (fDay.isOvulationDay) {
              bgClass = 'bg-amber-50 border-amber-300 text-amber-950 font-bold';
              label = 'Peak';
              pillColor = 'bg-amber-500 text-white';
            } else if (fDay.isFertileWindow) {
              bgClass = 'bg-amber-50/50 border-amber-200 text-amber-900';
              label = 'Vibrant';
              pillColor = 'bg-amber-200 text-amber-800';
            } else if (cycles.length === 0 && !settings.lastPeriodStartDate) {
              label = fDay.isToday ? 'Today' : '—';
              pillColor = 'bg-slate-200 text-slate-600';
            }

            const isInspected = fDay.date === inspectedDate;

            return (
              <button
                key={fDay.date}
                type="button"
                onClick={() => setInspectedDate(fDay.date)}
                className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all min-h-[64px] ${bgClass} ${
                  isInspected
                    ? 'ring-2 ring-sky-500 ring-offset-2 shadow-sm font-bold scale-[1.03]'
                    : 'hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  {fDay.dayOfWeek}
                </span>
                <span className="text-base font-extrabold tabular-nums my-0.5">
                  {fDay.dayNumber}
                </span>
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${pillColor}`}>
                  {fDay.isToday ? 'Today' : label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog for Unlink in Male View */}
      <ConfirmDialog
        isOpen={showUnlinkModal}
        title="Unlink from Partner?"
        message={`Are you sure you want to disconnect from ${settings.trackerName}? You can reconnect anytime with her secret pairing code.`}
        confirmLabel="Unlink Partner"
        cancelLabel="Keep Connected"
        isDestructive={true}
        onConfirm={handleConfirmUnlink}
        onCancel={() => setShowUnlinkModal(false)}
      />
    </div>
  );
};
