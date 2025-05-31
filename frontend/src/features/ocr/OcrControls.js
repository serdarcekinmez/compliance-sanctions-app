




// features/ocr/OcrControls.js
import React from 'react';
import { PrimaryButton, SecondaryButton } from '../../components/common/Button';
import styles from './OcrControls.module.css';
import PradoButton from '../prado/PradoButton';


/**
 * Simple OCR controls component - just UI, no business logic
 */
const OcrControls = ({
  isProcessing,
  onProcess,
  onOpenPrado,
  toggleAiAssistant,
  showAiAssistant,
  selectionMode,
  onChangeSelectionMode,
  processingLabel = 'Processing...',
  processButtonLabel = 'Extract Info via OCR',
  disabled = false,
  extractedData,
  documentIssuePlace
}) => {
  return (
    <div className={styles.controlsContainer}>
      {/* Selection mode toggle if enabled */}
      {onChangeSelectionMode && (
        <div className={styles.selectionModeToggle}>
          <span>OCR Processing Mode:</span>
          <button 
            type="button"
            className={`${styles.modeButton} ${selectionMode === 'single' ? styles.activeMode : ''}`}
            onClick={() => onChangeSelectionMode('single')}
          >
            Single Page
          </button>
          <button 
            type="button"
            className={`${styles.modeButton} ${selectionMode === 'multiple' ? styles.activeMode : ''}`}
            onClick={() => onChangeSelectionMode('multiple')}
          >
            Multi-Page
          </button>
        </div>
      )}
      
      <div className={styles.controlsButtons}>
        {/* Main OCR button */}
        <PrimaryButton
          onClick={onProcess}
          disabled={isProcessing || disabled}
          className={styles.ocrButton}
        >
          {isProcessing ? (
            <>
              <span className={styles.loadingSpinner}></span>
              {processingLabel}
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9M15 3L21 9M15 3V9H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 17H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {processButtonLabel}
            </>
          )}
        </PrimaryButton>
        
        {/* PRADO button if provided */}
        {onOpenPrado && (
          <SecondaryButton
            onClick={onOpenPrado}
            className={styles.pradoButton}
            disabled={isProcessing}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Open PRADO
          </SecondaryButton>
        )}
        
        {/* AI Assistant toggle if provided */}
        {toggleAiAssistant && (
          <SecondaryButton
            onClick={toggleAiAssistant}
            className={styles.aiButton}
            disabled={isProcessing}
            type="button"
          >
            {showAiAssistant ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.88 9.88C9.58525 10.1546 9.34884 10.4859 9.17857 10.852C9.00831 11.2181 8.90637 11.6124 8.87969 12.0157C8.853 12.419 8.90202 12.8241 9.02397 13.208C9.14591 13.5919 9.33876 13.9474 9.59124 14.2542C9.84372 14.5611 10.1513 14.8128 10.4967 14.9936C10.8421 15.1743 11.2183 15.2809 11.6038 15.3072C11.9893 15.3335 12.3767 15.2791 12.7439 15.1463C13.1111 15.0136 13.4508 14.8049 13.74 14.535" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.73 5.08C11.1513 5.02751 11.5754 5.00079 12 5C19 5 22 12 22 12C21.5818 12.8031 21.0839 13.5608 20.51 14.26M3 3L21 21M11.5 15.96C8.92 15.65 7.25 14.39 6 13C4.92 11.73 4.3 10.46 4 9.96C4.12386 9.65813 4.28908 9.37205 4.49 9.1M3 12C3 12 6 5 12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Hide AI Assistant
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5C15.73 5 19.17 6.9 21 10C19.17 13.1 15.73 15 12 15C8.27 15 4.83 13.1 3 10C4.83 6.9 8.27 5 12 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12.5C13.3807 12.5 14.5 11.3807 14.5 10C14.5 8.61929 13.3807 7.5 12 7.5C10.6193 7.5 9.5 8.61929 9.5 10C9.5 11.3807 10.6193 12.5 12 12.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Show AI Assistant
              </>
            )}
          </SecondaryButton>
        )}
        {/* PRADO button with custom component */}
          <PradoButton 
          extractedData={extractedData}
          documentIssuePlace={documentIssuePlace}
        />

      </div>
    </div>
  );
};

export default OcrControls;