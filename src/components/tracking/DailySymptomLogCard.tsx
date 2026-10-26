import React, { useState, useEffect } from 'react';
import { useCycle } from '../../context/CycleContext';
import { DailyLog, FlowLevel, CrampLevel, EnergyLabel, CycleRecord } from '../../types/cycle';
import { formatDisplayDate } from '../../utils/cycleCalculations';
import {
  Calendar,
  Sparkles,
  Smile,
  Zap,
  Droplet,
  FileText,
  Check,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailySymptomLogCardProps {
  initialDate?: string;
  isCompact?: boolean;
  onSaved?: () => void;
}

export const DailySymptomLogCard: React.FC<DailySymptomLogCardProps> = ({
  initialDate,
  isCompact = false,
  onSaved,
}) => {
  const { currentDate, logs, saveDailyLog, cycles } = useCycle();

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
      setCustomNote(existingLog.customNote || '');
    } else {
      setFlow(isPeriodDay ? 'medium' : 'none');
      setCramps('none');
      setCrampLocations([]);
      setEnergyLevel(7);
      setMoods(['Calm']);
      setSymptoms([]);
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

  const flowOptions: { id: FlowLevel; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'spotting', label: 'Spotting' },
    { id: 'light', label: 'Light' },
    { id: 'medium', label: 'Medium' },
    { id: 'heavy', label: 'Heavy' },
  ];

  const commonMoods = [
    'Calm',
    'Happy',
    'Loving',
    'Energetic',
    'Sensitive',
    'Anxious',
    'Irritable',
    'Tired',
  ];

  const commonSymptoms = [
    'Bloating',
    'Glowing Skin',
    'Skin Breakouts',
    'Cravings (Sweet)',
    'Cravings (Spicy)',
    'Headache',
    'Back Tension',
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

      {/* 1. Flow Level */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider">
          Menstrual Flow
        </label>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {flowOptions.map((opt) => {
            const isSelected = flow === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFlow(opt.id)}
                className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all flex flex-col items-center justify-center min-h-[46px] ${
                  isSelected
                    ? 'bg-[#C2635B] border-[#C2635B] text-white font-bold shadow-2xs'
                    : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#EAF2ED]'
                }`}
              >
                <span className="text-[11px] mt-0.5">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cramps Level */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider">
          Cramps
        </label>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {(['none', 'mild', 'moderate', 'severe'] as CrampLevel[]).map((lvl) => {
            const isSelected = cramps === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setCramps(lvl)}
                className={`py-2 px-1 rounded-xl text-xs font-medium border text-center capitalize transition-all min-h-[40px] ${
                  isSelected
                    ? 'bg-[#8C3831] border-[#8C3831] text-white font-bold shadow-2xs'
                    : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#EAF2ED]'
                }`}
              >
                {lvl === 'none' ? 'No Pain' : lvl}
              </button>
            );
          })}
        </div>

        {cramps !== 'none' && (
          <div className="flex flex-wrap gap-1.5 pt-1">
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
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
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
        )}
      </div>

      {/* 3. Intuitive Energy Slider */}
      <div className="space-y-2 p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E5EFE9]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Energy & Stamina</span>
          </label>
          <div className="text-right">
            <span className="text-xs font-bold text-[#1B3B2B] tabular-nums">
              {energyLevel} / 10
            </span>
            <span className="text-[11px] text-[#526A5E] block">
              {energyInfo.subtitle}
            </span>
          </div>
        </div>

        <div className="relative pt-1 pb-1">
          <input
            type="range"
            min="1"
            max="10"
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
            className="w-full h-2 bg-[#DFECE5] rounded-lg appearance-none cursor-pointer accent-[#2D6A4F]"
          />
          <div className="flex justify-between text-[10px] text-[#6D887C] pt-1 font-medium">
            <span>1 · Resting</span>
            <span>5 · Balanced</span>
            <span>10 · Radiant</span>
          </div>
        </div>
      </div>

      {/* 4. Mood Tap Selectors */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>Mood & Emotional Vibe</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {commonMoods.map((m) => {
            const isSelected = moods.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleItem(moods, m, setMoods)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#E8F5EE] border-[#2D6A4F] text-[#1B3B2B] font-bold shadow-2xs'
                    : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#EAF2ED]'
                }`}
              >
                {isSelected ? '✓ ' : ''}{m}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Physical Symptoms Tap Selectors */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5">
          <Droplet className="w-3.5 h-3.5 text-[#C78B30]" />
          <span>Physical Sensations & Cravings</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {commonSymptoms.map((s) => {
            const isSelected = symptoms.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleItem(symptoms, s, setSymptoms)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[#FEF7EB] border-[#C78B30] text-[#7A5016] font-bold shadow-2xs'
                    : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#EAF2ED]'
                }`}
              >
                {isSelected ? '✓ ' : ''}{s}
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
