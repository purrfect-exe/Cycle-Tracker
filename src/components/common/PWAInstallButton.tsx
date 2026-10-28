import React, { useState } from 'react';
import { Download, Check, X, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed and running standalone, do not display install trigger
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await installApp();
      if (accepted) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else {
      // Show browser installation instructions for Chrome / Mobile
      setShowHelpModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] ${
          justInstalled
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-emerald-300 shadow-2xs'
        } ${className}`}
        title="Install app to your device for quick access"
      >
        {justInstalled ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Installed</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{variant === 'full' ? 'Install App (PWA)' : 'Install'}</span>
          </>
        )}
      </button>

      {/* Helpful Install Instructions Modal for Chrome & Mobile */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-sans"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Install Cycle Companion</h3>
                  <p className="text-[11px] text-slate-500">Fast, offline-ready Progressive Web App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <Monitor className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Google Chrome (Desktop):</span>
                  <span className="text-[11px] text-slate-600">
                    Click the <strong>Install</strong> icon in the address bar (right side) or open Chrome menu (⋮) → <em>"Install Cycle Companion..."</em>
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <Smartphone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Chrome on Android:</span>
                  <span className="text-[11px] text-slate-600">
                    Tap the <strong>⋮</strong> menu icon in Chrome and tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <Smartphone className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Safari on iOS:</span>
                  <span className="text-[11px] text-slate-600">
                    Tap the <strong>Share</strong> button (square with arrow) and select <strong>"Add to Home Screen"</strong>.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#2D6A4F] hover:bg-[#214E3A] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
