



// features/prado/PradoButton.js
import React, { useState } from 'react';
import { SecondaryButton } from '../../components/common/Button';
import { post } from '../../services/api';
import styles from './PradoButton.module.css';


const PradoButton = ({
  extractedData = null,
  documentIssuePlace = '',
  onSuccess,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);

const handleOpenPrado = async () => {
  setIsLoading(true);
  
  try {
    let pradoUrl = null;
    
    // Priority 1: AI-prepared URL (from chat context)
    if (window.pradoContext && window.pradoContext.url) {
      pradoUrl = window.pradoContext.url;
      
    }
    // Priority 2: OCR extracted data
    else if (extractedData) {
      const formData = new FormData();
      formData.append('extracted_data', JSON.stringify(extractedData));
      
      const result = await post('/prepare_prado_url', formData, true);
      pradoUrl = result.url;
    }
    // Priority 3: Manual document issue place
    else if (documentIssuePlace) {
      const country = documentIssuePlace.split(',')[0].trim();
      const formData = new FormData();
      formData.append('country', country);
      formData.append('document_type', 'identity card');
      
      const result = await post('/prepare_prado_url', formData, true);
      pradoUrl = result.url;
    }
    
    // Open the URL
    if (pradoUrl) {
      window.open(pradoUrl, '_blank');
      if (onSuccess) onSuccess({ url: pradoUrl });
    } else {
      throw new Error('No PRADO URL available');
    }
    
  } catch (error) {
    console.error('Error opening PRADO:', error);
    if (onError) onError(error);
    // Fallback to manual search
    window.open('https://www.consilium.europa.eu/prado/en/search-by-document-country.html', '_blank');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <SecondaryButton
      onClick={handleOpenPrado}
      disabled={isLoading}
      className={styles.pradoButton}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner}></span>
          Opening...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          PRADO
        </>
      )}
    </SecondaryButton>
  );
};

export default PradoButton;
