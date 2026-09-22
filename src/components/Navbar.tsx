import React from 'react';
import { ApiCredentials } from '@/types';
import { KeyRound, ExternalLink, ShieldCheck, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface NavbarProps {
  creds: ApiCredentials;
  onOpenSettings: () => void;
  activeStep: number;
  onStepChange: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  creds,
  onOpenSettings,
  activeStep,
  onStepChange,
  canNavigateToStep,
}) => {
  const hasCredentials = Boolean(creds.apiUser && creds.apiToken);

  const steps = [
    { num: 1, label: '1. Upload CSV' },
    { num: 2, label: '2. Map Fields' },
    { num: 3, label: '3. Review & Queue' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  HeyVoila<span className="text-brand-500">.io</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                  Queue Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Bulk CSV Courier Tracking Ingestion
              </p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {steps.map((step) => {
              const isActive = activeStep === step.num;
              const isAllowed = canNavigateToStep(step.num);
              return (
                <button
                  key={step.num}
                  disabled={!isAllowed}
                  onClick={() => onStepChange(step.num)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : isAllowed
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      : 'text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons & Credentials Badge */}
          <div className="flex items-center space-x-3">
            <a
              href="https://api.heyvoila.io/#36c67498-1559-41e3-8fab-78cfcf0c8c4e"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700 hover:underline px-2 py-1"
            >
              <span>API Reference</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onOpenSettings}
              className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shadow-sm ${
                hasCredentials
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
              }`}
            >
              {hasCredentials ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              )}
              <span className="font-semibold">
                {hasCredentials ? creds.apiUser : 'Configure API Keys'}
              </span>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
