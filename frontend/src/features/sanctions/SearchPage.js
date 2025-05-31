




// features/sanctions/SearchPage.js
// Fixed version to ensure proper integration with SearchForm

import React, { useCallback } from 'react';
import { useAppPhase } from '../../context/AppPhaseContext';
import useSanctionsSearch from './useSanctionsSearch';
import SearchForm from './SearchForm';
import styles from './SearchPage.module.css';

/**
 * Main component for the sanctions search page
 */
const SearchPage = () => {
  // Get app phase context - for navigation
  const { goToResults } = useAppPhase();
  
  // Get sanctions search hook
  const sanctionsSearch = useSanctionsSearch();
  
  /**
   * Handle search form submission
   */
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      // If form fields are empty, return early
      if (!sanctionsSearch.name.trim() || !sanctionsSearch.surname.trim()) {
        sanctionsSearch.setError('Please enter both first and last name.');
        return;
      }
      
      // Search sanctions using the hook
      const results = await sanctionsSearch.searchSanctions();
      
      if (results) {
        // Use the results object returned by the hook
        goToResults(results);
      }
    } catch (error) {
      sanctionsSearch.setError(`Search failed: ${error.message || 'Unknown error'}`);
    }
  }, [sanctionsSearch, goToResults]);

  return (
    <div className={styles.searchPageContainer}>
      <header className={styles.pageHeader}>
        <h1>Customer Sanctions Check</h1>
        <p className={styles.headerDescription}>
          Enter the customer's details below to check against sanctions databases
        </p>
      </header>
      
      <div className={styles.pageContent}>
        <div className={styles.searchPanel}>
          <h2>Enter Customer Details</h2>
          
          <SearchForm 
            name={sanctionsSearch.name}
            setName={sanctionsSearch.setName}
            surname={sanctionsSearch.surname}
            setSurname={sanctionsSearch.setSurname}
            threshold={sanctionsSearch.threshold}
            setThreshold={sanctionsSearch.setThreshold}
            loading={sanctionsSearch.loading}
            error={sanctionsSearch.error}
            handleSubmit={handleSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;