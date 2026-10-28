export type FlowLevel = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type CrampLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type EnergyLabel = 'Exhausted' | 'Low' | 'Balanced' | 'High';
export type UserRole = 'female' | 'male';
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface CycleRecord {
  id: string;
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string;   // ISO date 'YYYY-MM-DD'
  cycleLengthDays?: number;
  periodDurationDays: number;
  notes?: string;
  isConfirmed: boolean;
  isSampleDemo?: boolean;
}

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type AppetiteLevel = 'normal' | 'unable_to_eat' | 'difficulty_eating';

export interface DailyLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  flow: FlowLevel;
  cramps: CrampLevel;
  crampLocations: string[]; // e.g. ['lower_abdomen', 'lower_back', 'headache']
  energyLevel: number; // 1 to 10 slider
  energyLabel: EnergyLabel;
  moods: string[]; // e.g. ['Calm', 'Happy', 'Sensitive', 'Anxious', 'Irritable', 'Loving']
  symptoms: string[]; // e.g. ['Bloating', 'Tender Breasts', 'Acne', 'Headache', 'Cravings']
  sleep?: SleepQuality;
  appetite?: AppetiteLevel;
  customNote?: string;
  updatedAt: string;
  isSampleDemo?: boolean;
}

export interface SymptomFrequencyItem {
  name: string;
  count: number;
  percentage: number;
  cyclesPresentCount: number;
  commonCycleDays: number[];
  commonPhase: CyclePhase;
}

export interface MoodFrequencyItem {
  mood: string;
  count: number;
  percentage: number;
}

export interface SymptomInsights {
  topSymptoms: SymptomFrequencyItem[];
  topMoods: MoodFrequencyItem[];
  energyByPhase: Record<CyclePhase, number>;
  flowBreakdown: {
    none: number;
    spotting: number;
    light: number;
    medium: number;
    heavy: number;
  };
  crampPrevalence: {
    cyclesWithCramps: number;
    totalCyclesAnalyzed: number;
    mostCommonDays: number[];
    commonLocations: string[];
  };
  phaseClusters: Array<{
    phase: CyclePhase;
    dominantSymptoms: string[];
    avgEnergy: number;
  }>;
  totalLogsAnalyzed: number;
}

export interface CycleObservation {
  id: string;
  type: 'cycle_length' | 'duration' | 'variability' | 'data_gap';
  severity: 'info' | 'notice';
  title: string;
  description: string;
  whyHighlighted: string;
  cycleDate?: string;
}

export interface CycleAnalytics {
  weightedCycleLength: number;
  averagePeriodLength: number;
  standardDeviation: number;
  confidenceMarginDays: number;
  predictionConfidencePercent: number;
  regularityStatus: string;
  trendDirection: 'stable' | 'lengthening' | 'shortening';

  // Enhanced smart prediction stats
  meanCycleLength: number;
  medianCycleLength: number;
  minCycleLength: number;
  maxCycleLength: number;
  medianPeriodLength: number;
  sampleSize: number;
  estimatedWindowStart: string;
  estimatedWindowEnd: string;
  predictionStatus: 'insufficient_data' | 'preliminary' | 'regular' | 'variable';
  predictionExplanation: string;

  // Personalized symptom insights
  symptomInsights: SymptomInsights;

  // Cycle change detection observations
  cycleChanges: CycleObservation[];

  // Automatic calculated factual summaries
  automaticSummaries: string[];
}

export interface UserSettings {
  trackerName: string; // Female name (Read-only for female, from Google account)
  partnerName: string; // Male partner name (Editable by male)
  averageCycleLength: number;
  averagePeriodLength: number;
  lutealPhaseLength: number;
  lastPeriodStartDate: string;
  secretCode: string;
  partnerConnected: boolean;
  activeRole: UserRole;
  femaleUid: string;
  // Female personalized cycle calibration
  calibrationMode: 'analytics' | 'custom';
  customCycleLengthOverride?: number;
  customPeriodDurationOverride?: number;
  customLutealLengthOverride?: number;
}
