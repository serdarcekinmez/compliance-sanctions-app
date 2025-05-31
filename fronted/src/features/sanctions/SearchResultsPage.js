




import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppPhase } from '../../context/AppPhaseContext';
import useScreenshot from '../../hooks/useScreenshot';
import MatchItem from './MatchItem';
import styles from './SearchResultsPage.module.css';
// import logger from '../../utils/logger'; - removed
import html2canvas from 'html2canvas';

const SearchResultsPage = () => {
  const { goToSearch, goToRegistration, searchResults } = useAppPhase();

  const {
    matches = [],
    timestamp = '',
    searchLogId = null,
    name = '',
    surname = '',
    dateOfBirth = '',
    amount = ''
  } = searchResults || {};

  const [expandedMatchIndex, setExpandedMatchIndex] = useState(null);
  const {
    captureElement,
    screenshotUrl: hookScreenshotUrl,
    isCapturing,
    setScreenshotUrl: setHookScreenshotUrl,
    error: screenshotError
  } = useScreenshot();

  const [localScreenshotUrl, setLocalScreenshotUrl] = useState(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    if (hookScreenshotUrl) {
      setLocalScreenshotUrl(hookScreenshotUrl);
    }
  }, [hookScreenshotUrl]);

  const pageContentRef = useRef(null);

  const toggleMatchDetails = (index) => {
    setExpandedMatchIndex(prev => (prev === index ? null : index));
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  // High-quality screenshot function - now standalone function that only captures the screenshot
  const captureScreenshot = useCallback(async () => {
    if (!pageContentRef.current) {
      return null;
    }

    try {
      setIsPdfGenerating(true);

      const canvas = await html2canvas(pageContentRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        logging: false,
        imageTimeout: 15000
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      setHookScreenshotUrl(imgData);
      setLocalScreenshotUrl(imgData);
      return imgData;
    } catch (err) {
      return null;
    } finally {
      setIsPdfGenerating(false);
    }
  }, [setHookScreenshotUrl]);

  // Separate handler for screenshot button
  const handleTakeScreenshot = useCallback(async () => {
    await captureScreenshot();
    // No navigation happens here, just capture the screenshot
  }, [captureScreenshot]);

  // Decision handler uses high-quality screenshot
  const handleDecision = useCallback(async (decision) => {
    if (decision === 'back') {
      goToSearch();
      return;
    }

    try {
      // If we don't have a screenshot yet, take one before proceeding
      if (!localScreenshotUrl) {
        const screenshotData = await captureScreenshot();
        
        const results = {
          matches,
          timestamp,
          searchLogId,
          userDecision: decision,
          name,
          surname,
          dateOfBirth,
          amount,
          screenshotUrl: screenshotData
        };

        goToRegistration(results);
      } else {
        // If we already have a screenshot, use it
        const results = {
          matches,
          timestamp,
          searchLogId,
          userDecision: decision,
          name,
          surname,
          dateOfBirth,
          amount,
          screenshotUrl: localScreenshotUrl
        };

        goToRegistration(results);
      }
    } catch (err) {
      const results = {
        matches,
        timestamp,
        searchLogId,
        userDecision: decision,
        name,
        surname,
        dateOfBirth,
        amount,
        screenshotUrl: localScreenshotUrl
      };
      goToRegistration(results);
    }
  }, [matches, timestamp, searchLogId, name, surname, dateOfBirth, amount, localScreenshotUrl, goToSearch, goToRegistration, captureScreenshot]);

  return (
    <div className={styles.searchResultsPage}>
      <header className={styles.pageHeader}>
        <h1>Sanctions Check Results</h1>
        <div className={styles.searchInfo}>
          <div className={styles.customerInfo}>
            <span className={styles.nameInfo}>Customer: <strong>{name} {surname}</strong></span>
            {dateOfBirth && <span className={styles.nameInfo}>DOB: <strong>{dateOfBirth}</strong></span>}
            {amount && <span className={styles.nameInfo}>Amount: <strong>{amount}</strong></span>}
            {timestamp && <span className={styles.timestamp}>Timestamp: {formatTimestamp(timestamp)}</span>}
          </div>
        </div>
      </header>

      <div className={styles.pageContent} ref={pageContentRef}>
        {matches.length > 0 ? (
          <div className={styles.resultsContainer}>
            <h2 className={styles.resultsHeader}>
              <span className={styles.matchCount}>{matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Found</span>
            </h2>
            <div className={styles.tableHeader}>
              <div className={styles.headerCol} style={{ width: '30%' }}>Name</div>
              <div className={styles.headerCol} style={{ width: '20%' }}>Country</div>
              <div className={styles.headerCol} style={{ width: '30%' }}>Authority</div>
              <div className={styles.headerCol} style={{ width: '20%' }}>Score</div>
              <div className={styles.headerExpand}></div>
            </div>
            <div className={styles.matchesList}>
              {matches.map((match, idx) => (
                <MatchItem
                  key={idx}
                  match={match}
                  isExpanded={expandedMatchIndex === idx}
                  toggleDetails={() => toggleMatchDetails(idx)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.noResultsMessage}>
            <p>No sanctions matches were found for <strong>{name} {surname}</strong>.</p>
          </div>
        )}
      </div>

      {/* Fixed: Changed onClick to use handleTakeScreenshot instead of handleDecision */}
      <button
        className={styles.floatingScreenshotButton}
        onClick={handleTakeScreenshot}
        disabled={isCapturing || isPdfGenerating}
        type="button"
        aria-label="Take Screenshot"
      >
        Take Screenshot
      </button>

      {screenshotError && <div className={styles.screenshotError}>Error capturing screenshot: {screenshotError}</div>}

      <div className={styles.actionsContainer}>
        {localScreenshotUrl && <div className={styles.screenshotMessage}><span className={styles.successIcon}>✓</span> Screenshot captured</div>}

        <div className={styles.decisionButtons}>
          <button
            className={`${styles.decisionButton} ${styles.noMatchButton}`}
            onClick={() => handleDecision('no_match')}
            type="button"
            disabled={isPdfGenerating}
          >No Match</button>
          <button
            className={`${styles.decisionButton} ${styles.notRelatedButton}`}
            onClick={() => handleDecision('not_related')}
            type="button"
            disabled={isPdfGenerating}
          >Not Related</button>
          <button
            className={`${styles.decisionButton} ${styles.proceedAnywayButton}`}
            onClick={() => handleDecision('proceed_anyway')}
            type="button"
            disabled={isPdfGenerating}
          >Proceed Anyway</button>
        </div>

        <button
          className={styles.backButton}
          onClick={() => handleDecision('back')}
          type="button"
          disabled={isPdfGenerating}
        >Back to Search</button>
      </div>
    </div>
  );
};

export default SearchResultsPage;