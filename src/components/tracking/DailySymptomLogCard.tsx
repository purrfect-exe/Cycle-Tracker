import React, { useState, useEffect } from 'react';
import { useCycle } from '../../context/CycleContext';
import { DailyLog, FlowLevel, CrampLevel, EnergyLabel, CycleRecord, SleepQuality, AppetiteLevel } from '../../types/cycle';
import {
  Calendar,
  Smile,
  Zap,
  Droplet,
  Activity,
  FileText,
  Check,
  ChevronRight,
  Moon,
  Utensils,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ModalSelectDropdown, ModalSelectOption } from '../common/ModalSelectDropdown';

interface DailySymptomLogCardProps {
  initialDate?: string;
  onSaved?: () => void;
}

export const DailySymptomLogCard: React.FC<DailySymptomLogCardProps> = ({
  initialDate,
  onSaved,
}) => {
  const { currentDate, logs, saveDailyLog, cycles, removePeriodForDate } = useCycle();

  const activeDate = initialDate || currentDate;
  const existingLog = logs.find((l: DailyLog) => l.date === activeDate);

  const isPeriodDay = cycles.some(
    (c: CycleRecord) => activeDate >= c.startDate && activeDate <= c.endDate
  );

  const [flow, setFlow] = useState<FlowLevel>('none');
  const [cramps, setCramps] = useState<CrampLevel>('none');
  const [crampLocations, setCrampLocations] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [moods, setMoods] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [sleep, setSleep] = useState<SleepQuality | undefined>(undefined);
  const [appetite, setAppetite] = useState<AppetiteLevel | undefined>(undefined);
  const [customNote, setCustomNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (existingLog) {
      setFlow(existingLog.flow || 'none');
      setCramps(existingLog.cramps || 'none');
      setCrampLocations(existingLog.crampLocations || []);
      setEnergyLevel(existingLog.energyLevel || 7);
      setMoods(existingLog.moods || []);
      setSymptoms(existingLog.symptoms || []);
      setSleep(existingLog.sleep);
      setAppetite(existingLog.appetite);
      setCustomNote(existingLog.customNote || '');
    } else {
      setFlow(isPeriodDay ? 'medium' : 'none');
      setCramps('none');
      setCrampLocations([]);
      setEnergyLevel(7);
      setMoods(['Calm']);
      setSymptoms([]);
      setSleep(undefined);
      setAppetite(undefined);
      setCustomNote('');
    }
  }, [existingLog, activeDate, isPeriodDay]);

  const getEnergyLabel = (val: number): { label: EnergyLabel; subtitle: string; color: string } => {
    if (val <= 2) return { label: 'Exhausted', subtitle: 'Deep rest needed', color: '#6D887C' };
    if (val <= 4) return { label: 'Low', subtitle: 'Gentle, calm pace', color: '#526A5E' };
    if (val <= 6) return { label: 'Balanced', subtitle: 'Steady, grounded rhythm', color: '#3B8A68' };
    if (val <= 8) return { label: 'High', subtitle: 'Vibrant stamina & stamina', color: '#2D6A4F' };
    return { label: 'High', subtitle: 'Peak vitality & energy', color: '#1B3B2B' };
  };

  const energyInfo = getEnergyLabel(energyLevel);

  const toggleItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSave = () => {
    const updatedLog: DailyLog = {
      id: existingLog?.id || `user_log_${activeDate}_${Date.now()}`,
      date: activeDate,
      flow,
      cramps,
      crampLocations,
      energyLevel,
      energyLabel: energyInfo.label,
      moods,
      symptoms,
      sleep,
      appetite,
      customNote: customNote.trim() ? customNote.trim() : undefined,
      updatedAt: new Date().toISOString(),
    };

    saveDailyLog(updatedLog);
    setSavedSuccess(true);
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#2D6A4F', '#52B788', '#C78B30'],
    });

    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
    }, 1200);
  };

  const handleEnergyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setEnergyLevel(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return;

    if (parsed > 10) {
      setEnergyLevel(10);
    } else if (parsed < 0) {
      setEnergyLevel(0);
    } else {
      setEnergyLevel(parsed);
    }
  };

  const flowOptions: ModalSelectOption<FlowLevel>[] = [
    { id: 'none', label: 'None' },
    { id: 'spotting', label: 'Spotting' },
    { id: 'light', label: 'Light' },
    { id: 'medium', label: 'Medium' },
    { id: 'heavy', label: 'Heavy' },
  ];

  const crampOptions: ModalSelectOption<CrampLevel>[] = [
    { id: 'none', label: 'None' },
    { id: 'mild', label: 'Mild' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'severe', label: 'Severe' },
  ];

  const sleepOptions: ModalSelectOption<SleepQuality>[] = [
    { id: 'poor', label: 'Poor' },
    { id: 'fair', label: 'Fair' },
    { id: 'good', label: 'Good' },
    { id: 'excellent', label: 'Excellent' },
  ];

  const appetiteOptions: ModalSelectOption<AppetiteLevel>[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'unable_to_eat', label: 'Unable to Eat' },
    { id: 'difficulty_eating', label: 'Difficulty Eating' },
  ];

  const commonMoods = [
    'Calm',
    'Happy',
    'Loving',
    'Energetic',
    'Sensitive',
    'Anxious',
    'Irritable',
    'Stressed',
    'Tired',
  ];

  const commonSymptoms = [
    'Bloating',
    'Dizzy',
    'Nausea',
    'Glowing Skin',
    'Skin Breakouts',
    'Cravings (Sweet)',
    'Cravings (Spicy)',
    'Food Taste/Smell', 
    'Headache',
    'Back Tension',
    'Chills',
    'Hot Flashes',
    'Leg Pain',
    'Thigh Pain'
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DFECE5] shadow-xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAF2ED]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2D6A4F]" />
          <span className="text-xs font-bold text-[#1B3B2B] uppercase tracking-wider">
            Check-in for Today
          </span>
        </div>
      </div>

      {/* 1. Dropdown Symptoms (2-Column Grid for optimal space usage) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Column 1: Menstrual Flow */}
        <div className="space-y-1.5">
          <ModalSelectDropdown<FlowLevel>
            label="Menstrual Flow"
            icon={<Droplet className="w-3.5 h-3.5 text-[#C2635B]" />}
            value={flow}
            options={flowOptions}
            onChange={(val) => setFlow(val)}
            modalTitle="Select Menstrual Flow"
          />

          {/* Active Period Day Banner & Quick Removal */}
          {isPeriodDay && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 animate-fade-in">
              <span className="text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                Active period day
              </span>
              <button
                type="button"
                onClick={() => {
                  removePeriodForDate(activeDate);
                  setFlow('none');
                }}
                className="px-2 py-0.5 rounded-md bg-white border border-rose-300 font-bold text-[10px] text-rose-700 hover:bg-rose-100 transition-colors touch-manipulation active:scale-[0.98]"
                title="Remove period for this day if bleeding or cramps stopped"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Column 2: Cramps */}
        <div className="space-y-1.5">
          <ModalSelectDropdown<CrampLevel>
            label="Cramps"
            icon={<Activity className="w-3.5 h-3.5 text-[#8C3831]" />}
            value={cramps}
            options={crampOptions}
            onChange={(val) => setCramps(val)}
            modalTitle="Select Cramps"
          />
        </div>

        {/* Column 3: Sleep */}
        <div className="space-y-1.5">
          <ModalSelectDropdown<SleepQuality>
            label="Sleep"
            icon={<Moon className="w-3.5 h-3.5 text-indigo-500" />}
            value={sleep}
            options={sleepOptions}
            onChange={(val) => setSleep(val)}
            placeholder="Select sleep"
            modalTitle="Select Sleep"
          />
        </div>

        {/* Column 4: Appetite */}
        <div className="space-y-1.5">
          <ModalSelectDropdown<AppetiteLevel>
            label="Appetite"
            icon={<Utensils className="w-3.5 h-3.5 text-emerald-600" />}
            value={appetite}
            options={appetiteOptions}
            onChange={(val) => setAppetite(val)}
            placeholder="Select appetite"
            modalTitle="Select Appetite"
          />
        </div>
      </div>

      {/* Cramp Locations (if cramps are present) */}
      {cramps !== 'none' && (
        <div className="p-2.5 rounded-xl bg-[#FAFBF9] border border-[#DFECE5] space-y-1.5 animate-fade-in">
          <span className="text-[10px] font-bold text-[#6D887C] uppercase tracking-wider block">
            Cramp Locations (Optional)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'lower_abdomen', label: 'Lower Abdomen' },
              { id: 'lower_back', label: 'Lower Back' },
              { id: 'pelvis', label: 'Pelvis / Hips' },
              { id: 'headache', label: 'Headache' },
            ].map((loc) => {
              const isChecked = crampLocations.includes(loc.id);
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => toggleItem(crampLocations, loc.id, setCrampLocations)}
                  className={`text-xs px-2 py-1.5 rounded-lg border text-center transition-all touch-manipulation active:scale-[0.98] ${
                    isChecked
                      ? 'bg-[#E8F5EE] border-[#2D6A4F] text-[#1B3B2B] font-bold'
                      : 'bg-white border-[#DFECE5] text-[#526A5E] hover:bg-[#FAFBF9]'
                  }`}
                >
                  {isChecked ? '✓ ' : ''}{loc.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Energy & Stamina - Simple, Clean UI */}
      <div className="p-3 rounded-xl bg-[#FAFBF9] border border-[#DFECE5] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] text-[#2D6A4F] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#1B3B2B] block truncate">
              Energy & Stamina
            </span>
            <span className="text-[11px] text-[#526A5E] truncate block">
              {energyInfo.label} · {energyInfo.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setEnergyLevel((prev) => Math.max(0, prev - 1))}
            className="w-8 h-8 rounded-lg bg-white border border-[#DFECE5] text-[#526A5E] hover:bg-[#EAF2ED] hover:text-[#1B3B2B] flex items-center justify-center font-bold text-sm transition-colors touch-manipulation active:scale-95"
            aria-label="Decrease energy"
          >
            −
          </button>

          <div className="relative">
            <input
              type="number"
              min="0"
              max="10"
              value={energyLevel === 0 ? '' : energyLevel}
              onChange={handleEnergyChange}
              placeholder="0"
              className="w-12 h-8 text-center font-bold text-sm bg-white border border-[#DFECE5] rounded-lg text-[#1B3B2B] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] tabular-nums"
            />
          </div>

          <button
            type="button"
            onClick={() => setEnergyLevel((prev) => Math.min(10, prev + 1))}
            className="w-8 h-8 rounded-lg bg-white border border-[#DFECE5] text-[#526A5E] hover:bg-[#EAF2ED] hover:text-[#1B3B2B] flex items-center justify-center font-bold text-sm transition-colors touch-manipulation active:scale-95"
            aria-label="Increase energy"
          >
            +
          </button>

          <span className="text-xs font-bold text-[#6D887C] pl-1">/ 10</span>
        </div>
      </div>

      {/* 3. Mood & Emotion Vibe (Organized Grid: wraps automatically if more added) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>Emotions</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {commonMoods.map((m) => {
            const isSelected = moods.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleItem(moods, m, setMoods)}
                className={`text-xs px-2.5 py-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 min-h-[38px] touch-manipulation active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#E8F5EE] border-[#2D6A4F] text-[#1B3B2B] font-bold shadow-2xs'
                    : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#EAF2ED]'
                }`}
              >
                {isSelected && <span className="text-emerald-700 text-xs leading-none">✓</span>}
                <span className="truncate">{m}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Physical Sensations & Cravings (Organized Grid: wraps automatically if more added) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5">
          <Droplet className="w-3.5 h-3.5 text-[#C78B30]" />
          <span>Physical</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {commonSymptoms.map((s) => {
            const isSelected = symptoms.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleItem(symptoms, s, setSymptoms)}
                className={`text-xs px-2.5 py-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 min-h-[38px] touch-manipulation active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#FEF7EB] border-[#C78B30] text-[#7A5016] font-bold shadow-2xs'
                    : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#EAF2ED]'
                }`}
              >
                {isSelected && <span className="text-amber-700 text-xs leading-none">✓</span>}
                <span className="truncate">{s}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Custom Daily Note */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#526A5E]" />
          <span>Custom Note (Optional)</span>
        </label>
        <textarea
          rows={3}
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="How did your body feel today? Any special cravings, comfort wishes, or reflections..."
          className="w-full text-xs sm:text-sm p-3 bg-[#FAFBF9] border border-[#DFECE5] rounded-xl text-[#1B3B2B] placeholder-[#9FB3A8] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            <>
              <span>Save Today’s Check-in</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
