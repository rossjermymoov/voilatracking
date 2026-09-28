'use client';

import React, { useState, useEffect } from 'react';
import {
  ApiCredentials,
  FieldMappingConfig,
  HeyVoilaFieldKey,
  MappingPreset,
} from '@/types';
import {
  loadCredentials,
  saveCredentials,
  loadPresets,
  savePreset,
  deletePreset,
  DEFAULT_CREDENTIALS,
} from '@/lib/storage';
import { autoDetectMappings } from '@/lib/mapper';
import { HEYVOILA_FIELDS } from '@/lib/constants';

import { Navbar } from '@/components/Navbar';
import { SettingsModal } from '@/components/SettingsModal';
import { CsvUploader } from '@/components/CsvUploader';
import { FieldMapper } from '@/components/FieldMapper';
import { PayloadPreviewModal } from '@/components/PayloadPreviewModal';
import { BatchProcessor } from '@/components/BatchProcessor';

export default function Home() {
  const [credentials, setCredentials] = useState<ApiCredentials>(DEFAULT_CREDENTIALS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  // CSV Data State
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  // Mapping State
  const [mappingConfig, setMappingConfig] = useState<FieldMappingConfig>(() => {
    const initialMappings: Record<string, string> = {};
    const initialFallbacks: Record<string, string> = {};
    for (const f of HEYVOILA_FIELDS) {
      initialMappings[f.key] = '';
      initialFallbacks[f.key] = '';
    }
    return {
      mappings: initialMappings as Record<HeyVoilaFieldKey, string>,
      fallbacks: initialFallbacks as Record<HeyVoilaFieldKey, string>,
      delimiter: ',',
    };
  });

  // Presets State
  const [presets, setPresets] = useState<MappingPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Load credentials and presets on mount
  useEffect(() => {
    setCredentials(loadCredentials());
    setPresets(loadPresets());
  }, []);

  const handleSaveCredentials = (newCreds: ApiCredentials) => {
    setCredentials(newCreds);
    saveCredentials(newCreds);
  };

  const handleSelectPreset = (preset: MappingPreset | null) => {
    if (!preset) {
      setSelectedPresetId('');
      return;
    }
    setSelectedPresetId(preset.id);
    setMappingConfig((prev) => ({
      ...prev,
      fileLevelCourier: preset.fileLevelCourier || preset.defaultCourier || prev.fileLevelCourier || 'DPD',
      mappings: preset.mappings,
      fallbacks: preset.fallbacks,
    }));
  };

  const handleDataLoaded = (data: {
    fileName: string;
    headers: string[];
    rows: Record<string, string>[];
  }) => {
    setFileName(data.fileName);
    setHeaders(data.headers);
    setRows(data.rows);

    // If a preset is already selected, apply it, else auto-detect
    if (selectedPresetId) {
      const preset = presets.find((p) => p.id === selectedPresetId);
      if (preset) {
        setMappingConfig((prev) => ({
          ...prev,
          fileLevelCourier: preset.fileLevelCourier || preset.defaultCourier || prev.fileLevelCourier || 'DPD',
          mappings: preset.mappings,
          fallbacks: preset.fallbacks,
        }));
        return;
      }
    }

    // Run auto-mapping
    const detected = autoDetectMappings(data.headers);
    setMappingConfig((prev) => ({
      ...prev,
      mappings: detected.mappings,
      fallbacks: { ...prev.fallbacks, ...detected.fallbacks },
    }));
  };

  const handleSavePreset = (name: string) => {
    const newPreset: MappingPreset = {
      id: `preset_${Date.now()}`,
      name,
      fileLevelCourier: mappingConfig.fileLevelCourier || credentials.defaultCourier || 'DPD',
      mappings: mappingConfig.mappings,
      fallbacks: mappingConfig.fallbacks,
      defaultCourier: credentials.defaultCourier,
    };
    savePreset(newPreset);
    setPresets(loadPresets());
  };

  const handleLoadPreset = (preset: MappingPreset) => {
    setMappingConfig((prev) => ({
      ...prev,
      fileLevelCourier: preset.fileLevelCourier || preset.defaultCourier || prev.fileLevelCourier,
      mappings: preset.mappings,
      fallbacks: preset.fallbacks,
    }));
    if (preset.defaultCourier) {
      handleSaveCredentials({
        ...credentials,
        defaultCourier: preset.defaultCourier,
      });
    }
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    setPresets(loadPresets());
  };

  const canNavigateToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return rows.length > 0;
    if (step === 3) {
      const hasTracking =
        Boolean(mappingConfig.mappings['tracking_codes']) ||
        Boolean(mappingConfig.fallbacks['tracking_codes']);
      const hasCourier =
        Boolean(mappingConfig.fileLevelCourier) ||
        Boolean(mappingConfig.mappings['courier_key']) ||
        Boolean(mappingConfig.fallbacks['courier_key']) ||
        Boolean(credentials.defaultCourier);
      return rows.length > 0 && hasTracking && hasCourier;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        creds={credentials}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeStep={activeStep}
        onStepChange={(step) => setActiveStep(step)}
        canNavigateToStep={canNavigateToStep}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeStep === 1 && (
          <CsvUploader
            onDataLoaded={handleDataLoaded}
            currentFileName={fileName}
            totalRows={rows.length}
            onProceedToMapping={() => setActiveStep(2)}
            presets={presets}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
          />
        )}

        {activeStep === 2 && (
          <FieldMapper
            csvHeaders={headers}
            sampleRow={rows[0]}
            mappingConfig={mappingConfig}
            onChangeMapping={setMappingConfig}
            presets={presets}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onProceedToReview={() => setActiveStep(3)}
            onBackToUpload={() => setActiveStep(1)}
            credentials={credentials}
          />
        )}

        {activeStep === 3 && (
          <BatchProcessor
            rows={rows}
            csvHeaders={headers}
            mappingConfig={mappingConfig}
            credentials={credentials}
            onBackToMapping={() => setActiveStep(2)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        credentials={credentials}
        onSave={handleSaveCredentials}
      />

      <PayloadPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        rows={rows}
        mappingConfig={mappingConfig}
        credentials={credentials}
      />
    </div>
  );
}
