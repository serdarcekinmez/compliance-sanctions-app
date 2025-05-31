




// src/services/sanctionsService.js
// Updated to use top_n parameter to match backend

import { get } from './api';
import API_ENDPOINTS from '../config/apiEndpoints';

/**
 * Verify identity against sanctions database
 * @param {Object} params
 * @param {string} params.name - First name
 * @param {string} params.surname - Last name
 * @param {number} params.threshold - Match threshold percentage
 * @param {number} params.top_n - Maximum number of results to return (default: 10)
 * @returns {Promise<Object>} - Promise resolving to raw API response
 */
export const verifyIdentity = async ({ name, surname, threshold, top_n = 10 }) => {
  const endpoint = [
    API_ENDPOINTS.VERIFY_IDENTITY,
    `?name=${encodeURIComponent(name)}`,
    `&surname=${encodeURIComponent(surname)}`,
    `&threshold=${threshold}`,
    `&top_n=${top_n}`  // Using top_n to match backend parameter
  ].join('');

  try {
    const response = await get(endpoint);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Normalize the raw matches input into an array of objects
 * @param {Array|Object|string|null} matches
 * @returns {Array<Object>} - Array of raw match objects
 */
const normalizeInput = matches => {
  if (!matches) return [];
  if (Array.isArray(matches)) return matches;
  if (typeof matches === 'object') return [matches];
  if (typeof matches === 'string') {
    try {
      const parsed = JSON.parse(matches);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Safely extract a nested property
 * @param {Object} obj
 * @param {string} path - Dot-delimited path
 * @returns {any|null}
 */
const extractValue = (obj, path) =>
  path.split('.').reduce((cur, key) => (cur ? cur[key] : null), obj) || null;

/**
 * Map a single raw match object to our standard shape
 * @param {Object} match
 * @returns {Object|null} - Standardized match or null if invalid
 */
const mapToStandard = match => {
  if (!match || typeof match !== 'object') return null;

  const properties = match.properties || match.details?.properties || {};
  const details    = match.details || {};

  const firstName = extractValue(match, 'name')
                  || extractValue(match, 'firstName')
                  || extractValue(properties, 'firstName')
                  || extractValue(details, 'firstName')
                  || 'Unknown';
  const lastName  = extractValue(match, 'surname')
                  || extractValue(match, 'lastName')
                  || extractValue(properties, 'lastName')
                  || extractValue(details, 'lastName')
                  || '';

  return {
    name: firstName,
    surname: lastName,
    country: extractValue(match, 'country')
           || extractValue(properties, 'country')
           || extractValue(details, 'country')
           || 'N/A',
    score: typeof match.score === 'number'
         ? match.score
         : typeof match.matchScore === 'number'
         ? match.matchScore
         : 0,
    birthDate: extractValue(match, 'birth_date')
            || extractValue(match, 'birthDate')
            || null,
    birthPlace: extractValue(match, 'birthPlace') || null,
    nationality: extractValue(match, 'nationality') || null,
    sanctionType: extractValue(match, 'sanctionType')
                || extractValue(details, 'sanctionType')
                || null,
    sanctionList: extractValue(match, 'sanctionList')
                || extractValue(details, 'sanctionList')
                || null,
    sanctionDate: extractValue(match, 'sanctionDate')
                || extractValue(details, 'sanctionDate')
                || null,
    documentType: extractValue(match, 'documentType') || null,
    documentNumber: extractValue(match, 'documentNumber') || null,
    addresses: Array.isArray(match.addresses)
             ? match.addresses
             : Array.isArray(properties.address)
             ? properties.address
             : match.address
             ? [match.address]
             : [],
    aliases: Array.isArray(match.aliases)
           ? match.aliases
           : Array.isArray(properties.alias)
           ? properties.alias
           : match.alias
           ? [match.alias]
           : [],
    additionalInfo: match.additionalInfo || match.info || null,
    original: { ...match }
  };
};

/**
 * Format raw matches data into a standard array of match objects
 * @param {Array|Object|string|null} matches
 * @returns {Array<Object>}
 */
export const formatMatches = matches => {
  const rawArray = normalizeInput(matches);
  const formatted = rawArray
    .map(mapToStandard)
    .filter(item => item !== null);

  return formatted;
};

/**
 * Analyze risk level based on match score
 * @param {Object} match - Standardized match object
 * @returns {'high'|'medium'|'low'|'unknown'}
 */
export const analyzeRisk = match => {
  if (!match || typeof match.score !== 'number') return 'unknown';
  if (match.score >= 80) return 'high';
  if (match.score >= 50) return 'medium';
  return 'low';
};

// Default export to match existing import style
export default {
  verifyIdentity,
  formatMatches,
  analyzeRisk
};