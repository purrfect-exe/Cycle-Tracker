import {
  CycleRecord,
  CyclePhase,
  DailyLog,
  CycleAnalytics,
  SymptomInsights,
  CycleObservation,
  SymptomFrequencyItem,
  MoodFrequencyItem,
} from '../types/cycle';

export function formatToDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatToDateString(d);
}

export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = parseDateString(dateStr1);
  const d2 = parseDateString(dateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDisplayDate(dateStr: string, options?: { showYear?: boolean; short?: boolean }): string {
  const d = parseDateString(dateStr);
  const showYear = options?.showYear ?? false;
  const short = options?.short ?? false;

  return d.toLocaleDateString('en-US', {
    weekday: short ? undefined : 'long',
    month: 'short',
    day: 'numeric',
    year: showYear ? 'numeric' : undefined,
  });
}

export interface PhaseInfo {
  phase: CyclePhase;
  title: string;
  seasonMetaphor: string;
  daySpan: string;
  hormones: string;
  trackerFeeling: string;
  partnerSupportTip: string;
  suggestedAction: string;
  topThreePartnerActions: string[];
  accentColor: string;
  badgeBg: string;
}

export const PHASE_DETAILS: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    phase: 'menstrual',
    title: 'Period Phase',
    seasonMetaphor: 'Rest Time',
    daySpan: 'Days 1 – 5',
    hormones: 'Low hormone levels while bleeding.',
    trackerFeeling: 'Lower physical stamina, possible cramps, lower back tightness, and tiredness.',
    partnerSupportTip: 'She is resting and managing cramps. Keep tasks light and comfortable.',
    topThreePartnerActions: [
      'Keep the heating pad plugged in and ready near her bed or sofa.',
      'Take care of dinner without asking her to make decisions.',
      'Give her space to nap and handle the evening dishes/chores.'
    ],
    suggestedAction: 'Offer heating pad and prepare a warm meal',
    accentColor: '#BC4F4F',
    badgeBg: '#FCECEC',
  },
  follicular: {
    phase: 'follicular',
    title: 'Energy Rebuilding Phase',
    seasonMetaphor: 'Rising Energy',
    daySpan: 'Days 6 – 12',
    hormones: 'Estrogen is steadily rising.',
    trackerFeeling: 'Clear head, returning physical stamina, and upbeat mood.',
    partnerSupportTip: 'Her energy and mood are bouncing back. Great time for activities together.',
    topThreePartnerActions: [
      'Plan active dates, fun walks, or try a new restaurant together.',
      'Support her personal projects and creative goals while motivation is high.',
      'Invite her to be spontaneous with weekend plans.'
    ],
    suggestedAction: 'Plan a fun evening date or outing together',
    accentColor: '#E98B50',
    badgeBg: '#FEF4EC',
  },
  ovulatory: {
    phase: 'ovulatory',
    title: 'High Energy & Ovulation Phase',
    seasonMetaphor: 'Peak Vitality',
    daySpan: 'Days 13 – 16',
    hormones: 'Peak estrogen and egg release window.',
    trackerFeeling: 'Peak energy, high confidence, vibrant complexion, and loving mood.',
    partnerSupportTip: 'She feels affectionate, radiant, and open. Best time for romance.',
    topThreePartnerActions: [
      'Surprise her with thoughtful romance—bring flowers or a sweet treat.',
      'Give genuine compliments and show active affection.',
      'Make time for deep conversations and meaningful couple time.'
    ],
    suggestedAction: 'Plan something romantic or surprise her with a gift',
    accentColor: '#D97706',
    badgeBg: '#FFFBD8',
  },
  luteal: {
    phase: 'luteal',
    title: 'Pre-Period & Wind-Down Phase',
    seasonMetaphor: 'Nesting & Comfort',
    daySpan: 'Days 17 – 28',
    hormones: 'Progesterone elevated, then drops before period.',
    trackerFeeling: 'Body begins winding down. Possible bloating, sugar/salt cravings, and emotional sensitivity.',
    partnerSupportTip: 'Pre-period week. Be patient, reassuring, and provide comfort foods.',
    topThreePartnerActions: [
      'Stock up on her favorite snacks (dark chocolate, warm teas, salty treats).',
      'Offer a gentle neck, shoulder, or back massage to ease tension.',
      'Listen patiently and avoid picking debates or stressful arguments.'
    ],
    suggestedAction: 'Stock comfort snacks and offer a relaxing massage',
    accentColor: '#B0543C',
    badgeBg: '#FAF0EA',
  },
};

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 28;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
  }
  return Math.round(sorted[mid] * 10) / 10;
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 28;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function calculateStdDev(values: number[], meanVal: number): number {
  if (values.length <= 1) return 1.0;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - meanVal, 2), 0) / values.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

/**
 * Lightweight On-Device Statistical Analytics & Intelligence Engine
 * Performs mathematical analysis locally in pure JavaScript without external API calls.
 */
export function computeCycleAnalytics(
  cycles: CycleRecord[],
  customOverrides?: {
    calibrationMode?: 'analytics' | 'custom';
    cycleOverride?: number;
    periodOverride?: number;
    lutealOverride?: number;
  },
  logs: DailyLog[] = []
): CycleAnalytics {
  const defaultOverrides = {
    cycle: customOverrides?.cycleOverride || 29,
    period: customOverrides?.periodOverride || 5,
  };

  if (!cycles || cycles.length === 0) {
    const emptySymptomInsights: SymptomInsights = {
      topSymptoms: [],
      topMoods: [],
      energyByPhase: { menstrual: 3.5, follicular: 7.0, ovulatory: 8.5, luteal: 5.5 },
      flowBreakdown: { none: 0, spotting: 0, light: 0, medium: 0, heavy: 0 },
      crampPrevalence: { cyclesWithCramps: 0, totalCyclesAnalyzed: 0, mostCommonDays: [], commonLocations: [] },
      phaseClusters: [],
      totalLogsAnalyzed: 0,
    };

    return {
      weightedCycleLength: defaultOverrides.cycle,
      averagePeriodLength: defaultOverrides.period,
      meanCycleLength: defaultOverrides.cycle,
      medianCycleLength: defaultOverrides.cycle,
      minCycleLength: defaultOverrides.cycle,
      maxCycleLength: defaultOverrides.cycle,
      medianPeriodLength: defaultOverrides.period,
      standardDeviation: 1.0,
      confidenceMarginDays: 1.5,
      predictionConfidencePercent: 55,
      sampleSize: 0,
      regularityStatus: 'Building Baseline',
      trendDirection: 'stable',
      estimatedWindowStart: formatToDateString(new Date()),
      estimatedWindowEnd: formatToDateString(new Date()),
      predictionStatus: 'insufficient_data',
      predictionExplanation: 'Log your first period start dates to begin generating on-device predictions.',
      symptomInsights: emptySymptomInsights,
      cycleChanges: [
        {
          id: 'obs-initial',
          type: 'data_gap',
          severity: 'info',
          title: 'Initial Tracking Phase',
          description: 'No completed cycles recorded yet.',
          whyHighlighted: 'Predictions will automatically calibrate once at least 2 period dates are recorded.',
        },
      ],
      automaticSummaries: [
        'Welcome! Log your period start dates to generate your personalized cycle statistics.',
      ],
    };
  }

  // Sort descending (most recent first)
  const sortedDesc = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));

  // Extract cycle lengths (from confirmed cycle records or consecutive start intervals)
  const cycleLengths: number[] = [];
  for (let i = 0; i < sortedDesc.length; i++) {
    const c = sortedDesc[i];
    if (typeof c.cycleLengthDays === 'number' && c.cycleLengthDays >= 18 && c.cycleLengthDays <= 55) {
      cycleLengths.push(c.cycleLengthDays);
    } else if (i < sortedDesc.length - 1) {
      const diff = daysBetween(sortedDesc[i + 1].startDate, c.startDate);
      if (diff >= 18 && diff <= 55) {
        cycleLengths.push(diff);
      }
    }
  }

  // Extract period durations
  const periodDurations = sortedDesc
    .map((c) => c.periodDurationDays)
    .filter((p): p is number => typeof p === 'number' && p >= 1 && p <= 14);

  const sampleSize = cycleLengths.length;
  const meanCycle = cycleLengths.length > 0 ? calculateMean(cycleLengths) : defaultOverrides.cycle;
  const medianCycle = cycleLengths.length > 0 ? calculateMedian(cycleLengths) : defaultOverrides.cycle;
  const minCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : defaultOverrides.cycle;
  const maxCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : defaultOverrides.cycle;

  let avgPeriod = periodDurations.length > 0 ? calculateMean(periodDurations) : defaultOverrides.period;
  const medianPeriod = periodDurations.length > 0 ? calculateMedian(periodDurations) : defaultOverrides.period;

  // Weighted moving average (recency weighting: 3, 2.5, 2, 1.5, 1...)
  let weightedCycle = meanCycle;
  if (cycleLengths.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;
    cycleLengths.forEach((len, idx) => {
      const weight = Math.max(1, 3 - idx * 0.4);
      weightedSum += len * weight;
      totalWeight += weight;
    });
    weightedCycle = Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  // User custom calibration override if selected
  if (customOverrides?.calibrationMode === 'custom') {
    if (customOverrides.cycleOverride) weightedCycle = customOverrides.cycleOverride;
    if (customOverrides.periodOverride) avgPeriod = customOverrides.periodOverride;
  }

  // Statistical dispersion (standard deviation)
  const stdDev = calculateStdDev(cycleLengths, meanCycle);

  // Confidence margin (variability window in days)
  let confidenceMarginDays = 1.5;
  if (sampleSize <= 1) {
    confidenceMarginDays = 2.0;
  } else {
    confidenceMarginDays = Math.max(1.0, Math.min(5.0, Math.round(stdDev * 1.25 * 10) / 10));
  }

  // Prediction confidence percentage (derived from sample size and consistency)
  let predictionConfidence = 55;
  if (sampleSize === 1) {
    predictionConfidence = 62;
  } else if (sampleSize === 2) {
    predictionConfidence = 74;
  } else if (sampleSize >= 3) {
    const consistencyBonus = Math.max(0, 20 - stdDev * 5);
    const sampleBonus = Math.min(15, sampleSize * 2.5);
    predictionConfidence = Math.min(96, Math.max(65, Math.round(65 + consistencyBonus + sampleBonus)));
  }

  // Predict next period start date and window from latest cycle
  const latestStart = sortedDesc[0].startDate;
  const effectiveCycleDays = Math.round(weightedCycle);
  const nextProjectedStart = addDays(latestStart, effectiveCycleDays);
  const marginRounded = Math.max(1, Math.round(confidenceMarginDays));
  const estimatedWindowStart = addDays(nextProjectedStart, -marginRounded);
  const estimatedWindowEnd = addDays(nextProjectedStart, marginRounded);

  // Regularity Status and Explanation
  let regularityStatus = 'Regular (Predictable)';
  let predictionStatus: 'insufficient_data' | 'preliminary' | 'regular' | 'variable' = 'regular';
  let predictionExplanation = 'Calculated from historical cycle consistency.';

  if (sampleSize < 2) {
    regularityStatus = 'Building Baseline';
    predictionStatus = 'insufficient_data';
    predictionExplanation = 'Need at least 2 recorded cycles to establish cycle interval variability.';
  } else if (sampleSize === 2) {
    regularityStatus = 'Preliminary Trend';
    predictionStatus = 'preliminary';
    predictionExplanation = `Based on 2 recorded cycles. Prediction window is ±${confidenceMarginDays} days and will refine with future records.`;
  } else if (stdDev <= 1.5) {
    regularityStatus = 'Highly Regular';
    predictionStatus = 'regular';
    predictionExplanation = `Your cycle is exceptionally consistent with an observed variation of only ±${confidenceMarginDays} days.`;
  } else if (stdDev <= 2.8) {
    regularityStatus = 'Regular (Predictable)';
    predictionStatus = 'regular';
    predictionExplanation = `Typical biological rhythm. Next period expected within a ±${confidenceMarginDays}-day window.`;
  } else {
    regularityStatus = 'Moderate Variability';
    predictionStatus = 'variable';
    predictionExplanation = `Cycle lengths have varied from ${minCycle} to ${maxCycle} days (±${confidenceMarginDays} days variability).`;
  }

  // Trend detection (comparing recent 2 cycles vs older history)
  let trendDirection: 'stable' | 'lengthening' | 'shortening' = 'stable';
  if (cycleLengths.length >= 3) {
    const recentAvg = (cycleLengths[0] + (cycleLengths[1] || cycleLengths[0])) / 2;
    const olderAvg = cycleLengths.slice(2).reduce((a, b) => a + b, 0) / cycleLengths.slice(2).length;
    if (recentAvg - olderAvg > 1.4) trendDirection = 'lengthening';
    else if (olderAvg - recentAvg > 1.4) trendDirection = 'shortening';
  }

  // ==========================================
  // 2. PERSONALIZED SYMPTOM INSIGHTS ENGINE
  // ==========================================
  const symptomCounts: Record<string, { count: number; cycles: Set<string>; days: number[] }> = {};
  const moodCounts: Record<string, number> = {};
  const flowCounts: Record<string, number> = { none: 0, spotting: 0, light: 0, medium: 0, heavy: 0 };
  const energyByPhaseTotals: Record<CyclePhase, { sum: number; count: number }> = {
    menstrual: { sum: 0, count: 0 },
    follicular: { sum: 0, count: 0 },
    ovulatory: { sum: 0, count: 0 },
    luteal: { sum: 0, count: 0 },
  };

  const crampCyclesSet = new Set<string>();
  const crampDaysSet: number[] = [];
  const crampLocationCounts: Record<string, number> = {};

  const sortedAscCycles = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));

  logs.forEach((log) => {
    // Determine which cycle this log belongs to
    let matchingCycle = sortedAscCycles.find(
      (c) => log.date >= c.startDate && log.date <= addDays(c.startDate, c.cycleLengthDays || 32)
    );
    if (!matchingCycle) {
      matchingCycle = sortedAscCycles[sortedAscCycles.length - 1];
    }

    const cycleDay = matchingCycle
      ? Math.max(1, Math.min(45, daysBetween(matchingCycle.startDate, log.date) + 1))
      : 1;

    const cycleId = matchingCycle?.id || 'cycle-unknown';
    const periodDuration = matchingCycle?.periodDurationDays || Math.round(avgPeriod);
    const cycleTotal = matchingCycle?.cycleLengthDays || Math.round(weightedCycle);
    const ovDay = cycleTotal - 14;

    // Determine phase
    let phase: CyclePhase = 'follicular';
    if (cycleDay <= periodDuration) {
      phase = 'menstrual';
    } else if (cycleDay < ovDay - 1) {
      phase = 'follicular';
    } else if (cycleDay <= ovDay + 2) {
      phase = 'ovulatory';
    } else {
      phase = 'luteal';
    }

    // Energy tracking
    if (typeof log.energyLevel === 'number') {
      energyByPhaseTotals[phase].sum += log.energyLevel;
      energyByPhaseTotals[phase].count += 1;
    }

    // Flow tracking
    if (log.flow && flowCounts[log.flow] !== undefined) {
      flowCounts[log.flow] += 1;
    }

    // Cramps tracking
    if (log.cramps && log.cramps !== 'none') {
      crampCyclesSet.add(cycleId);
      if (!crampDaysSet.includes(cycleDay)) crampDaysSet.push(cycleDay);
      if (log.crampLocations) {
        log.crampLocations.forEach((loc) => {
          crampLocationCounts[loc] = (crampLocationCounts[loc] || 0) + 1;
        });
      }
    }

    // Symptoms tracking
    if (log.symptoms && Array.isArray(log.symptoms)) {
      log.symptoms.forEach((symptom) => {
        if (!symptomCounts[symptom]) {
          symptomCounts[symptom] = { count: 0, cycles: new Set<string>(), days: [] };
        }
        symptomCounts[symptom].count += 1;
        symptomCounts[symptom].cycles.add(cycleId);
        if (!symptomCounts[symptom].days.includes(cycleDay)) {
          symptomCounts[symptom].days.push(cycleDay);
        }
      });
    }

    // Mood tracking
    if (log.moods && Array.isArray(log.moods)) {
      log.moods.forEach((m) => {
        moodCounts[m] = (moodCounts[m] || 0) + 1;
      });
    }
  });

  const totalLogs = logs.length;

  const topSymptoms: SymptomFrequencyItem[] = Object.entries(symptomCounts)
    .map(([name, data]) => {
      const percentage = totalLogs > 0 ? Math.round((data.count / totalLogs) * 100) : 0;
      const sortedDays = data.days.sort((a, b) => a - b);
      const avgDay = sortedDays.reduce((a, b) => a + b, 0) / (sortedDays.length || 1);

      let commonPhase: CyclePhase = 'follicular';
      if (avgDay <= avgPeriod) commonPhase = 'menstrual';
      else if (avgDay > weightedCycle - 12) commonPhase = 'luteal';
      else if (avgDay >= 12 && avgDay <= 17) commonPhase = 'ovulatory';

      return {
        name,
        count: data.count,
        percentage,
        cyclesPresentCount: data.cycles.size,
        commonCycleDays: sortedDays,
        commonPhase,
      };
    })
    .sort((a, b) => b.count - a.count);

  const topMoods: MoodFrequencyItem[] = Object.entries(moodCounts)
    .map(([mood, count]) => ({
      mood,
      count,
      percentage: totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const energyByPhase: Record<CyclePhase, number> = {
    menstrual: energyByPhaseTotals.menstrual.count > 0
      ? Math.round((energyByPhaseTotals.menstrual.sum / energyByPhaseTotals.menstrual.count) * 10) / 10
      : 3.5,
    follicular: energyByPhaseTotals.follicular.count > 0
      ? Math.round((energyByPhaseTotals.follicular.sum / energyByPhaseTotals.follicular.count) * 10) / 10
      : 7.2,
    ovulatory: energyByPhaseTotals.ovulatory.count > 0
      ? Math.round((energyByPhaseTotals.ovulatory.sum / energyByPhaseTotals.ovulatory.count) * 10) / 10
      : 8.5,
    luteal: energyByPhaseTotals.luteal.count > 0
      ? Math.round((energyByPhaseTotals.luteal.sum / energyByPhaseTotals.luteal.count) * 10) / 10
      : 5.2,
  };

  const topCrampLocations = Object.entries(crampLocationCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([loc]) => loc.replace('_', ' '));

  const symptomInsights: SymptomInsights = {
    topSymptoms,
    topMoods,
    energyByPhase,
    flowBreakdown: {
      none: flowCounts.none || 0,
      spotting: flowCounts.spotting || 0,
      light: flowCounts.light || 0,
      medium: flowCounts.medium || 0,
      heavy: flowCounts.heavy || 0,
    },
    crampPrevalence: {
      cyclesWithCramps: crampCyclesSet.size,
      totalCyclesAnalyzed: Math.max(1, cycles.length),
      mostCommonDays: crampDaysSet.sort((a, b) => a - b),
      commonLocations: topCrampLocations,
    },
    phaseClusters: [
      {
        phase: 'menstrual',
        dominantSymptoms: topSymptoms.filter((s) => s.commonPhase === 'menstrual').map((s) => s.name).slice(0, 3),
        avgEnergy: energyByPhase.menstrual,
      },
      {
        phase: 'follicular',
        dominantSymptoms: topSymptoms.filter((s) => s.commonPhase === 'follicular').map((s) => s.name).slice(0, 3),
        avgEnergy: energyByPhase.follicular,
      },
      {
        phase: 'ovulatory',
        dominantSymptoms: topSymptoms.filter((s) => s.commonPhase === 'ovulatory').map((s) => s.name).slice(0, 3),
        avgEnergy: energyByPhase.ovulatory,
      },
      {
        phase: 'luteal',
        dominantSymptoms: topSymptoms.filter((s) => s.commonPhase === 'luteal').map((s) => s.name).slice(0, 3),
        avgEnergy: energyByPhase.luteal,
      },
    ],
    totalLogsAnalyzed: totalLogs,
  };

  // ==========================================
  // 3. CYCLE CHANGE DETECTION ENGINE
  // ==========================================
  const cycleChanges: CycleObservation[] = [];

  // Observation: Sample size / preliminary notice
  if (sampleSize < 3) {
    cycleChanges.push({
      id: 'obs-small-sample',
      type: 'data_gap',
      severity: 'info',
      title: 'Baseline In Progress',
      description: `Currently calibrated on ${sampleSize} recorded cycle(s).`,
      whyHighlighted: 'Predictions will automatically gain precision as 3 or more consecutive cycles are tracked.',
    });
  }

  // Observation: Noticeable Cycle Length Deviations (> 3.5 days from median)
  sortedDesc.forEach((c) => {
    if (c.cycleLengthDays) {
      const diff = Math.round((c.cycleLengthDays - medianCycle) * 10) / 10;
      if (diff >= 3.5) {
        cycleChanges.push({
          id: `obs-long-${c.id}`,
          type: 'cycle_length',
          severity: 'notice',
          title: `Extended Cycle (${c.cycleLengthDays} days)`,
          description: `The cycle of ${formatDisplayDate(c.startDate)} was ${Math.abs(diff)} days longer than your typical ${medianCycle}-day median.`,
          whyHighlighted: 'Temporary biological shifts (such as travel, stress, or illness) can lengthen follicular phases without signaling a permanent change.',
          cycleDate: c.startDate,
        });
      } else if (diff <= -3.5) {
        cycleChanges.push({
          id: `obs-short-${c.id}`,
          type: 'cycle_length',
          severity: 'notice',
          title: `Shorter Cycle (${c.cycleLengthDays} days)`,
          description: `The cycle of ${formatDisplayDate(c.startDate)} was ${Math.abs(diff)} days shorter than your typical ${medianCycle}-day median.`,
          whyHighlighted: 'Natural monthly fluctuations of several days are standard biological variations.',
          cycleDate: c.startDate,
        });
      }
    }
  });

  // Observation: Period Bleeding Duration Shifts (>= 2 days from average)
  sortedDesc.forEach((c) => {
    const diff = Math.round((c.periodDurationDays - avgPeriod) * 10) / 10;
    if (Math.abs(diff) >= 2.0) {
      cycleChanges.push({
        id: `obs-duration-${c.id}`,
        type: 'duration',
        severity: 'notice',
        title: `Bleeding Duration Shift (${c.periodDurationDays} days)`,
        description: `Recorded ${c.periodDurationDays} bleeding days in ${formatDisplayDate(c.startDate)}, compared to your ${avgPeriod}-day average.`,
        whyHighlighted: 'Menstrual flow duration frequently shifts by 1–2 days based on hydration, rest, and hormonal balance.',
        cycleDate: c.startDate,
      });
    }
  });

  // Observation: Recent Trend vs Earlier Records
  if (cycleLengths.length >= 4) {
    const recentVariance = Math.abs(cycleLengths[0] - cycleLengths[1]);
    const olderVariance = Math.abs(cycleLengths[2] - cycleLengths[3]);
    if (recentVariance < olderVariance && recentVariance <= 2) {
      cycleChanges.push({
        id: 'obs-variability-stabilizing',
        type: 'variability',
        severity: 'info',
        title: 'Timing Stabilizing',
        description: `Your last 2 recorded cycles (${cycleLengths[1]}d and ${cycleLengths[0]}d) show tighter regularity than earlier records.`,
        whyHighlighted: 'Consistent routines, improved rest, and stress reduction often produce more predictable cycle intervals.',
      });
    }
  }

  // ==========================================
  // 4. AUTOMATIC CYCLE SUMMARIES
  // ==========================================
  const automaticSummaries: string[] = [];

  // Summary 1: Cycle length stats
  if (sampleSize >= 2) {
    automaticSummaries.push(
      `Your last ${sampleSize} recorded cycles averaged ${meanCycle} days (median: ${medianCycle} days, range: ${minCycle}–${maxCycle} days).`
    );
  } else if (sampleSize === 1) {
    automaticSummaries.push(
      `1 cycle recorded so far (${cycleLengths[0]} days). Log your next period start date to calculate your running cycle average.`
    );
  } else {
    automaticSummaries.push(
      'Track your period dates to view mathematical cycle statistics calculated entirely on your device.'
    );
  }

  // Summary 2: Bleeding duration
  if (periodDurations.length > 0) {
    automaticSummaries.push(
      `Period bleeding duration has averaged ${avgPeriod} days across your recorded history.`
    );
  }

  // Summary 3: Cramp / symptom pattern
  if (crampCyclesSet.size > 0 && cycles.length > 0) {
    const daysStr = crampDaysSet.slice(0, 2).join(' and ');
    automaticSummaries.push(
      `Cramps were recorded during ${crampCyclesSet.size} of your ${cycles.length} tracked cycles${
        daysStr ? `, most commonly on Cycle Days ${daysStr}` : ''
      }.`
    );
  } else if (topSymptoms.length > 0) {
    automaticSummaries.push(
      `${topSymptoms[0].name} was your most frequently logged symptom, appearing in ${topSymptoms[0].percentage}% of your daily check-ins.`
    );
  }

  // Summary 4: Energy rhythm pattern
  if (totalLogs >= 3) {
    automaticSummaries.push(
      `Energy levels average highest during your ovulatory phase (${energyByPhase.ovulatory.toFixed(1)}/10) and lowest during menstrual days (${energyByPhase.menstrual.toFixed(1)}/10).`
    );
  }

  // Summary 5: Regularity & variability confidence
  if (sampleSize >= 2) {
    automaticSummaries.push(
      `Cycle regularity is rated ${regularityStatus} with an expected variation window of ±${confidenceMarginDays} days (${predictionConfidence}% prediction confidence).`
    );
  }

  return {
    weightedCycleLength: weightedCycle,
    averagePeriodLength: avgPeriod,
    meanCycleLength: meanCycle,
    medianCycleLength: medianCycle,
    minCycleLength: minCycle,
    maxCycleLength: maxCycle,
    medianPeriodLength: medianPeriod,
    standardDeviation: stdDev,
    confidenceMarginDays,
    predictionConfidencePercent: predictionConfidence,
    sampleSize,
    regularityStatus,
    trendDirection,
    estimatedWindowStart,
    estimatedWindowEnd,
    predictionStatus,
    predictionExplanation,
    symptomInsights,
    cycleChanges,
    automaticSummaries,
  };
}

export interface CycleStatus {
  currentCycleDay: number;
  totalCycleLength: number;
  phase: CyclePhase;
  phaseInfo: PhaseInfo;
  daysUntilNextPeriod: number;
  nextPeriodStartDate: string;
  nextPeriodEndDate: string;
  estimatedWindowStart: string;
  estimatedWindowEnd: string;
  estimatedOvulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  isPeriodActiveToday: boolean;
  cycleProgressPercent: number;
  analytics: CycleAnalytics;
}

export function calculateCycleStatus(
  todayStr: string,
  cycles: CycleRecord[],
  settings: {
    averageCycleLength: number;
    averagePeriodLength: number;
    lutealPhaseLength: number;
    lastPeriodStartDate?: string;
    calibrationMode?: 'analytics' | 'custom';
    customCycleLengthOverride?: number;
    customPeriodDurationOverride?: number;
    customLutealLengthOverride?: number;
  },
  logs: DailyLog[] = []
): CycleStatus {
  // Run statistical analytics with logs
  const analytics = computeCycleAnalytics(
    cycles,
    {
      calibrationMode: settings.calibrationMode,
      cycleOverride: settings.customCycleLengthOverride || settings.averageCycleLength,
      periodOverride: settings.customPeriodDurationOverride || settings.averagePeriodLength,
      lutealOverride: settings.customLutealLengthOverride || settings.lutealPhaseLength,
    },
    logs
  );

  const avgCycle = Math.round(analytics.weightedCycleLength);
  const avgPeriod = Math.round(analytics.averagePeriodLength);
  const lutealLen = settings.customLutealLengthOverride || settings.lutealPhaseLength || 14;

  const sortedCycles = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const latestCycle = sortedCycles[0];

  const hasAnchor = Boolean(latestCycle || settings.lastPeriodStartDate);
  const lastStart = latestCycle
    ? latestCycle.startDate
    : settings.lastPeriodStartDate || todayStr;
  const daysSinceLast = daysBetween(lastStart, todayStr);

  const cycleCount = Math.floor(Math.max(0, daysSinceLast) / avgCycle);
  const currentCycleStart = cycleCount > 0 ? addDays(lastStart, cycleCount * avgCycle) : lastStart;

  const currentCycleDay = hasAnchor ? Math.max(1, daysBetween(currentCycleStart, todayStr) + 1) : 1;
  const nextPeriodStartDate = hasAnchor ? addDays(currentCycleStart, avgCycle) : addDays(todayStr, avgCycle);
  const nextPeriodEndDate = addDays(nextPeriodStartDate, avgPeriod - 1);
  const daysUntilNextPeriod = Math.max(0, daysBetween(todayStr, nextPeriodStartDate));

  const marginDays = Math.max(1, Math.round(analytics.confidenceMarginDays));
  const estimatedWindowStart = addDays(nextPeriodStartDate, -marginDays);
  const estimatedWindowEnd = addDays(nextPeriodStartDate, marginDays);

  const estimatedOvulationDate = addDays(nextPeriodStartDate, -lutealLen);
  const fertileWindowStart = addDays(estimatedOvulationDate, -5);
  const fertileWindowEnd = addDays(estimatedOvulationDate, 1);

  let isPeriodActiveToday = false;
  if (latestCycle && todayStr >= latestCycle.startDate && todayStr <= latestCycle.endDate) {
    isPeriodActiveToday = true;
  } else if (!latestCycle && settings.lastPeriodStartDate) {
    const periodEnd = addDays(settings.lastPeriodStartDate, avgPeriod - 1);
    if (todayStr >= settings.lastPeriodStartDate && todayStr <= periodEnd) {
      isPeriodActiveToday = true;
    }
  }

  let phase: CyclePhase = 'menstrual';
  const ovDay = avgCycle - lutealLen;

  if (currentCycleDay <= avgPeriod) {
    phase = 'menstrual';
  } else if (currentCycleDay < ovDay - 1) {
    phase = 'follicular';
  } else if (currentCycleDay <= ovDay + 2) {
    phase = 'ovulatory';
  } else {
    phase = 'luteal';
  }

  const cycleProgressPercent = Math.min(100, Math.round((currentCycleDay / avgCycle) * 100));

  return {
    currentCycleDay,
    totalCycleLength: avgCycle,
    phase,
    phaseInfo: PHASE_DETAILS[phase],
    daysUntilNextPeriod,
    nextPeriodStartDate,
    nextPeriodEndDate,
    estimatedWindowStart,
    estimatedWindowEnd,
    estimatedOvulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    isPeriodActiveToday,
    cycleProgressPercent,
    analytics,
  };
}

export interface DayForecast {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  isToday: boolean;
  isRecordedPeriod: boolean;
  isPredictedPeriod: boolean;
  isEstimatedWindow: boolean;
  isOvulationDay: boolean;
  isFertileWindow: boolean;
  phase: CyclePhase;
  hasLog: boolean;
  log?: DailyLog;
}

export function getDayStatus(
  dateStr: string,
  todayStr: string,
  cycles: CycleRecord[],
  logs: DailyLog[],
  settings: {
    averageCycleLength: number;
    averagePeriodLength: number;
    lutealPhaseLength: number;
    confidenceMarginDays?: number;
    lastPeriodStartDate?: string;
  }
): DayForecast {
  const d = parseDateString(dateStr);
  const isToday = dateStr === todayStr;
  const dayNumber = d.getDate();
  const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'narrow' });

  const log = logs.find((l) => l.date === dateStr);
  const hasLog = Boolean(log);

  const isRecordedPeriod = cycles.some(
    (c) => dateStr >= c.startDate && dateStr <= c.endDate
  );

  const sortedCycles = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const hasCycleAnchor = sortedCycles.length > 0 || Boolean(settings.lastPeriodStartDate);
  const anchorDate = sortedCycles[0]?.startDate || settings.lastPeriodStartDate;

  const avgCycle = settings.averageCycleLength || 28;
  const avgPeriod = settings.averagePeriodLength || 5;
  const luteal = settings.lutealPhaseLength || 14;
  const marginDays = Math.max(1, Math.round(settings.confidenceMarginDays || 1.5));

  let isPredictedPeriod = false;
  let isEstimatedWindow = false;
  let isOvulationDay = false;
  let isFertileWindow = false;

  // Only calculate future predictions if the user has an anchor cycle or last period date
  if (hasCycleAnchor && anchorDate) {
    for (let i = 1; i <= 6; i++) {
      const predStart = addDays(anchorDate, i * avgCycle);
      const predEnd = addDays(predStart, avgPeriod - 1);
      const windowStart = addDays(predStart, -marginDays);
      const windowEnd = addDays(predStart, marginDays);

      const predOvulation = addDays(predStart, -luteal);
      const predFertileStart = addDays(predOvulation, -5);
      const predFertileEnd = addDays(predOvulation, 1);

      if (dateStr >= predStart && dateStr <= predEnd) {
        isPredictedPeriod = true;
      }
      if (dateStr >= windowStart && dateStr <= windowEnd) {
        isEstimatedWindow = true;
      }
      if (dateStr === predOvulation) {
        isOvulationDay = true;
      }
      if (dateStr >= predFertileStart && dateStr <= predFertileEnd) {
        isFertileWindow = true;
      }
    }
  }

  let phase: CyclePhase = 'follicular';
  if (isRecordedPeriod || isPredictedPeriod) {
    phase = 'menstrual';
  } else if (hasCycleAnchor && anchorDate) {
    const daysDiff = daysBetween(anchorDate, dateStr);
    const modDay = (((daysDiff % avgCycle) + avgCycle) % avgCycle) + 1;
    if (modDay <= avgPeriod) {
      phase = 'menstrual';
    } else if (modDay < avgCycle - luteal - 1) {
      phase = 'follicular';
    } else if (modDay <= avgCycle - luteal + 2) {
      phase = 'ovulatory';
    } else {
      phase = 'luteal';
    }
  }

  return {
    date: dateStr,
    dayNumber,
    dayOfWeek,
    isToday,
    isRecordedPeriod,
    isPredictedPeriod,
    isEstimatedWindow,
    isOvulationDay,
    isFertileWindow,
    phase,
    hasLog,
    log,
  };
}
