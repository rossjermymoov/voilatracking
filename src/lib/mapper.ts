import { HEYVOILA_FIELDS } from './constants';
import {
  ApiCredentials,
  FieldMappingConfig,
  HeyVoilaFieldKey,
  VoilaCourierSpecifics,
  VoilaQueueTrackingPayload,
  VoilaShipment,
  VoilaShipTo,
} from '@/types';

/**
 * Automatically detects the best mapping between CSV headers and HeyVoila field keys
 */
export function autoDetectMappings(csvHeaders: string[]): {
  mappings: Record<HeyVoilaFieldKey, string>;
  fallbacks: Record<HeyVoilaFieldKey, string>;
} {
  const mappings: Record<string, string> = {};
  const fallbacks: Record<string, string> = {};

  const clean = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const field of HEYVOILA_FIELDS) {
    fallbacks[field.key] = '';
    let matchedHeader = '';

    // 1. Exact match on field.key
    const exactMatch = csvHeaders.find((h) => clean(h) === clean(field.key));
    if (exactMatch) {
      matchedHeader = exactMatch;
    } else {
      // 2. Alias matches
      for (const alias of field.aliases) {
        const aliasClean = clean(alias);
        const match = csvHeaders.find((h) => {
          const hClean = clean(h);
          return hClean === aliasClean || hClean.includes(aliasClean) || aliasClean.includes(hClean);
        });
        if (match) {
          matchedHeader = match;
          break;
        }
      }
    }

    mappings[field.key] = matchedHeader || '';
  }

  return {
    mappings: mappings as Record<HeyVoilaFieldKey, string>,
    fallbacks: fallbacks as Record<HeyVoilaFieldKey, string>,
  };
}

/**
 * Gets the resolved value for a specific HeyVoila field from a CSV row or fallback
 */
export function getFieldValue(
  row: Record<string, string>,
  key: HeyVoilaFieldKey,
  config: FieldMappingConfig
): string {
  const header = config.mappings[key];
  if (header && row[header] !== undefined && row[header] !== null) {
    const val = String(row[header]).trim();
    if (val !== '') return val;
  }
  return (config.fallbacks[key] || '').trim();
}

/**
 * Extracts and parses tracking codes from a string (supports comma, semicolon, space, newline, pipe)
 */
export function parseTrackingCodes(raw: string, delimiter?: string): string[] {
  if (!raw) return [];
  if (delimiter && raw.includes(delimiter)) {
    return raw
      .split(delimiter)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Generic splitter
  return raw
    .split(/[,;\n\r|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Converts a CSV row and configuration into a HeyVoila Queue Tracking payload
 */
export function buildQueueTrackingPayload(
  row: Record<string, string>,
  config: FieldMappingConfig,
  creds: ApiCredentials
): {
  payload: VoilaQueueTrackingPayload;
  courierKey: string;
  errors: string[];
} {
  const errors: string[] = [];

  // Determine courier
  const rowCourier = getFieldValue(row, 'courier_key', config);
  const courierKey = rowCourier || creds.defaultCourier || 'AmazonShipping';

  if (!courierKey) {
    errors.push('No courier key specified for this row and no default courier set');
  }

  // Tracking codes
  const rawTracking = getFieldValue(row, 'tracking_codes', config);
  const trackingCodes = parseTrackingCodes(rawTracking, config.delimiter);

  if (trackingCodes.length === 0) {
    errors.push('Missing tracking code');
  }

  // Ship To object
  const shipTo: VoilaShipTo = {};
  const name = getFieldValue(row, 'ship_to_name', config);
  const phone = getFieldValue(row, 'ship_to_phone', config);
  const email = getFieldValue(row, 'ship_to_email', config);
  const companyName = getFieldValue(row, 'ship_to_company_name', config);
  const address1 = getFieldValue(row, 'ship_to_address_1', config);
  const address2 = getFieldValue(row, 'ship_to_address_2', config);
  const address3 = getFieldValue(row, 'ship_to_address_3', config);
  const city = getFieldValue(row, 'ship_to_city', config);
  const county = getFieldValue(row, 'ship_to_county', config);
  const postcode = getFieldValue(row, 'ship_to_postcode', config);
  let countryIso = getFieldValue(row, 'ship_to_country_iso', config);

  if (countryIso && countryIso.length > 2) {
    // If user passed full name like "United Kingdom", default or take first 2 chars
    countryIso = countryIso.slice(0, 2).toUpperCase();
  } else if (countryIso) {
    countryIso = countryIso.toUpperCase();
  }

  if (name) shipTo.name = name;
  if (phone) shipTo.phone = phone;
  if (email) shipTo.email = email;
  if (companyName) shipTo.company_name = companyName;
  if (address1) shipTo.address_1 = address1;
  if (address2) shipTo.address_2 = address2;
  if (address3) shipTo.address_3 = address3;
  if (city) shipTo.city = city;
  if (county) shipTo.county = county;
  if (postcode) shipTo.postcode = postcode;
  if (countryIso) shipTo.country_iso = countryIso;

  // Courier Specifics
  const courierSpecifics: VoilaCourierSpecifics = {};
  const rawShipmentIds = getFieldValue(row, 'courier_specific_shipment_ids', config);
  if (rawShipmentIds) {
    courierSpecifics.shipment_ids = parseTrackingCodes(rawShipmentIds);
  }

  // Shipment object
  const shipment: VoilaShipment = {
    tracking_codes: trackingCodes,
  };

  const reference = getFieldValue(row, 'reference', config);
  const reference2 = getFieldValue(row, 'reference_2', config);
  const collectionDate = getFieldValue(row, 'collection_date', config);

  if (reference) shipment.reference = reference;
  if (reference2) shipment.reference_2 = reference2;
  if (collectionDate) shipment.collection_date = collectionDate;
  if (Object.keys(shipTo).length > 0) shipment.ship_to = shipTo;
  if (Object.keys(courierSpecifics).length > 0) shipment.courier_specifics = courierSpecifics;

  const requestIdRaw = getFieldValue(row, 'request_id', config);
  let requestId: number | string | undefined = undefined;
  if (requestIdRaw) {
    const num = Number(requestIdRaw);
    requestId = !isNaN(num) && String(num) === requestIdRaw.trim() ? num : requestIdRaw;
  }

  const payload: VoilaQueueTrackingPayload = {
    testing: creds.isTesting ?? false,
    auth_company: creds.authCompany || '',
    shipment,
  };

  if (requestId !== undefined) {
    payload.request_id = requestId;
  }

  return { payload, courierKey, errors };
}
