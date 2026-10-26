import React, { useState } from 'react';
import { useCycle } from '../../context/CycleContext';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Users,
  Smile,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateUniqueSecretCode } from '../../firebase/cycleService';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { settings, updateFemaleProfileInDb } = useCycle();

  const [step, setStep] = useState<number>(1);
  const [name] = useState<string>(settings.trackerName || 'Emma');
  const [partnerName, setPartnerName] = useState<string>(settings.partnerName || 'Alex');
  const [lastPeriodDate, setLastPeriodDate] = useState<string>(settings.lastPeriodStartDate || '2026-10-11');
  const [cycleLength, setCycleLength] = useState<number>(settings.averageCycleLength || 29);
  const [periodDuration, setPeriodDuration] = useState<number>(settings.averagePeriodLength || 5);
  const [secretCode, setSecretCode] = useState<string>(settings.secretCode || '7#Kq');
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Walkthrough slide index for Step 3
  const [walkthroughIndex, setWalkthroughIndex] = useState(0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(secretCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    setIsRegeneratingCode(true);
    try {
      const newCode = await generateUniqueSecretCode();
      setSecretCode(newCode);
      await updateFemaleProfileInDb({ secretCode: newCode });
    } catch {
      // fallback
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const handleFinishOnboarding = async () => {
    await updateFemaleProfileInDb({
      displayName: name.trim() || 'Emma',
      partnerName: partnerName.trim() || 'Alex',
      averageCycleLength: Number(cycleLength),
      averagePeriodLength: Number(periodDuration),
      lastPeriodStartDate: lastPeriodDate,
      secretCode,
      onboardingCompleted: true,
    });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2D6A4F', '#52B788', '#C78B30'],
    });

    onComplete();
  };

  const walkthroughSlides = [
    {
      title: 'Your Cycle at a Glance',
      badge: 'Step 1 of 3 · Overview',
      icon: <Calendar className="w-8 h-8 text-[#2D6A4F]" />,
      description:
        'The Home screen displays your current cycle day, active phase, and a clear countdown to your next estimated period.',
      preview: (
        <div className="p-4 rounded-xl bg-[#E8F5EE] border border-[#C5E5D4] text-center space-y-1 my-2">
          <div className="text-[11px] font-bold text-[#2D6A4F] uppercase tracking-wider">Example Today</div>
          <div className="text-xl font-bold text-[#1B3B2B]">Cycle Day 14 · Ovulatory Peak</div>
          <div className="text-xs text-[#526A5E]">High natural energy & stamina</div>
        </div>
      ),
    },
    {
      title: '15-Second Daily Check-ins',
      badge: 'Step 2 of 3 · Tracking',
      icon: <Smile className="w-8 h-8 text-[#2D6A4F]" />,
      description:
        'Easily record flow, cramps, moods, and energy levels using an intuitive tactile slider without unnecessary questions.',
      preview: (
        <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DFECE5] space-y-2 my-2 text-xs">
          <div className="flex items-center justify-between font-bold text-[#1B3B2B]">
            <span>Energy Level: 8 / 10</span>
            <span className="text-[#2D6A4F]">High Vitality</span>
          </div>
          <div className="w-full bg-[#E5EFE9] h-2 rounded-full overflow-hidden">
            <div className="w-4/5 bg-[#2D6A4F] h-full rounded-full" />
          </div>
        </div>
      ),
    },
    {
      title: 'Intimate Companion Support',
      badge: 'Step 3 of 3 · Partner Care',
      icon: <Users className="w-8 h-8 text-[#2D6A4F]" />,
      description:
        'Your male partner connects using your 4-character secret code. He gets top 3 direct suggestions for each phase without clinical overwhelm.',
      preview: (
        <div className="p-3.5 rounded-xl bg-[#FEF7EB] border border-[#F5E2C4] text-xs text-[#7A5016] space-y-1 my-2">
          <span className="font-bold block">Partner Insight:</span>
          <span>"Emma is feeling energetic and radiant today. Great time for a special evening date!"</span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md border border-[#DFECE5] p-6 sm:p-8 space-y-6">
        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAF2ED]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E8F5EE] text-[#2D6A4F] flex items-center justify-center font-bold text-xs">
              {step}
            </div>
            <span className="text-xs font-bold text-[#1B3B2B] uppercase tracking-wider">
              {step === 1 && 'Basic Profiles'}
              {step === 2 && 'Cycle Timing'}
              {step === 3 && 'App Walkthrough'}
              {step === 4 && '4-Char Secret Code'}
            </span>
          </div>
          <span className="text-xs text-[#6D887C] font-medium">Step {step} of 4</span>
        </div>

        {/* STEP 1: Basic Profiles */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-[#1B3B2B]">
                Account Setup
              </h2>
              <p className="text-xs text-[#526A5E] mt-0.5">
                Review your profile details.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#526A5E] mb-1">
                  Your Account (Google Profile)
                </label>
                <div className="p-2.5 bg-[#F8FAF9] border border-[#DFECE5] rounded-xl text-xs font-bold text-[#1B3B2B] flex items-center justify-between">
                  <span>{name}</span>
                  <span className="text-[10px] text-[#6D887C] font-normal">Fixed (Google Account)</span>
                </div>
                <span className="text-[10px] text-[#6D887C] mt-1 block">
                  Female account name cannot be edited.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#526A5E] mb-1">
                  Partner's Display Name
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full text-xs p-2.5 bg-[#F8FAF9] border border-[#DFECE5] rounded-xl text-[#1B3B2B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  required
                />
                <span className="text-[10px] text-[#6D887C] mt-1 block">
                  Your male partner can edit his name anytime after connecting.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Continue to Cycle Timing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Cycle Setup */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-[#1B3B2B]">
                Your Cycle Rhythm
              </h2>
              <p className="text-xs text-[#526A5E] mt-0.5">
                Provide your usual cycle length and the first day of your most recent period.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#526A5E] mb-1">
                  Start Date of Last Period
                </label>
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#F8FAF9] border border-[#DFECE5] rounded-xl text-[#1B3B2B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#526A5E] mb-1">
                    Cycle Length (Days)
                  </label>
                  <input
                    type="number"
                    min="21"
                    max="45"
                    value={cycleLength}
                    onChange={(e) => setCycleLength(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#F8FAF9] border border-[#DFECE5] rounded-xl text-[#1B3B2B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    required
                  />
                  <span className="text-[10px] text-[#6D887C] mt-1 block">Usually ~28 days</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#526A5E] mb-1">
                    Period Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={periodDuration}
                    onChange={(e) => setPeriodDuration(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-[#F8FAF9] border border-[#DFECE5] rounded-xl text-[#1B3B2B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    required
                  />
                  <span className="text-[10px] text-[#6D887C] mt-1 block">Usually ~5 days</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 text-xs font-semibold text-[#526A5E] hover:text-[#1B3B2B] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Continue to Walkthrough</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Walkthrough */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-2.5 rounded-xl bg-[#E8F5EE] shadow-2xs">
                {walkthroughSlides[walkthroughIndex].icon}
              </div>
              <span className="text-[11px] font-bold text-[#2D6A4F] uppercase tracking-wider block">
                {walkthroughSlides[walkthroughIndex].badge}
              </span>
              <h2 className="text-xl font-bold text-[#1B3B2B]">
                {walkthroughSlides[walkthroughIndex].title}
              </h2>
              <p className="text-xs text-[#526A5E] leading-relaxed max-w-sm mx-auto">
                {walkthroughSlides[walkthroughIndex].description}
              </p>
            </div>

            {/* Visual Interactive Preview */}
            {walkthroughSlides[walkthroughIndex].preview}

            {/* Slider Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {walkthroughSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setWalkthroughIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    walkthroughIndex === idx ? 'w-5 bg-[#2D6A4F]' : 'w-1.5 bg-[#DFECE5]'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (walkthroughIndex > 0) {
                    setWalkthroughIndex(walkthroughIndex - 1);
                  } else {
                    setStep(2);
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#526A5E] hover:text-[#1B3B2B] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {walkthroughIndex < walkthroughSlides.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setWalkthroughIndex(walkthroughIndex + 1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Next Feature</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Get Partner Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: 4-Character Partner Code */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex p-2.5 rounded-xl bg-[#E8F5EE] text-[#2D6A4F] mb-1">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1B3B2B]">
                Your 4-Character Pairing Code
              </h2>
              <p className="text-xs text-[#526A5E] leading-relaxed">
                Share this exact 4-character code with {partnerName}. When he signs in under "Male Account", he enters this code to link with you.
              </p>
            </div>

            {/* Secret Code Card */}
            <div className="p-5 rounded-2xl bg-[#F8FAF9] border border-[#DFECE5] text-center space-y-3">
              <div className="text-[11px] font-bold text-[#6D887C] uppercase tracking-wider">
                Case-Sensitive 4-Char Code
              </div>

              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-[#1B3B2B] select-all py-1">
                {secretCode}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#DFECE5] text-[#2D6A4F] hover:bg-[#E8F5EE] transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={isRegeneratingCode}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-[#DFECE5] text-[#526A5E] hover:text-[#1B3B2B] transition-all flex items-center gap-1 shadow-2xs"
                  title="Generate a new unique 4-character code"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                  <span>New Code</span>
                </button>
              </div>

              <div className="text-[10px] text-[#6D887C] pt-2 border-t border-[#DFECE5]">
                Only 1 male partner can link to this code. Case-sensitive with letters, numbers, and symbols.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-3.5 py-2 text-xs font-semibold text-[#526A5E] hover:text-[#1B3B2B] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Walkthrough</span>
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Enter Cycle Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
