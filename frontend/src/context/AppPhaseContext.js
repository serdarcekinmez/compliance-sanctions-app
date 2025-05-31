



// context/AppPhaseContext.js
// Context to manage application phase transitions between search, results, and registration

import React, { createContext, useState, useContext, useCallback } from 'react';

// Create a context for the app phase
const AppPhaseContext = createContext();

/**
 * Provider component for AppPhase context
 * Manages application phase state (search, results, register) and data passing between screens
 */
export const AppPhaseProvider = ({ children }) => {
  // State for current application phase - starts with "search"
  const [phase, setPhase] = useState('search');
  
  // State for storing sanction search results to pass between phases
  // Using a more complete initial state with empty arrays to avoid undefined issues
  const [searchResults, setSearchResults] = useState({
    matches: [],        // Array of match objects from sanctions search
    timestamp: '',      // When the search was performed
    searchLogId: null,  // ID for logging/tracking the search
    userDecision: '',   // User's decision about the matches
    name: '',           // First name searched
    surname: '',        // Last name searched
    screenshotUrl: '',   // URL of screenshot taken
    pdfData: '',
  });

  // Function to transition from search to results page - wrapped in useCallback for performance
  // This is called when search results are available and we need to show them
  const goToResults = useCallback((results) => {
    console.log('AppPhaseContext: goToResults called with:', results);
    
    // Create a complete object with all required fields
    // This ensures we don't lose data when setting state

    const safeResults = {
      // Use the incoming results, but provide fallbacks for each field
      matches: results.matches || [],
      timestamp: results.timestamp || '',
      searchLogId: results.searchLogId || null,
      userDecision: results.userDecision || '',
      name: results.name || '',
      surname: results.surname || '',
      screenshotUrl: results.screenshotUrl || ''
    };
    
    // Log what we're setting in state for debugging
    console.log('AppPhaseContext: Setting search results to:', safeResults);
    
    // Update state with the prepared results
    setSearchResults(safeResults);
    // Change the application phase to show results
    setPhase('results');
  }, []);

  // Function to transition from results to registration - wrapped in useCallback for performance
  // Called when user makes a decision about the matches
  const goToRegistration = useCallback((results) => {
    console.log('AppPhaseContext: goToRegistration called with:', results);
    
    // Update results if provided (to include user decision and screenshot)
    if (results) {
      // Use functional update to ensure we're working with latest state
      setSearchResults(prevResults => {
        const updatedResults = {
          ...prevResults,            // Keep all previous state
          ...results,                // Update with new values
          matches: results.matches || prevResults.matches || [] // Ensure matches is never undefined
        };
        
        console.log('AppPhaseContext: Updated registration results:', updatedResults);
        return updatedResults;
      });
    }
    
    // Change application phase to registration
    setPhase('register');
  }, []);

  // Function to go back to search phase - wrapped in useCallback for performance
  const goToSearch = useCallback(() => {
    console.log('AppPhaseContext: Going back to search');
    // Just change the phase, keep results in case we need them
    setPhase('search');
    // We're intentionally NOT clearing search results
    // so the data is preserved if the user wants to go back to results
  }, []);

  // Prepare the value object that will be provided by the context
  const contextValue = {
    phase,              // Current application phase (search, results, register)
    searchResults,      // Search results data to share between components
    goToResults,        // Function to transition to results page
    goToRegistration,   // Function to transition to registration page
    goToSearch          // Function to go back to search page
  };

  // Add debug information for easier troubleshooting
  console.log('AppPhaseContext current state:', { phase, searchResults });

  // Provide the context value to all child components
  return (
    <AppPhaseContext.Provider value={contextValue}>
      {children}
    </AppPhaseContext.Provider>
  );
};

/**
 * Custom hook to use the AppPhase context in components
 * Makes it easier to access the app phase context in any component
 */
export const useAppPhase = () => {
  const context = useContext(AppPhaseContext);
  
  // Make sure the hook is used within a provider
  if (!context) {
    throw new Error('useAppPhase must be used within an AppPhaseProvider');
  }
  
  return context;
};