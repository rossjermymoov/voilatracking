import { ApiCredentials, MappingPreset } from '@/types';

const STORAGE_KEYS = {
  CREDENTIALS: 'voila_api_credentials',
  MAPPING_PRESETS: 'voila_mapping_presets',
  ACTIVE_PRESET: 'voila_active_preset_id',
};

export const DEFAULT_CREDENTIALS: ApiCredentials = {
  apiUser: '',
  apiToken: '',
  authCompany: '',
  defaultCourier: 'AmazonShipping',
  isTesting: false,
};

export function loadCredentials(): ApiCredentials {
  if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!raw) return DEFAULT_CREDENTIALS;
    return { ...DEFAULT_CREDENTIALS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load credentials from storage', e);
    return DEFAULT_CREDENTIALS;
  }
}

export function saveCredentials(creds: ApiCredentials): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
  } catch (e) {
    console.error('Failed to save credentials to storage', e);
  }
}

export function loadPresets(): MappingPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAPPING_PRESETS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load presets', e);
    return [];
  }
}

export function savePreset(preset: MappingPreset): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadPresets();
    const index = existing.findIndex((p) => p.id === preset.id);
    if (index >= 0) {
      existing[index] = preset;
    } else {
      existing.push(preset);
    }
    localStorage.setItem(STORAGE_KEYS.MAPPING_PRESETS, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save preset', e);
  }
}

export function deletePreset(presetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadPresets().filter((p) => p.id !== presetId);
    localStorage.setItem(STORAGE_KEYS.MAPPING_PRESETS, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to delete preset', e);
  }
}
