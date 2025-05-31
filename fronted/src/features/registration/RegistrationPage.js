




// features/registration/RegistrationPage.js
// Updated to work without DocumentOcr.js

import React, { useCallback } from 'react';
import { useAppPhase } from '../../context/AppPhaseContext';
import useRegistration from './useRegistration';
import RegistrationForm from './RegistrationForm';
import DocumentUploader from './DocumentUploader';
import PdfGenerator from './PdfGenerator';
import styles from './RegistrationPage.module.css';


/**
 * Main component for the customer registration page
 * Updated to work without DocumentOcr hook
 */
const RegistrationPage = () => {
  // Get app phase context
  const { goToSearch, searchResults } = useAppPhase();
  
  // Get registration hook
  const registration = useRegistration();
  
  // Extract customer data from search results
  const { name, surname, screenshotUrl, userDecision, searchLogId } = searchResults;
  
  // Function to update form fields from OCR
  const updateFormField = useCallback((fieldName, value) => {
    console.log(`Updating field: ${fieldName} with value: ${value}`);
    
    // Update the form data with the new value
    registration.setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Also add to OCR updated fields list
    if (value && fieldName && !registration.ocrUpdatedFields.includes(fieldName)) {
      registration.updateField(fieldName, value);
    }
  }, [registration]);
  
  // Determine if we have a screenshot available
  const hasScreenshot = !!screenshotUrl;
  
  return (
    <div className={styles.registrationPageContainer}>
      <header className={styles.pageHeader}>
        <h1>Customer Registration</h1>
        {userDecision && (
          <div className={`${styles.sanctionsDecision} ${styles[userDecision]}`}>
            Sanctions Decision: {
              userDecision === 'no_match' ? 'No Match' :
              userDecision === 'not_related' ? 'Not Related' :
              userDecision === 'proceed_anyway' ? 'Proceed Despite Match' : 
              'Unknown'
            }
          </div>
        )}
      </header>
      
      <div className={styles.pageContent}>
        {/* Sanctions check result summary */}
        {searchResults.matches && searchResults.matches.length > 0 && (
          <div className={styles.sanctionsSummary}>
            <div className={styles.summaryHeader}>
              <h3>Sanctions Check Summary</h3>
              <span className={styles.timestamp}>{searchResults.timestamp}</span>
            </div>
            <div className={styles.matchesSummary}>
              <span>Found {searchResults.matches.length} potential {searchResults.matches.length === 1 ? 'match' : 'matches'}</span>
              {hasScreenshot && (
                <div className={styles.screenshotIndicator}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Screenshot saved - will be included in PDF report</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={styles.contentGrid}>
          {/* Left side: Registration form */}
          <div className={styles.formSection}>
            <RegistrationForm
              formData={registration.formData}
              handleChange={registration.handleChange}
              validationErrors={registration.validationErrors}
              loading={registration.loading}
              error={registration.error}
              onSubmit={registration.handleSubmit}
              onBack={registration.handleReset}
              ocrUpdatedFields={registration.ocrUpdatedFields}
            />
          </div>
          
          {/* Right side: Document upload and PDF generation */}
          <div className={styles.docsSection}>
            {/* Document Uploader with OCR Panel integrated */}
            <DocumentUploader
              uploadedDocs={registration.uploadedDocs}
              handleFileUpload={registration.handleFileUpload}
              removeDocument={registration.removeDocument}
              screenshotUrl={screenshotUrl}
              docNotes={registration.formData.docNotes}
              handleChange={registration.handleChange}
              updateFormField={updateFormField}
                // Pass the update function
            />
            
            {/* PDF Generator */}
            <PdfGenerator
              isGenerating={registration.pdfGenerating}
              error={registration.pdfError}
              pdfUrl={registration.pdfUrl}
              onGenerate={registration.handleGeneratePdf}
              disabled={registration.loading}
              registrationRequired={true}
              registrationComplete={registration.success}
              hasScreenshot={hasScreenshot}
            />
          </div>
        </div>
        
        {/* Success message */}
        {registration.success && (
          <div className={styles.successMessage}>
            <svg className={styles.successIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1952 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Registration Submitted Successfully!</h3>
            <p>You can now generate a PDF report {hasScreenshot ? 'with the sanctions check screenshot' : ''} or start a new search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationPage;