



// src/features/sanctions/useSanctionsSearch.js
// Updated with 80% default threshold and top_n parameter

import { useState, useCallback } from 'react';
import sanctionsService from '../../services/sanctionsService';
import { useAppPhase } from '../../context/AppPhaseContext';
// import logger from '../../utils/logger'; - removed

/**
 * Custom hook for sanctions search functionality
 * @returns {Object} Hook state and functions
 */
const useSanctionsSearch = () => {
  const { goToResults } = useAppPhase();

  // Form state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  // Changed default threshold from 75 to 80
  const [threshold, setThreshold] = useState(80);

  // Results state
  const [matches, setMatches] = useState([]);
  const [timestamp, setTimestamp] = useState('');
  const [searchLogId, setSearchLogId] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Reset form fields
   */
  const resetForm = useCallback(() => {
    setName('');
    setSurname('');
    // Reset to 80 instead of 75
    setThreshold(80);
  }, []);

  /**
   * Reset previous results
   */
  const resetResults = useCallback(() => {
    setMatches([]);
    setTimestamp('');
    setSearchLogId(null);
  }, []);

  /**
   * Handle form submission and sanctions check
   */
  const searchSanctions = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      setError(null);

      // Validate input
      if (!name.trim() || !surname.trim()) {
        setError('Please enter both first and last name.');
        return null;
      }

      setLoading(true);
      try {
        // Call the service with top_n parameter set to 10
        const response = await sanctionsService.verifyIdentity({
          name: name.trim(),
          surname: surname.trim(),
          threshold,
          top_n: 10  // Request up to 10 results from backend
        });

        if (!response) {
          throw new Error('No response from API');
        }

        // Normalize and format matches
        const rawMatches = response.matches ?? [];
        const formattedMatches =
          typeof sanctionsService.formatMatches === 'function'
            ? sanctionsService.formatMatches(rawMatches)
            : Array.isArray(rawMatches)
            ? rawMatches
            : [rawMatches];

        // Update state
        setMatches(formattedMatches);

        const ts = response.timestamp ?? new Date().toISOString();
        setTimestamp(ts);

        const logId =
          response.searchLogId ??
          (response.id ? String(response.id) : Date.now().toString());
        setSearchLogId(logId);

        // Prepare payload and return it
        const searchData = {
          matches: formattedMatches,
          timestamp: ts,
          searchLogId: logId,
          name: name.trim(),
          surname: surname.trim(),
        };

        return searchData;
      } catch (err) {
        setError(`Error searching sanctions database: ${err.message || 'Unknown error'}`);
        setMatches([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [name, surname, threshold]
  );

  return {
    // Form state
    name,
    setName,
    surname,
    setSurname,
    threshold,
    setThreshold,

    // Results state
    matches,
    timestamp,
    searchLogId,

    // UI state
    loading,
    error,
    setError,

    // Actions
    searchSanctions,
    resetForm,
    resetResults,
  };
};

export default useSanctionsSearch;