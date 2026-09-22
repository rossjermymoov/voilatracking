export interface ApiCredentials {
  apiUser: string;
  apiToken: string;
  authCompany: string;
  defaultCourier: string;
  isTesting: boolean;
}

export interface VoilaShipTo {
  name?: string;
  phone?: string;
  email?: string;
  company_name?: string;
  address_1?: string;
  address_2?: string;
  address_3?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country_iso?: string;
}

export interface VoilaCourierSpecifics {
  shipment_ids?: string[];
  [key: string]: any;
}

export interface VoilaShipment {
  collection_date?: string;
  reference?: string;
  reference_2?: string;
  ship_to?: VoilaShipTo;
  courier_specifics?: VoilaCourierSpecifics;
  tracking_codes: string[];
}

export interface VoilaQueueTrackingPayload {
  testing: boolean;
  auth_company: string;
  shipment: VoilaShipment;
  request_id?: number | string;
}

export interface VoilaQueueTrackingSuccessResponse {
  tracking_request_id?: number;
  tracking_request_hash?: number;
  shipment_id?: number;
  [key: string]: any;
}

export type HeyVoilaFieldKey =
  | 'tracking_codes'
  | 'courier_key'
  | 'request_id'
  | 'reference'
  | 'reference_2'
  | 'collection_date'
  | 'ship_to_name'
  | 'ship_to_phone'
  | 'ship_to_email'
  | 'ship_to_company_name'
  | 'ship_to_address_1'
  | 'ship_to_address_2'
  | 'ship_to_address_3'
  | 'ship_to_city'
  | 'ship_to_county'
  | 'ship_to_postcode'
  | 'ship_to_country_iso'
  | 'courier_specific_shipment_ids';

export interface FieldDefinition {
  key: HeyVoilaFieldKey;
  label: string;
  section: 'Required / Tracking' | 'Recipient (Ship To)' | 'Shipment Info' | 'Courier Specifics';
  required?: boolean;
  description: string;
  example: string;
  aliases: string[];
}

export interface FieldMappingConfig {
  mappings: Record<HeyVoilaFieldKey, string>; // HeyVoilaFieldKey -> CSV column header name (or empty if unmapped)
  fallbacks: Record<HeyVoilaFieldKey, string>; // HeyVoilaFieldKey -> constant fallback value if empty in CSV
  delimiter?: string; // delimiter for comma/semicolon separated tracking codes
}

export interface MappingPreset {
  id: string;
  name: string;
  mappings: Record<HeyVoilaFieldKey, string>;
  fallbacks: Record<HeyVoilaFieldKey, string>;
  defaultCourier?: string;
}

export interface ProcessedRowResult {
  rowIndex: number;
  originalRow: Record<string, string>;
  courierKey: string;
  payload: VoilaQueueTrackingPayload;
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped';
  httpStatus?: number;
  response?: any;
  errorMessage?: string;
  timestamp?: string;
}

export interface CourierOption {
  key: string;
  name: string;
  logo?: string;
  status?: string;
}
