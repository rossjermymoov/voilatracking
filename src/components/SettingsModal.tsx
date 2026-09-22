import React, { useState, useEffect } from 'react';
import { ApiCredentials } from '@/types';
import { POPULAR_COURIERS } from '@/lib/constants';
import {
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: ApiCredentials;
  onSave: (creds: ApiCredentials) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSave,
}) => {
  const [form, setForm] = useState<ApiCredentials>(credentials);
  const [showToken, setShowToken] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [courierSearch, setCourierSearch] = useState('');
  const [customCourier, setCustomCourier] = useState(false);

  useEffect(() => {
    setForm(credentials);
    // If current default courier is not in predefined list, enable custom mode
    const isPredefined = POPULAR_COURIERS.some((c) => c.key === credentials.defaultCourier);
    if (credentials.defaultCourier && !isPredefined) {
      setCustomCourier(true);
    }
  }, [credentials, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!form.apiUser || !form.apiToken) {
      setTestingStatus('error');
      setTestMessage('Please enter both API User and API Token first.');
      return;
    }

    setTestingStatus('testing');
    setTestMessage('Connecting to HeyVoila API...');

    try {
      const res = await fetch('/api/couriers', {
        method: 'GET',
        headers: {
          'api-user': form.apiUser,
          'api-token': form.apiToken,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setTestingStatus('success');
        const courierCount = data.couriers?.length || 'Multiple';
        setTestMessage(`Successfully connected to HeyVoila! (${courierCount} couriers available)`);
      } else {
        setTestingStatus('error');
        setTestMessage(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setTestingStatus('error');
      setTestMessage(err.message || 'Network error while contacting proxy endpoint.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const filteredCouriers = POPULAR_COURIERS.filter(
    (c) =>
      c.name.toLowerCase().includes(courierSearch.toLowerCase()) ||
      c.key.toLowerCase().includes(courierSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">HeyVoila API Credentials</h3>
              <p className="text-xs text-slate-500">
                Credentials are stored locally in your browser and used for API calls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* API User */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                API User <span className="text-red-500">*</span>
              </label>
              <a
                href="https://app.heyvoila.io/controlpanel/apiusers"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 hover:underline inline-flex items-center space-x-1"
              >
                <span>Get from Voila Control Panel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              required
              value={form.apiUser}
              onChange={(e) => setForm({ ...form, apiUser: e.target.value })}
              placeholder="e.g. My Company Name (from users list)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The exact name field from your API Users list in the HeyVoila control panel.
            </p>
          </div>

          {/* API Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                API Token <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={form.apiToken}
                onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                placeholder="e.g. btsyjpzgarlicndo..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono placeholder:font-sans placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Generated in HeyVoila via <span className="italic">View Tokens</span>.
            </p>
          </div>

          {/* Auth Company */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Auth Company / Company Code
              </label>
              <span className="text-xs text-slate-400 font-normal">Optional</span>
            </div>
            <input
              type="text"
              value={form.authCompany}
              onChange={(e) => setForm({ ...form, authCompany: e.target.value })}
              placeholder="e.g. company"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Passed in the payload as <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">auth_company</code>.
            </p>
          </div>

          {/* Default Courier */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Default Courier Key
              </label>
              <button
                type="button"
                onClick={() => setCustomCourier(!customCourier)}
                className="text-xs text-brand-600 hover:underline"
              >
                {customCourier ? 'Select from list' : 'Enter custom key'}
              </button>
            </div>

            {customCourier ? (
              <input
                type="text"
                value={form.defaultCourier}
                onChange={(e) => setForm({ ...form, defaultCourier: e.target.value })}
                placeholder="e.g. AmazonShipping, DHL, RoyalMail..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
              />
            ) : (
              <select
                value={form.defaultCourier}
                onChange={(e) => setForm({ ...form, defaultCourier: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
              >
                <option value="">-- Select Default Courier --</option>
                {POPULAR_COURIERS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} ({c.key})
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              Used when a CSV row doesn't specify a courier column or has it blank.
            </p>
          </div>

          {/* Testing Mode Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-800">Sandbox / Testing Mode</span>
              <p className="text-xs text-slate-500">
                Sets <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">testing: true</code> in the API request.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isTesting}
                onChange={(e) => setForm({ ...form, isTesting: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </label>
          </div>

          {/* Test Connection Status Area */}
          {testingStatus !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
                testingStatus === 'testing'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : testingStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testingStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0 mt-0.5" />}
              {testingStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {testingStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <div>
                <span className="font-semibold block">
                  {testingStatus === 'testing'
                    ? 'Testing Connection...'
                    : testingStatus === 'success'
                    ? 'Connection Verified'
                    : 'Connection Error'}
                </span>
                <span className="text-[11px] opacity-90">{testMessage}</span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingStatus === 'testing'}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300 flex items-center space-x-1.5"
            >
              {testingStatus === 'testing' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>Test Connection</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
