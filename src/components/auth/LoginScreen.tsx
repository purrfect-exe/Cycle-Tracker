import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Heart, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLoginFemale: () => Promise<void>;
  onLoginMaleWithCode: (code: string, maleName: string) => Promise<{ success: boolean; error?: string }>;
  onEnterSampleDemo: () => void;
  onPreviewRole?: (role: 'female' | 'male') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginFemale,
  onLoginMaleWithCode,
  onEnterSampleDemo,
  onPreviewRole,
}) => {
  const [selectedRole, setSelectedRole] = useState<'female' | 'male'>('female');
  const [partnerCode, setPartnerCode] = useState('');
  const [maleName, setMaleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFemaleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onLoginFemale();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMaleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = partnerCode.trim();
    if (!clean) {
      setErrorMsg('Please enter a 4-character pairing code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // =========================================================================
    // Enter 'XXXX' in the pairing code field to open the Female Demo Dashboard (Emma)
    // Enter 'XYXY' in the pairing code field to open the Male Demo Dashboard (Alex)
    // =========================================================================
    if (clean === 'XXXX') {
      if (onPreviewRole) onPreviewRole('female');
      else onEnterSampleDemo();
      setLoading(false);
      return;
    }
    if (clean === 'XYXY') {
      if (onPreviewRole) onPreviewRole('male');
      else onEnterSampleDemo();
      setLoading(false);
      return;
    }

    try {
      const res = await onLoginMaleWithCode(clean, maleName.trim() || 'Boy');
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid code. Please check with your partner.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Connection failed. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7FAF8] via-[#F4F8F5] to-[#EBF3EE] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Header (No Brand Name Focus) */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-[#2D6A4F] shadow-sm border border-[#DFECE5]">
            <Heart className="w-6 h-6 text-[#BC4F4F]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Cycle Companion
          </h1>
        </div>

        {/* Unified Clean Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
          {/* Role Segmented Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('female');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'female'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Female</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('male');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedRole === 'male'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Male</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-smooth-appear">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Female Sign In Tab */}
          {selectedRole === 'female' ? (
            <div className="space-y-4 pt-1">
              <div className="text-center space-y-1">
                <div className="text-xs font-bold text-slate-900">Sign in to track your cycle</div>
                <div className="text-[11px] text-slate-500">
                  Google sign-in securely stores your cycle history in your account.
                </div>
              </div>

              <button
                type="button"
                onClick={handleFemaleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] min-h-[44px]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>
          ) : (
            /* Male Sign In Tab with Code Input */
            <form onSubmit={handleMaleCodeSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Partner Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  placeholder="e.g. 7#KQ"
                  className="w-full text-center text-lg font-mono font-black p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
                <span className="text-[10px] text-slate-500 block mt-1 text-center">
                  Enter the 4-character code provided by your partner
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Name <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={maleName}
                  onChange={(e) => setMaleName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 min-h-[44px]"
              >
                <span>{loading ? 'Connecting...' : 'Connect to Partner'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
