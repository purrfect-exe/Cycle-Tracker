import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCycle } from '../../context/CycleContext';
import { SymptomFrequencyItem, CycleObservation } from '../../types/cycle';
import { formatDisplayDate } from '../../utils/cycleCalculations';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Sliders,
  Check,
  Calendar,
  Sparkles,
  Info,
  Clock,
  AlertCircle,
  Zap,
  Droplet,
  Heart,
  CheckCircle2,
  Smile,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const InsightsComponent: React.FC = () => {
  const { cycles, cycleStatus, settings, updateSettings, updateFemaleProfileInDb, userRole, logs } = useCycle();
  const isFemale = userRole === 'female';
  const isMale = userRole === 'male';

  const analytics = cycleStatus.analytics;
  const symptomInsights = analytics.symptomInsights;

  // Sub-tabs for clean navigation without visual crowding
  const [activeSubTab, setActiveSubTab] = useState<'timing' | 'symptoms' | 'changes' | 'summaries'>('timing');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  const subTabs = useMemo(() => [
    { id: 'timing' as const, label: 'Graphs', icon: TrendingUp },
    { id: 'symptoms' as const, label: 'Symptom Patterns', icon: Activity },
    { id: 'changes' as const, label: 'Observations', icon: AlertCircle },
    { id: 'summaries' as const, label: 'Summary', icon: Sparkles },
  ], []);

  const currentTab = subTabs.find((t) => t.id === activeSubTab) || subTabs[0];
  const CurrentIcon = currentTab.icon;

  // Female customization state
  const [calibrationMode, setCalibrationMode] = useState<'analytics' | 'custom'>(
    settings.calibrationMode || 'analytics'
  );
  const [customCycle, setCustomCycle] = useState<number>(
    settings.customCycleLengthOverride || settings.averageCycleLength || 29
  );
  const [customPeriod, setCustomPeriod] = useState<number>(
    settings.customPeriodDurationOverride || settings.averagePeriodLength || 5
  );
  const [customLuteal, setCustomLuteal] = useState<number>(
    settings.customLutealLengthOverride || settings.lutealPhaseLength || 14
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Prepare last 6 months data for Recharts (memoized to eliminate unnecessary reflow on low-end devices)
  const chartData = useMemo(() => {
    const sortedCycles = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const recent6Cycles = sortedCycles.slice(-6);
    return recent6Cycles.map((c) => {
      const monthName = new Date(c.startDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
      });
      return {
        month: monthName,
        fullDate: c.startDate,
        cycleLength: c.cycleLengthDays || settings.averageCycleLength,
        periodDuration: c.periodDurationDays,
        baseline: analytics.meanCycleLength,
        isConfirmed: c.isConfirmed !== false,
      };
    });
  }, [cycles, settings.averageCycleLength, analytics.meanCycleLength]);

  // Append next projected cycle (memoized)
  const forecastData = useMemo(() => {
    const nextMonthName = new Date(cycleStatus.nextPeriodStartDate + 'T00:00:00').toLocaleDateString(
      'en-US',
      { month: 'short' }
    );
    return [
      ...chartData,
      {
        month: `${nextMonthName} (Est)`,
        fullDate: cycleStatus.nextPeriodStartDate,
        cycleLength: Math.round(analytics.weightedCycleLength),
        periodDuration: Math.round(analytics.averagePeriodLength),
        baseline: analytics.meanCycleLength,
        isEstimate: true,
        isConfirmed: false,
      },
    ];
  }, [chartData, cycleStatus.nextPeriodStartDate, analytics.weightedCycleLength, analytics.averagePeriodLength, analytics.meanCycleLength]);

  // Energy by phase chart data (memoized)
  const energyChartData = useMemo(() => [
    { phase: 'Period (Days 1–5)', energy: symptomInsights.energyByPhase.menstrual, color: '#BC4F4F' },
    { phase: 'Rising (Days 6–12)', energy: symptomInsights.energyByPhase.follicular, color: '#E98B50' },
    { phase: 'Peak (Days 13–16)', energy: symptomInsights.energyByPhase.ovulatory, color: '#D97706' },
    { phase: 'Luteal (Days 17–28)', energy: symptomInsights.energyByPhase.luteal, color: '#8E2B2B' },
  ], [symptomInsights.energyByPhase]);

  // Top symptoms chart data (memoized)
  const symptomChartData = useMemo(() => 
    symptomInsights.topSymptoms.slice(0, 6).map((s: SymptomFrequencyItem) => ({
      name: s.name,
      count: s.count,
      percentage: s.percentage,
      phase: s.commonPhase,
      days: s.commonCycleDays.length > 0 ? `Days ${s.commonCycleDays.slice(0, 3).join(', ')}` : 'Various',
    })),
    [symptomInsights.topSymptoms]
  );

  const handleSaveCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates = {
      calibrationMode,
      customCycleLengthOverride: Number(customCycle),
      customPeriodDurationOverride: Number(customPeriod),
      customLutealLengthOverride: Number(customLuteal),
      averageCycleLength: calibrationMode === 'custom' ? Number(customCycle) : settings.averageCycleLength,
      averagePeriodLength: calibrationMode === 'custom' ? Number(customPeriod) : settings.averagePeriodLength,
    };

    updateSettings(updates);
    if (isFemale) {
      await updateFemaleProfileInDb(updates as any);
    }

    setSavedFeedback(true);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#BC4F4F', '#E98B50', '#FEF2A0'],
    });

    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="space-y-5 animate-smooth-appear font-sans">
      {/* Header with High-Level Stats */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F7EFE8]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FFFBD8] text-[#92400E] border border-[#F3CD97]">
              {analytics.regularityStatus}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FCECEC] text-[#BC4F4F] border border-[#F3CD97]/50">
              {analytics.predictionConfidencePercent}% Confidence
            </span>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40">
            <div className="text-[10px] font-bold text-[#7A5B4F] uppercase tracking-wider">
              Mean Cycle
            </div>
            <div className="text-2xl font-bold text-[#261C19] tabular-nums mt-0.5">
              {analytics.meanCycleLength} <span className="text-xs font-normal text-[#7A5B4F]">days</span>
            </div>
            <div className="text-[10px] text-[#7A5B4F] mt-0.5">Median: {analytics.medianCycleLength} days</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40">
            <div className="text-[10px] font-bold text-[#7A5B4F] uppercase tracking-wider">
              Bleeding Days
            </div>
            <div className="text-2xl font-bold text-[#BC4F4F] tabular-nums mt-0.5">
              {analytics.averagePeriodLength} <span className="text-xs font-normal text-[#7A5B4F]">days</span>
            </div>
            <div className="text-[10px] text-[#7A5B4F] mt-0.5">Median: {analytics.medianPeriodLength} days</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40">
            <div className="text-[10px] font-bold text-[#7A5B4F] uppercase tracking-wider">
              Variability Window
            </div>
            <div className="text-2xl font-bold text-[#E98B50] tabular-nums mt-0.5">
              ±{analytics.confidenceMarginDays} <span className="text-xs font-normal text-[#7A5B4F]">days</span>
            </div>
            <div className="text-[10px] text-[#7A5B4F] mt-0.5">Range: {analytics.minCycleLength}–{analytics.maxCycleLength} days</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40">
            <div className="text-[10px] font-bold text-[#7A5B4F] uppercase tracking-wider">
              Sample Size
            </div>
            <div className="text-2xl font-bold text-[#261C19] tabular-nums mt-0.5">
              {analytics.sampleSize} <span className="text-xs font-normal text-[#7A5B4F]">cycles</span>
            </div>
            <div className="text-[10px] text-[#7A5B4F] mt-0.5">{logs.length} symptom logs analyzed</div>
          </div>
        </div>

        {/* Drop Down Selection for 6 Month Insights (Options appear directly below, no modal) */}
        <div className="relative w-full sm:w-72" ref={dropdownRef}>
          <label className="block text-[10px] font-bold text-[#7A5B4F] uppercase tracking-wider mb-1">
            Section
          </label>

          {/* Input Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            className="w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-[#F4ECE2] border border-[#F3CD97]/70 text-[#261C19] font-bold text-xs sm:text-sm shadow-2xs transition-all touch-manipulation active:scale-[0.99] min-h-[42px]"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isMale ? 'bg-slate-900 text-white' : 'bg-[#BC4F4F] text-white'
                }`}
              >
                <CurrentIcon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{currentTab.label}</span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-[#7A5B4F] shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#261C19]' : ''
              }`}
            />
          </button>

          {/* Options Dropdown Menu - Appears directly below the input drop down, NO modal */}
          {isDropdownOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-xl shadow-lg border border-[#F3CD97]/80 py-1 overflow-hidden animate-fade-in divide-y divide-[#F7EFE8]/70"
            >
              {subTabs.map((tab) => {
                const isSelected = activeSubTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm text-left transition-colors touch-manipulation ${
                      isSelected
                        ? isMale
                          ? 'bg-slate-100 text-slate-900 font-bold'
                          : 'bg-[#FCECEC] text-[#BC4F4F] font-bold'
                        : 'text-[#5A4036] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <TabIcon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected
                            ? isMale
                              ? 'text-slate-900'
                              : 'text-[#BC4F4F]'
                            : 'text-[#7A5B4F]'
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {isSelected && (
                      <Check
                        className={`w-4 h-4 shrink-0 ${
                          isMale ? 'text-slate-900' : 'text-[#BC4F4F]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: CYCLE TIMING & SMART PREDICTIONS                     */}
      {/* ============================================================== */}
      {activeSubTab === 'timing' && (
        <div className="space-y-5">
          {/* 6-Month Cycle Length Trends Chart */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#F7EFE8] gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#261C19]">Cycle Length Trend Comparison</h2>
                <div className="text-[11px] text-[#7A5B4F]">
                  Past confirmed cycle lengths vs. next on-device projection.
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#7A5B4F]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded-sm bg-[#BC4F4F]" /> Confirmed Record
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded-sm bg-[#E98B50] border border-dashed border-[#BC4F4F]" /> Estimated
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#D97706] border-dashed" /> Baseline ({analytics.meanCycleLength}d)
                </span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="warmCycleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#BC4F4F" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#BC4F4F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F7EFE8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A5B4F' }} axisLine={{ stroke: '#F3CD97' }} />
                  <YAxis domain={['dataMin - 3', 'dataMax + 3']} tick={{ fontSize: 11, fill: '#7A5B4F' }} axisLine={{ stroke: '#F3CD97' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 rounded-xl border border-[#F3CD97] shadow-md text-xs space-y-1">
                            <div className="font-bold text-[#261C19] flex items-center justify-between gap-2">
                              <span>{data.month}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${data.isEstimate ? 'bg-[#FFFBD8] text-[#92400E]' : 'bg-[#E8F5EE] text-[#1E523C]'}`}>
                                {data.isEstimate ? 'Estimated' : 'Confirmed'}
                              </span>
                            </div>
                            <div className="text-[#BC4F4F] font-semibold">
                              Cycle Interval: {data.cycleLength} days
                            </div>
                            <div className="text-[#7A5B4F]">
                              Bleeding Duration: {data.periodDuration} days
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={analytics.meanCycleLength} stroke="#D97706" strokeDasharray="4 4" />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="cycleLength"
                    stroke="#BC4F4F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#warmCycleGradient)"
                    activeDot={{ r: 5, fill: '#BC4F4F', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bleeding Duration Bar Chart */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE8]">
              <div>
                <h2 className="text-sm font-bold text-[#261C19]">Period Duration History</h2>
                <div className="text-[11px] text-[#7A5B4F]">
                  Recorded bleeding days per cycle (variations visible).
                </div>
              </div>
              <span className="text-xs font-semibold text-[#BC4F4F]">Average: {analytics.averagePeriodLength} days</span>
            </div>

            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F7EFE8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A5B4F' }} axisLine={{ stroke: '#F3CD97' }} />
                  <YAxis domain={[0, 8]} tick={{ fontSize: 11, fill: '#7A5B4F' }} axisLine={{ stroke: '#F3CD97' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 rounded-xl border border-[#F3CD97] shadow-sm text-xs">
                            <span className="font-bold text-[#261C19]">{data.month}: </span>
                            <span className="text-[#BC4F4F] font-semibold">{data.periodDuration} days bleeding</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar isAnimationActive={false} dataKey="periodDuration" fill="#BC4F4F" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: PERSONALIZED SYMPTOM INSIGHTS                        */}
      {/* ============================================================== */}
      {activeSubTab === 'symptoms' && (
        <div className="space-y-5">
          {/* Frequently Recorded Symptoms & Cycle-Day Clustering */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#F7EFE8] gap-1">
              <div>
                <h2 className="text-sm font-bold text-[#261C19]">Frequently Recorded Symptoms</h2>
              </div>
              <span className="text-xs text-[#7A5B4F] font-medium">
                {symptomInsights.totalLogsAnalyzed} check-ins analyzed
              </span>
            </div>

            {symptomChartData.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7A5B4F] bg-[#FFFDF9] rounded-xl border border-[#F3CD97]/30">
                No symptoms logged yet. Use the "Log Today" check-in to track your symptoms, energy, and mood.
              </div>
            ) : (
              <div className="space-y-3">
                {symptomChartData.map((symptom: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#261C19]">{symptom.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FCECEC] text-[#BC4F4F] font-medium">
                          {symptom.days}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#7A5B4F]">{symptom.count} logs</span>
                        <span className="font-bold text-[#BC4F4F] tabular-nums">{symptom.percentage}%</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-[#F7EFE8] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#BC4F4F] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, symptom.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Energy Level Across Cycle Phases */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE8]">
              <div>
                <h2 className="text-sm font-bold text-[#261C19]">Energy Level by Cycle Phase</h2>
                <div className="text-[11px] text-[#7A5B4F]">
                  Average energy score (1 to 10 scale) across your four cycle phases.
                </div>
              </div>
              <span className="text-xs text-[#7A5B4F]">Scale: 1 (Exhausted) – 10 (Peak)</span>
            </div>

            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F7EFE8" />
                  <XAxis dataKey="phase" tick={{ fontSize: 10, fill: '#7A5B4F' }} axisLine={{ stroke: '#F3CD97' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#7A5B4F' }} axisLine={{ stroke: '#F3CD97' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 rounded-xl border border-[#F3CD97] shadow-sm text-xs">
                            <span className="font-bold text-[#261C19]">{data.phase}: </span>
                            <span className="text-[#BC4F4F] font-semibold">{data.energy}/10 average energy</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar isAnimationActive={false} dataKey="energy" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {energyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cramps & Flow Patterns Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F7EFE8]">
                <Activity className="w-4 h-4 text-[#BC4F4F]" />
                <h3 className="text-xs font-bold text-[#261C19] uppercase tracking-wider">
                  Cramp Occurrences
                </h3>
              </div>
              <div className="text-2xl font-bold text-[#BC4F4F]">
                {symptomInsights.crampPrevalence.cyclesWithCramps} of {symptomInsights.crampPrevalence.totalCyclesAnalyzed} Cycles
              </div>
              <p className="text-xs text-[#7A5B4F] leading-relaxed">
                {symptomInsights.crampPrevalence.mostCommonDays.length > 0
                  ? `Cramps have most frequently been recorded on Cycle Days ${symptomInsights.crampPrevalence.mostCommonDays.slice(0, 3).join(', ')}.`
                  : 'No cramp episodes recorded in recent history.'}
              </p>
              {symptomInsights.crampPrevalence.commonLocations.length > 0 && (
                <div className="text-[11px] text-[#261C19] pt-1">
                  <span className="font-semibold text-[#7A5B4F]">Common locations: </span>
                  {symptomInsights.crampPrevalence.commonLocations.join(', ')}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F7EFE8]">
                <Droplet className="w-4 h-4 text-[#E98B50]" />
                <h3 className="text-xs font-bold text-[#261C19] uppercase tracking-wider">
                  Flow Intensity
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-1 text-xs">
                <div className="p-2 rounded-lg bg-[#FFFDF9] border border-[#F3CD97]/40">
                  <div className="text-[10px] text-[#7A5B4F] font-medium">Spotting</div>
                  <div className="text-base font-bold text-[#261C19] mt-0.5">{symptomInsights.flowBreakdown.spotting}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FFFDF9] border border-[#F3CD97]/40">
                  <div className="text-[10px] text-[#7A5B4F] font-medium">Light</div>
                  <div className="text-base font-bold text-[#261C19] mt-0.5">{symptomInsights.flowBreakdown.light}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FFFDF9] border border-[#F3CD97]/40">
                  <div className="text-[10px] text-[#7A5B4F] font-medium">Medium</div>
                  <div className="text-base font-bold text-[#261C19] mt-0.5">{symptomInsights.flowBreakdown.medium}</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FFFDF9] border border-[#F3CD97]/40">
                  <div className="text-[10px] text-[#7A5B4F] font-medium">Heavy</div>
                  <div className="text-base font-bold text-[#BC4F4F] mt-0.5">{symptomInsights.flowBreakdown.heavy}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: CYCLE CHANGE OBSERVATIONS                            */}
      {/* ============================================================== */}
      {activeSubTab === 'changes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFFBD8] border border-[#F3CD97] flex items-start gap-3 text-xs text-[#92400E]">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
            <div className="space-y-1">
              <div className="font-bold text-[#78350F]">Informational Observations Only</div>
            </div>
          </div>

          {/* Observations List */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE8]">
              <h2 className="text-sm font-bold text-[#261C19]">Detected Cycle Observations</h2>
              <span className="text-xs text-[#7A5B4F]">
                {analytics.cycleChanges.length} active observation(s)
              </span>
            </div>

            {analytics.cycleChanges.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7A5B4F] bg-[#FFFDF9] rounded-xl border border-[#F3CD97]/30">
                No unusual cycle length or duration shifts detected. Your records show consistent regularity.
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.cycleChanges.map((obs: CycleObservation) => (
                  <div
                    key={obs.id}
                    className="p-4 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-[#261C19]">
                        <AlertCircle className={`w-4 h-4 ${obs.severity === 'notice' ? 'text-[#E98B50]' : 'text-[#2D6A4F]'}`} />
                        <span>{obs.title}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF6F0] text-[#7A5B4F] border border-[#F3CD97]/40 uppercase tracking-tight">
                        {obs.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[#261C19] leading-relaxed">
                      {obs.description}
                    </p>

                    <div className="pt-1.5 border-t border-[#F7EFE8] flex items-start gap-1.5 text-[11px] text-[#7A5B4F]">
                      <span className="font-bold text-[#261C19] shrink-0">Why highlighted:</span>
                      <span>{obs.whyHighlighted}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 4: DATA SUMMARIES & CUSTOM CALIBRATION                  */}
      {/* ============================================================== */}
      {activeSubTab === 'summaries' && (
        <div className="space-y-5">
          {/* Automatic Calculated Summaries */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-3">
            <div className="space-y-2.5">
              {analytics.automaticSummaries.map((summary: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FFFDF9] border border-[#F3CD97]/40 text-xs text-[#261C19]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{summary}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Female Personal Timing Calibration Panel */}
          {isFemale && (
            <div className="bg-white rounded-2xl p-5 border border-[#F3CD97]/50 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F7EFE8]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#BC4F4F]" />
                  <h2 className="text-sm font-bold text-[#261C19]">Personal Cycle Calibration</h2>
                </div>
                <span className="text-[11px] font-medium text-[#7A5B4F]">Custom Overrides</span>
              </div>

              <form onSubmit={handleSaveCalibration} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCalibrationMode('analytics')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      calibrationMode === 'analytics'
                        ? 'border-[#BC4F4F] bg-[#FCECEC] text-[#8E2B2B] font-semibold shadow-2xs'
                        : 'border-[#F3CD97]/50 bg-[#FFFDF9] text-[#7A5B4F] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="font-bold">Smart Analysis (Automatic)</div>
                    <div className="text-[10px] text-[#7A5B4F] mt-0.5">
                      Recalculates timing and predictions dynamically from logged periods.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalibrationMode('custom')}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      calibrationMode === 'custom'
                        ? 'border-[#BC4F4F] bg-[#FCECEC] text-[#8E2B2B] font-semibold shadow-2xs'
                        : 'border-[#F3CD97]/50 bg-[#FFFDF9] text-[#7A5B4F] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="font-bold">Custom Override (Manual)</div>
                    <div className="text-[10px] text-[#7A5B4F] mt-0.5">
                      Directly specify your known cycle length and bleeding days.
                    </div>
                  </button>
                </div>

                {calibrationMode === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-[#7A5B4F] mb-1">
                        Typical Cycle Length (Days)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="45"
                        value={customCycle}
                        onChange={(e) => setCustomCycle(Number(e.target.value))}
                        className="w-full text-xs p-2.5 bg-[#FFFDF9] border border-[#F3CD97] rounded-xl text-[#261C19] focus:outline-none focus:ring-2 focus:ring-[#BC4F4F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#7A5B4F] mb-1">
                        Bleeding Duration (Days)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={customPeriod}
                        onChange={(e) => setCustomPeriod(Number(e.target.value))}
                        className="w-full text-xs p-2.5 bg-[#FFFDF9] border border-[#F3CD97] rounded-xl text-[#261C19] focus:outline-none focus:ring-2 focus:ring-[#BC4F4F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#7A5B4F] mb-1">
                        Luteal Phase (Post-Ovulation)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="16"
                        value={customLuteal}
                        onChange={(e) => setCustomLuteal(Number(e.target.value))}
                        className="w-full text-xs p-2.5 bg-[#FFFDF9] border border-[#F3CD97] rounded-xl text-[#261C19] focus:outline-none focus:ring-2 focus:ring-[#BC4F4F]"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#BC4F4F] hover:bg-[#9E3A3A] shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    {savedFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Preferences Saved!</span>
                      </>
                    ) : (
                      <span>Save Preferences</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
