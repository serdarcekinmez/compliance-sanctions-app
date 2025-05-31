



// features/registration/PdfGenerator.js
// Enhanced version with improved screenshot handling

import React, { useState, useCallback } from 'react';
import { PrimaryButton } from '../../components/common/Button';
import useScreenshot from '../../hooks/useScreenshot';
import styles from './PdfGenerator.module.css';
import API_ENDPOINTS from '../../config/apiEndpoints';

/**
 * Component for PDF generation and in-app preview
 * Enhanced with better screenshot handling
 * 
 * @param {Object} props
 * @param {boolean} props.isGenerating - Whether PDF is generating
 * @param {string} props.error - Error message
 * @param {string} props.pdfUrl - URL of the generated PDF blob
 * @param {Function} props.onGenerate - Handler to initiate PDF generation
 * @param {boolean} props.disabled - Disable the generate button
 * @param {boolean} props.registrationRequired - Require registration before PDF
 * @param {boolean} props.registrationComplete - Registration success state
 * @param {boolean} props.hasScreenshot - Whether a screenshot is available
 * @param {string} props.screenshotUrl - URL of the screenshot
 * @param {string} props.elementToCapture - ID of element to screenshot
 */
const PdfGenerator = ({
  isGenerating,
  error,
  pdfUrl,
  onGenerate,
  disabled = false,
  registrationRequired = true,
  registrationComplete = false,
  hasScreenshot = false,
  screenshotUrl = null,
  elementToCapture = 'sanctionsResults'
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  
  // Get screenshot functionality from our enhanced hook
  const { 
    captureElement, 
    appendToFormData,
    isCapturing
  } = useScreenshot();

  /**
   * Handles PDF generation with improved screenshot handling
   */
  const handleGeneratePdf = useCallback(async () => {
    setPdfError(null);
    
    try {
      let formData = new FormData();
      
      // If we should take a new screenshot and we have an element to capture
      if (hasScreenshot && !screenshotUrl && elementToCapture) {
        const element = document.getElementById(elementToCapture);
        if (element) {
          // Capture the element
          const dataUrl = await captureElement(element);
          if (!dataUrl) {
            throw new Error('Failed to capture screenshot');
          }
          
          // Add to form data
          formData = appendToFormData(formData);
        }
      } 
      // If we already have a screenshot URL
      else if (hasScreenshot && screenshotUrl) {
        formData.append('screenshot', screenshotUrl);
      }
      
      // Call the parent's onGenerate function with the FormData
      if (onGenerate) {
        onGenerate(formData);
      }
    } catch (err) {
      console.error('Error generating PDF with screenshot:', err);
      setPdfError(err.message);
    }
  }, [hasScreenshot, screenshotUrl, elementToCapture, captureElement, appendToFormData, onGenerate]);

  const handleView = (e) => {
    e.preventDefault();
    if (pdfUrl) {
      setShowPreview(true);
    }
  };

  return (
    <div className={styles.pdfGeneratorContainer}>
      <h3>Generate PDF Report</h3>

      {registrationRequired && !registrationComplete && (
        <div className={styles.notice}>
          <svg className={styles.infoIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Submit registration before generating PDF report</span>
        </div>
      )}

      {hasScreenshot && (
        <div className={styles.screenshotNotice}>
          <svg className={styles.checkIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Sanctions check screenshot will be included in the PDF</span>
        </div>
      )}

      <PrimaryButton
        onClick={handleGeneratePdf}
        disabled={disabled || isGenerating || isCapturing || (registrationRequired && !registrationComplete)}
        className={styles.pdfButton}
      >
        {isGenerating || isCapturing ? (
          <>
            <span className={styles.spinner}></span>
            {isCapturing ? 'Capturing Screenshot...' : 'Generating PDF...'}
          </>
        ) : (
          <>
            <svg className={styles.pdfIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 9H8" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Generate PDF Report
          </>
        )}
      </PrimaryButton>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {pdfError && <div className={styles.errorMessage}>Screenshot error: {pdfError}</div>}

      {pdfUrl && (
        <div className={styles.pdfPreview}>
          <div className={styles.pdfSuccess}>
            <svg className={styles.checkIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>PDF created successfully!</span>
          </div>

          <div className={styles.pdfActions}>
            <button className={styles.viewPdfButton} onClick={handleView}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              View PDF
            </button>

            <a href={pdfUrl} download="customer_registration.pdf" className={styles.downloadPdfButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Download PDF
            </a>
          </div>

          {showPreview && (
            <div className={styles.pdfViewer}>
              <object
                data={pdfUrl}
                type="application/pdf"
                width="100%"
                height="600px"
              >
                <p>
                  Your browser does not support PDFs. <a href={pdfUrl}>Download PDF</a>.
                </p>
              </object>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfGenerator;