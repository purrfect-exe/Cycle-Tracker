import React, { useState } from 'react';
import { useCycle } from '../../context/CycleContext';
import { PHASE_DETAILS } from '../../utils/cycleCalculations';
import { CyclePhase } from '../../types/cycle';
import {
  Copy,
  Check,
  Edit2,
  RefreshCw,
  Unlink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateUniqueSecretCode } from '../../firebase/cycleService';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { NotificationSettingsCard } from './NotificationSettingsCard';

export const CoupleModeScreen: React.FC = () => {
  const {
    settings,
    cycleStatus,
    updateMaleNameInDb,
    updateFemaleProfileInDb,
    unlinkPartnerFromDb,
    userRole,
  } = useCycle();

  const isFemale = userRole === 'female';
  const isMale = userRole === 'male';

  const [copiedCode, setCopiedCode] = useState(false);
  const [editingPartnerName, setEditingPartnerName] = useState(false);
  const [partnerNameInput, setPartnerNameInput] = useState(settings.partnerName || 'Alex');
  const [isSavingPartnerName, setIsSavingPartnerName] = useState(false);
  const [nameSaveFeedback, setNameSaveFeedback] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<CyclePhase>(cycleStatus.phase);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const phaseList: CyclePhase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
  const activePhaseInfo = PHASE_DETAILS[selectedPhase];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(settings.secretCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      const newCode = await generateUniqueSecretCode();
      await updateFemaleProfileInDb({ secretCode: newCode });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSavePartnerName = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = partnerNameInput.trim();
    if (!clean) return;

    setIsSavingPartnerName(true);
    try {
      await updateMaleNameInDb(clean);
      setEditingPartnerName(false);
      setNameSaveFeedback(true);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2D6A4F', '#52B788', '#C78B30'],
      });
      setTimeout(() => setNameSaveFeedback(false), 2000);
    } catch (err) {
      console.error('Error updating male partner name:', err);
      setEditingPartnerName(false);
    } finally {
      setIsSavingPartnerName(false);
    }
  };

  const handleConfirmUnlink = async () => {
    setUnlinking(true);
    await unlinkPartnerFromDb();
    setUnlinking(false);
    setShowUnlinkModal(false);
  };

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      {/* Secret Code & Account Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Secret Code Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#DFECE5] shadow-xs space-y-3">
          <div className="text-xs font-bold text-[#1B3B2B] uppercase tracking-wider">
            Pairing Code
          </div>

          <div className="bg-[#F8FAF9] p-3 rounded-xl border border-[#DFECE5] flex items-center justify-between">
            <span className="font-mono text-2xl font-bold tracking-widest text-[#1B3B2B]">
              {settings.secretCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#DFECE5] text-[#2D6A4F] hover:bg-[#E8F5EE] transition-colors flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-xs text-[#526A5E]">
            Share this code with your partner!
          </p>

          {isFemale && (
            <button
              type="button"
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              className="text-xs text-[#2D6A4F] hover:underline font-semibold flex items-center gap-1 pt-1"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Code</span>
            </button>
          )}
        </div>

        {/* Name Card (Male edits his name; Female name is strictly read-only) */}
        <div className="bg-white rounded-2xl p-5 border border-[#DFECE5] shadow-xs space-y-3">
          <div className="text-xs font-bold text-[#1B3B2B] uppercase tracking-wider">
            {isMale ? 'Your Name (Editable)' : 'Connected Partner'}
          </div>

          {/* MALE VIEW: Editable Name */}
          {isMale ? (
            editingPartnerName ? (
              <form onSubmit={handleSavePartnerName} className="space-y-2">
                <input
                  type="text"
                  value={partnerNameInput}
                  onChange={(e) => setPartnerNameInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your name"
                  required
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingPartnerName}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors touch-manipulation active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSavingPartnerName ? 'Updating...' : 'Update Name'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPartnerName(false)}
                    className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
                    {settings.partnerName || 'Alex'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerNameInput(settings.partnerName || 'Alex');
                      setEditingPartnerName(true);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Name</span>
                  </button>
                </div>
                {nameSaveFeedback && (
                  <div className="text-xs font-bold text-emerald-600">✓ Name updated and saved to database!</div>
                )}
                <p className="text-[11px] text-slate-500">
                  You can change how your name appears to {settings.trackerName} anytime.
                </p>

                {settings.partnerConnected && (
                  <div className="pt-2.5 mt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Connected with <span className="font-bold text-slate-800">{settings.trackerName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUnlinkModal(true)}
                      disabled={unlinking}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <Unlink className="w-3 h-3" />
                      <span>Unlink Partner</span>
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* FEMALE VIEW: Female name cannot be edited; only partner name and unlink */
            <div className="space-y-2">
              <div className="bg-[#F8FAF9] p-3 rounded-xl border border-[#DFECE5] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#1B3B2B]">
                    {settings.partnerConnected ? settings.partnerName : 'No partner linked yet'}
                  </div>
                  <div className="text-[10px] text-[#6D887C]">
                    {settings.partnerConnected ? 'Connected Companion' : 'Share your pairing code to connect'}
                  </div>
                </div>

                {settings.partnerConnected && (
                  <button
                    type="button"
                    onClick={() => setShowUnlinkModal(true)}
                    disabled={unlinking}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Unlink</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#526A5E] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Your name ({settings.trackerName}) is verified from Google.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications Settings Card */}
      <NotificationSettingsCard />

      {/* Cycle Phase Guide:
          - FOR MALE: Direct concise info + TOP 3 SUGGESTIONS FOR EACH PHASE
          - FOR FEMALE: Direct cycle biological summary (Top 3 suggestions strictly hidden) */}
      <div className="bg-white rounded-2xl p-5 border border-[#DFECE5] shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#1B3B2B] uppercase tracking-wider">
            {isMale ? 'Guide for Each Cycle Phase' : 'Cycle Phases Guide'}
          </h2>
          <p className="text-xs text-[#526A5E] mt-0.5">
            {isMale
              ? `Select any phase to view concise information and your top 3 support suggestions for ${settings.trackerName}.`
              : 'Direct overview of what happens during each phase of your monthly cycle.'}
          </p>
        </div>

        {/* Phase Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {phaseList.map((phaseKey) => {
            const pInfo = PHASE_DETAILS[phaseKey];
            const isSelected = selectedPhase === phaseKey;
            const isCurrent = cycleStatus.phase === phaseKey;

            return (
              <button
                key={phaseKey}
                type="button"
                onClick={() => setSelectedPhase(phaseKey)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? isMale
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs'
                      : 'border-[#2D6A4F] bg-[#E8F5EE] shadow-2xs'
                    : isMale
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                    : 'border-[#DFECE5] bg-[#F8FAF9] hover:bg-[#EAF2ED]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{pInfo.title}</span>
                  {isCurrent && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        isMale
                          ? 'text-indigo-700 bg-white border-indigo-200'
                          : 'text-[#2D6A4F] bg-white border-[#C5E5D4]'
                      }`}
                    >
                      Current
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{pInfo.daySpan}</div>
              </button>
            );
          })}
        </div>

        {/* Phase Details Card */}
        <div
          className={`p-4 rounded-xl border space-y-4 text-xs leading-relaxed ${
            isMale ? 'bg-slate-50 border-slate-200' : 'bg-[#F8FAF9] border-[#E5EFE9]'
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2 ${
              isMale ? 'border-slate-200' : 'border-[#DFECE5]'
            }`}
          >
            <div>
              <span className="font-bold text-slate-900 text-sm">{activePhaseInfo.title}</span>
              <span className="text-xs text-slate-500 ml-2 font-medium">({activePhaseInfo.daySpan})</span>
            </div>
            <span className="text-xs font-medium text-slate-500">{activePhaseInfo.hormones}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className={`p-3.5 rounded-xl border space-y-1 ${
                isMale ? 'bg-white border-slate-200' : 'bg-white border-[#DFECE5]'
              }`}
            >
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                What She Experiences:
              </span>
              <p className="text-slate-700 leading-relaxed">{activePhaseInfo.trackerFeeling}</p>
            </div>

            <div
              className={`p-3.5 rounded-xl border space-y-1 ${
                isMale ? 'bg-white border-slate-200' : 'bg-white border-[#DFECE5]'
              }`}
            >
              <span
                className={`font-bold block text-xs uppercase tracking-wider ${
                  isMale ? 'text-indigo-600' : 'text-[#2D6A4F]'
                }`}
              >
                Support Summary:
              </span>
              <p className="text-slate-700 leading-relaxed">{activePhaseInfo.partnerSupportTip}</p>
            </div>
          </div>

          {/* MALE ONLY: Top 3 Suggestions for this Phase (STRICTLY HIDDEN FROM FEMALE) */}
          {isMale && (
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Top 3 Support Actions for This Phase:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {activePhaseInfo.topThreePartnerActions.map((action, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 border border-slate-700/80 p-3 rounded-xl flex items-start gap-2 text-slate-200 shadow-2xs"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs leading-snug font-medium text-slate-200">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Unlink */}
      <ConfirmDialog
        isOpen={showUnlinkModal}
        title="Unlink Partner?"
        message={
          isMale
            ? `Are you sure you want to disconnect from ${settings.trackerName || 'your partner'}? You can reconnect anytime with her secret pairing code.`
            : `Are you sure you want to disconnect ${settings.partnerName || 'your partner'}? You can generate a new pairing code anytime.`
        }
        confirmLabel="Unlink Partner"
        cancelLabel="Keep Connected"
        isDestructive={true}
        onConfirm={handleConfirmUnlink}
        onCancel={() => setShowUnlinkModal(false)}
      />
    </div>
  );
};
