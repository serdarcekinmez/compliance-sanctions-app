



// features/ocr/useOcr.js - Simplified version

import { useState, useCallback } from 'react';

/**
 * Field mapping from OCR AI output to form fields
 */
export const mapOcrFieldsToForm = (extractedData) => {
  if (!extractedData) {
    console.log('No extracted data to map');
    return {};
  }
  
  console.log('Raw OCR data received for mapping:', extractedData);
  
  // Direct mapping from AI output to form fields

  const fieldMapping = {
  'first_name': 'name',
  'last_name': 'surname',
  'document_number': 'documentNumber',
  'birth_date': 'birthDate',
  'birth_place': 'birthPlace',
  'document_issue_place': 'documentIssuePlace',
  'document_issue_date': 'documentIssueDate',  // This line should already be there
  'expiry_date': 'expiryDate',
  'address': 'address',
  'nationality': 'nationality',
  'sex': 'sex'
};

  const mappedData = {};
  
  // Process each field from the AI output
  Object.entries(extractedData).forEach(([aiField, value]) => {
    // Skip empty values
    if (!value || value === 'null' || value === null || value === undefined || value === '') {
      return;
    }
    
    const formField = fieldMapping[aiField];
    
    if (formField) {
      mappedData[formField] = value;
      console.log(`Mapped: ${aiField} -> ${formField} = "${value}"`);
    }
  });
  
  console.log('Final mapped data:', mappedData);
  
  return mappedData;
};

/**
 * Simplified OCR hook
 */
const useOcr = (updateFormField) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [ocrText, setOcrText] = useState('');
  
  /**
   * Apply extracted data to form
   */
  const applyToForm = useCallback((data = null) => {
    const dataToApply = data || extractedData;
    
    if (!dataToApply) {
      setStatus('❌ No extracted data available to apply to form.');
      return false;
    }
    
    if (!updateFormField) {
      setStatus('⚠️ Form update function not available.');
      return false;
    }
    
    try {
      console.log('Applying OCR data to form...');
      
      // Map OCR fields to form fields
      const mappedData = mapOcrFieldsToForm(dataToApply);
      
      if (Object.keys(mappedData).length === 0) {
        setStatus('⚠️ No mappable fields found in extracted data.');
        return false;
      }
      
      // Apply each mapped field to the form
      let appliedCount = 0;
      const appliedFields = [];
      
      Object.entries(mappedData).forEach(([formField, value]) => {
        if (value && value !== '') {
          try {
            updateFormField(formField, value);
            appliedCount++;
            appliedFields.push(formField);
            console.log(`✓ Applied to form: ${formField} = "${value}"`);
          } catch (error) {
            console.error(`✗ Failed to apply field ${formField}:`, error);
          }
        }
      });
      
      if (appliedCount > 0) {
        console.log(`Successfully applied ${appliedCount} fields to form`);
        return true;
      } else {
        setStatus('⚠️ No fields could be applied to the form.');
        return false;
      }
      
    } catch (error) {
      console.error('Error applying data to form:', error);
      setStatus(`❌ Error applying data to form: ${error.message}`);
      return false;
    }
  }, [extractedData, updateFormField]);
  
  /**
   * Clear all OCR data and reset state
   */
  const clearOcrData = useCallback(() => {
    setExtractedData(null);
    setOcrText('');
    setStatus('');
    console.log('OCR data cleared');
  }, []);
  
  /**
   * Format extracted fields for display
   */
  const formatExtractedFields = useCallback((data) => {
    if (!data) return [];
    
    return Object.entries(data)
      .filter(([_, value]) => value && value !== 'null' && value !== null)
      .map(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${displayKey}: ${value}`;
      });
  }, []);
  
  return {
    // State
    isProcessing,
    status,
    extractedData,
    ocrText,
    
    // State setters
    setIsProcessing,
    setStatus,
    setExtractedData,
    setOcrText,
    
    // Functions
    applyToForm,
    clearOcrData,
    formatExtractedFields,
    
    // Utility functions
    mapOcrFieldsToForm
  };
};

export default useOcr;