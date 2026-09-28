import React, { useState } from 'react';
import {
  FieldMappingConfig,
  HeyVoilaFieldKey,
  MappingPreset,
  ApiCredentials,
} from '@/types';
import { HEYVOILA_FIELDS } from '@/lib/constants';
import { autoDetectMappings } from '@/lib/mapper';
import {
  Wand2,
  BookmarkPlus,
  Save,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  HelpCircle,
  FolderOpen,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface FieldMapperProps {
  csvHeaders: string[];
  sampleRow?: Record<string, string>;
  mappingConfig: FieldMappingConfig;
  onChangeMapping: (config: FieldMappingConfig) => void;
  presets: MappingPreset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: MappingPreset) => void;
  onDeletePreset: (id: string) => void;
  onOpenPreview: () => void;
  onProceedToReview: () => void;
  onBackToUpload: () => void;
  credentials: ApiCredentials;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  csvHeaders,
  sampleRow = {},
  mappingConfig,
  onChangeMapping,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onOpenPreview,
  onProceedToReview,
  onBackToUpload,
  credentials,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<string>('all');

  const sections = [
    { id: 'all', label: 'All Fields' },
    { id: 'Required / Tracking', label: 'Mandatory / Tracking' },
    { id: 'Recipient (Ship To)', label: 'Recipient (Ship To)' },
    { id: 'Shipment Info', label: 'Order / Shipment Details' },
    { id: 'Courier Specifics', label: 'Courier Specifics' },
  ];

  const handleAutoMap = () => {
    const detected = autoDetectMappings(csvHeaders);
    onChangeMapping({
      ...mappingConfig,
      mappings: detected.mappings,
      fallbacks: { ...mappingConfig.fallbacks, ...detected.fallbacks },
    });
  };

  const handleHeaderChange = (key: HeyVoilaFieldKey, value: string) => {
    onChangeMapping({
      ...mappingConfig,
      mappings: {
        ...mappingConfig.mappings,
        [key]: value,
      },
    });
  };

  const handleFallbackChange = (key: HeyVoilaFieldKey, value: string) => {
    onChangeMapping({
      ...mappingConfig,
      fallbacks: {
        ...mappingConfig.fallbacks,
        [key]: value,
      },
    });
  };

  const handleDelimiterChange = (value: string) => {
    onChangeMapping({
      ...mappingConfig,
      delimiter: value,
    });
  };

  const handleSaveCurrentPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  // Check required fields
  const hasTrackingMapped =
    Boolean(mappingConfig.mappings['tracking_codes']) ||
    Boolean(mappingConfig.fallbacks['tracking_codes']);

  const filteredFields =
    activeTabSection === 'all'
      ? HEYVOILA_FIELDS
      : HEYVOILA_FIELDS.filter((f) => f.section === activeTabSection);

  const mappedCount = Object.values(mappingConfig.mappings).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Informational Header Card */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 p-6 rounded-2xl border border-orange-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>Map Any CSV to HeyVoila Queue Tracking</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-bold">
                {mappedCount} of {HEYVOILA_FIELDS.length} Fields Mapped
              </span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              You can upload any CSV file structure. Only <strong>Tracking Code(s)</strong> is mandatory.
              All other fields (recipient address, customer info, order reference) are optional and enrich the tracking event.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleAutoMap}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-brand-500/20"
            >
              <Wand2 className="w-4 h-4" />
              <span>Smart Auto-Map Headers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates / Presets Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <FolderOpen className="w-4 h-4 text-brand-500" />
            <span>Saved Mapping Templates</span>
            <span className="text-slate-400 font-normal">({presets.length} saved)</span>
          </div>

          {/* Quick save template form */}
          <form onSubmit={handleSaveCurrentPreset} className="flex items-center space-x-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Save current mapping as template (e.g. Shopify)..."
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              disabled={!newPresetName.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center space-x-1 transition-all shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Template</span>
            </button>
          </form>
        </div>

        {/* Preset chips */}
        {presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">Apply Template:</span>
            {presets.map((p) => (
              <div
                key={p.id}
                className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onLoadPreset(p)}
                  className="px-2.5 py-1 font-semibold hover:bg-orange-100 hover:text-brand-800 transition-colors"
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePreset(p.id)}
                  className="px-1.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-l border-slate-200 transition-colors"
                  title="Delete Template"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showSaveSuccess && (
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-medium flex items-center space-x-1.5 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mapping template saved successfully! You can reuse it anytime.</span>
          </div>
        )}
      </div>

      {/* Warning if tracking code is not mapped */}
      {!hasTrackingMapped && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Tracking Code mapping is required</span>
            <span>
              Please select which CSV column contains your parcel/shipment tracking number (under <strong>Mandatory / Tracking</strong> below).
            </span>
          </div>
        </div>
      )}

      {/* Field Category Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveTabSection(sec.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTabSection === sec.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Mapping Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-12 sm:col-span-4">HeyVoila API Field & Description</div>
          <div className="col-span-12 sm:col-span-4">Your CSV Column Header</div>
          <div className="col-span-12 sm:col-span-4">Default Fallback / Fixed Value</div>
        </div>

        {/* Rows */}
        {filteredFields.map((field) => {
          const selectedHeader = mappingConfig.mappings[field.key] || '';
          const fallbackValue = mappingConfig.fallbacks[field.key] || '';
          const isMapped = Boolean(selectedHeader);
          const sampleValue = selectedHeader && sampleRow[selectedHeader] ? sampleRow[selectedHeader] : null;

          return (
            <div
              key={field.key}
              className={`grid grid-cols-12 gap-3 px-5 py-4 items-center transition-colors ${
                field.required
                  ? 'bg-orange-50/30'
                  : isMapped
                  ? 'bg-slate-50/50'
                  : 'hover:bg-slate-50/40'
              }`}
            >
              {/* Field Info */}
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{field.label}</span>
                  {field.required ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 uppercase">
                      Required
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{field.description}</p>
                <span className="text-[10px] font-mono text-slate-400 block">
                  e.g. {field.example}
                </span>
              </div>

              {/* CSV Header Dropdown */}
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <select
                  value={selectedHeader}
                  onChange={(e) => handleHeaderChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                    isMapped
                      ? 'border-brand-400 bg-brand-50/30 text-brand-950 font-semibold'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <option value="">-- Do not map (Ignore) --</option>
                  {csvHeaders.map((header) => {
                    const rowVal = sampleRow[header] ? ` ("${sampleRow[header]}")` : '';
                    return (
                      <option key={header} value={header}>
                        {header} {rowVal}
                      </option>
                    );
                  })}
                </select>

                {sampleValue && (
                  <span className="text-[10px] text-brand-700 block truncate font-mono">
                    Row 1 value: &quot;{sampleValue}&quot;
                  </span>
                )}
              </div>

              {/* Fallback / Static Input */}
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <input
                  type="text"
                  value={fallbackValue}
                  onChange={(e) => handleFallbackChange(field.key, e.target.value)}
                  placeholder={
                    field.key === 'courier_key'
                      ? `Default (${credentials.defaultCourier || 'AmazonShipping'})`
                      : 'Fixed value if empty in CSV...'
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Used if CSV column is blank or unmapped
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-tracking Delimiter Selector */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-700">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Tracking Code Separator (for multi-parcel rows):</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={mappingConfig.delimiter || ','}
            onChange={(e) => handleDelimiterChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-semibold"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value=" ">Space ( )</option>
          </select>
          <span className="text-[11px] text-slate-500">
            If a single row has multiple tracking numbers (e.g. 12345, 67890)
          </span>
        </div>
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBackToUpload}
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Upload Another CSV</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview JSON Payload</span>
          </button>

          <button
            type="button"
            disabled={!hasTrackingMapped}
            onClick={onProceedToReview}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md ${
              hasTrackingMapped
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Proceed to Review & Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
