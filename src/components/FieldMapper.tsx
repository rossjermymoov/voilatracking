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
} from 'lucide-react';

interface FieldMapperProps {
  csvHeaders: string[];
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
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<string>('all');

  const sections = [
    'all',
    'Required / Tracking',
    'Recipient (Ship To)',
    'Shipment Info',
    'Courier Specifics',
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
    setShowPresetModal(false);
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
      {/* Top Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Map CSV Columns to HeyVoila Fields</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">
              {mappedCount} of {HEYVOILA_FIELDS.length} mapped
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Match your CSV headers to the HeyVoila Queue Tracking API schema or specify default fallbacks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Smart Auto-Map */}
          <button
            type="button"
            onClick={handleAutoMap}
            className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-700 border border-orange-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Wand2 className="w-3.5 h-3.5 text-brand-500" />
            <span>Smart Auto-Map</span>
          </button>

          {/* Preset Manager Trigger */}
          <button
            type="button"
            onClick={() => setShowPresetModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Presets ({presets.length})</span>
          </button>

          {/* Live Preview Button */}
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview JSON Payload</span>
          </button>
        </div>
      </div>

      {/* Warning if tracking code is not mapped */}
      {!hasTrackingMapped && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block">Tracking Code mapping required</span>
            <span>
              You must map at least the <strong>Tracking Code(s)</strong> field to a CSV column in order to queue shipments.
            </span>
          </div>
        </div>
      )}

      {/* Section Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveTabSection(sec)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTabSection === sec
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {sec === 'all' ? 'All Fields' : sec}
          </button>
        ))}
      </div>

      {/* Mapping Cards Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-12 sm:col-span-4">HeyVoila API Target Field</div>
          <div className="col-span-12 sm:col-span-4">CSV Column Header</div>
          <div className="col-span-12 sm:col-span-4">Default Fallback / Static Value</div>
        </div>

        {/* Rows */}
        {filteredFields.map((field) => {
          const selectedHeader = mappingConfig.mappings[field.key] || '';
          const fallbackValue = mappingConfig.fallbacks[field.key] || '';
          const isMapped = Boolean(selectedHeader);

          return (
            <div
              key={field.key}
              className={`grid grid-cols-12 gap-3 px-5 py-4 items-center transition-colors ${
                isMapped ? 'bg-orange-50/20' : 'hover:bg-slate-50/60'
              }`}
            >
              {/* Field Info */}
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{field.label}</span>
                  {field.required && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{field.description}</p>
                <span className="text-[10px] font-mono text-slate-400 block">
                  e.g. {field.example}
                </span>
              </div>

              {/* CSV Header Dropdown */}
              <div className="col-span-12 sm:col-span-4">
                <div className="relative">
                  <select
                    value={selectedHeader}
                    onChange={(e) => handleHeaderChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                      isMapped
                        ? 'border-brand-300 bg-brand-50/40 text-brand-900 font-semibold'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <option value="">-- Select CSV Column (Unmapped) --</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        Column: {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fallback / Static Input */}
              <div className="col-span-12 sm:col-span-4">
                <input
                  type="text"
                  value={fallbackValue}
                  onChange={(e) => handleFallbackChange(field.key, e.target.value)}
                  placeholder={
                    field.key === 'courier_key'
                      ? `Default (${credentials.defaultCourier || 'AmazonShipping'})`
                      : 'Fixed fallback value...'
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Options Bar (Delimiter) */}
      <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-700">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span className="font-semibold">Multiple Tracking Numbers Delimiter:</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={mappingConfig.delimiter || ','}
            onChange={(e) => handleDelimiterChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="|">Pipe (|)</option>
            <option value=" ">Space ( )</option>
          </select>
          <span className="text-[11px] text-slate-500">
            For rows with bundled parcels (e.g. 123,456)
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
          <span>Back to Upload</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview Payloads</span>
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

      {/* Presets Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-brand-500" />
              <span>Mapping Templates & Presets</span>
            </h4>

            {/* Save current as new */}
            <form onSubmit={handleSaveCurrentPreset} className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Save Current Mapping as Preset</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Shopify Export, Amazon 3PL..."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 flex items-center space-x-1 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>

            {/* Existing Presets List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Saved Presets ({presets.length})</span>
              {presets.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No saved presets yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-800">{p.name}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            onLoadPreset(p);
                            setShowPresetModal(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-orange-100 text-brand-700 hover:bg-orange-200 text-xs font-semibold"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePreset(p.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
