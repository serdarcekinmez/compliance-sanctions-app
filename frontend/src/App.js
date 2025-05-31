



// App.js
// Updated main application component to include the search results page

import React from 'react';
import { AppPhaseProvider, useAppPhase } from './context/AppPhaseContext';
import SearchPage from './features/sanctions/SearchPage';
import SearchResultsPage from './features/sanctions/SearchResultsPage';
import RegistrationPage from './features/registration/RegistrationPage';
import styles from './App.module.css';
import './styles/global.css';

/**
 * Main App content component that shows the current phase
 * with improved visual presentation
 */
const AppContent = () => {
  // Get current app phase from context
  const { phase } = useAppPhase();
  
  return (
    <>
      {/* Background pattern */}
      <div className={styles.appBackground} />
      
      <div className={styles.appContainer}>
        <main className={styles.appContentWrapper}>
          {phase === 'search' ? (
            <SearchPage />
          ) : phase === 'results' ? (
            <SearchResultsPage />
          ) : (
            <RegistrationPage />
          )}
        </main>
        
        <footer className={styles.footer}>
          <p>Customer Compliance System &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
};

/**
 * Main App component with context providers
 */
const App = () => {
  return (
    <AppPhaseProvider>
      <AppContent />
    </AppPhaseProvider>
  );
};

export default App;