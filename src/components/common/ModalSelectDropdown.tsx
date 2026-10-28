import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface ModalSelectOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export interface ModalSelectDropdownProps<T extends string = string> {
  /** Field label displayed above the dropdown trigger */
  label: string;
  /** Currently selected option id */
  value?: T;
  /** Array of available options */
  options: ModalSelectOption<T>[];
  /** Callback triggered when a new option is selected */
  onChange: (val: T) => void;
  /** Optional icon to show beside the field label */
  icon?: React.ReactNode;
  /** Fallback placeholder if no option is selected */
  placeholder?: string;
  /** Title displayed in modal header */
  modalTitle?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional container styling */
  className?: string;
}

/**
 * Reusable dropdown component that opens a clean modal for selecting options.
 * Fits into a 2-column grid layout and is easily reusable for any symptom.
 */
export const ModalSelectDropdown = <T extends string = string>({
  label,
  value,
  options,
  onChange,
  icon,
  placeholder = 'Select option',
  modalTitle,
  disabled = false,
  className = '',
}: ModalSelectDropdownProps<T>): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close modal when pressing Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optionId: T) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Field Label */}
      <label className="text-xs font-bold text-[#526A5E] uppercase tracking-wider flex items-center gap-1.5 truncate">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </label>

      {/* Trigger Button that opens the Selection Modal */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="w-full text-left py-2.5 px-3 rounded-xl border border-[#DFECE5] bg-[#FAFBF9] hover:bg-[#F2F7F4] hover:border-[#C5E5D4] transition-all flex items-center justify-between gap-2 text-xs sm:text-sm shadow-2xs touch-manipulation active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none min-h-[42px]"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <span className="font-bold text-[#1B3B2B] truncate">
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-[#8FA59A] italic truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown className="w-4 h-4 text-[#526A5E] shrink-0" />
      </button>

      {/* Reusable Selection Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-sans"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-2xl p-4 sm:p-5 shadow-xl border border-[#DFECE5] space-y-3.5 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#EAF2ED]">
              <h3 className="text-sm font-bold text-[#1B3B2B] flex items-center gap-2">
                {icon && <span className="text-[#2D6A4F]">{icon}</span>}
                <span>{modalTitle || `Select ${label}`}</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#F8FAF9] border border-[#DFECE5] text-[#526A5E] hover:bg-[#EAF2ED] hover:text-[#1B3B2B] flex items-center justify-center transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Options List without distracting subtext */}
            <div className="space-y-1.5 overflow-y-auto pr-0.5">
              {options.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left py-2.5 px-3 rounded-xl border transition-all flex items-center justify-between gap-3 touch-manipulation active:scale-[0.99] ${
                      isSelected
                        ? 'bg-[#E8F5EE] border-[#2D6A4F] text-[#1B3B2B] shadow-2xs font-bold'
                        : 'bg-[#FAFBF9] border-[#DFECE5] text-[#2C3E35] hover:bg-[#F2F7F4] hover:border-[#C5E5D4]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#DFECE5] bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
