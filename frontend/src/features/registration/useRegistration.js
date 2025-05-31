



// features/registration/useRegistration.js
// Fixed version with proper screenshot handling

import { useState, useCallback, useEffect } from 'react';
import { saveRegistration, generatePdf, validateRegistration } from './registrationService';
import { useAppPhase } from '../../context/AppPhaseContext';
import useLocalStorage from '../../hooks/useLocalStorage';
import dataURLtoBlob from '../../utils/dataURLtoBlob';

/**
 * Custom hook for handling registration functionality
 * 
 * @returns {Object} - Hook state and functions
 */
const useRegistration = () => {
  // Get data from app phase context
  const { searchResults, goToSearch } = useAppPhase();
  
  // Extract customer data from search results
  const { name, surname, screenshotUrl, userDecision, searchLogId } = searchResults || {};
  
  // Form field states
  const [formData, setFormData] = useState({
    name: name || '',
    surname: surname || '',
    transactionNumber: '',
    transactionAmount: '',
    euroEquivalent: '',
    address: '',
    documentNumber: '',
    documentIssuePlace: '',
    documentValidity: '',
    birthDate: '',
    birthPlace: '',
    telephone: '',
    email: '',
    salaryOrigin: '',
    transactionIntent: '',
    transactionNature: '',
    suspicious: 'N',
    agentObservations: '',
    docNotes: ''
  });
  
  // Track which fields were updated by OCR
  const [ocrUpdatedFields, setOcrUpdatedFields] = useState([]);
  
  // Document state
  const [uploadedDocs, setUploadedDocs] = useState([]);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});
  
  // Registration process state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  
  // PDF generation state
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  
  // Use local storage to persist form data in case of browser refresh
  const [savedFormData, setSavedFormData] = useLocalStorage('registrationFormData', null);
  const [savedOcrFields, setSavedOcrFields] = useLocalStorage('ocrUpdatedFields', []);
  
  // Initialize form from saved data if available
  useEffect(() => {
    if (savedFormData) {
      setFormData(prevData => ({
        ...prevData,
        ...savedFormData
      }));
    }
    
    if (savedOcrFields && savedOcrFields.length > 0) {
      setOcrUpdatedFields(savedOcrFields);
    }
  }, []);
  
  /**
   * Handle form field changes
   * 
   * @param {Object} e - Event object
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      // Save to localStorage whenever form changes
      setSavedFormData(newData);
      return newData;
    });
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationErrors, setSavedFormData]);
  
  /**
   * Update a form field directly (for use with OCR)
   * 
   * @param {string} fieldName - Field name to update
   * @param {any} value - New value
   */
  const updateField = useCallback((fieldName, value) => {
    if (!fieldName || value === undefined) return;
    
    // Update the form data
    setFormData(prev => {
      const newData = { ...prev, [fieldName]: value };
      // Save to localStorage
      setSavedFormData(newData);
      return newData;
    });
    
    // Add to list of OCR updated fields
    if (!ocrUpdatedFields.includes(fieldName)) {
      const newOcrFields = [...ocrUpdatedFields, fieldName];
      setOcrUpdatedFields(newOcrFields);
      setSavedOcrFields(newOcrFields);
    }
    
    // Clear any validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [ocrUpdatedFields, validationErrors, setSavedFormData, setSavedOcrFields]);
  
  /**
   * Handle file uploads
   * 
   * @param {Object} e - Event object
   */
  const handleFileUpload = useCallback((e) => {
    const files = e.target.files;
    const newDocs = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newDocs.push({ file, preview });
    }
    
    setUploadedDocs(prev => [...prev, ...newDocs]);
  }, []);
  
  /**
   * Remove an uploaded document
   * 
   * @param {number} index - Index of document to remove
   */
  const removeDocument = useCallback((index) => {
    setUploadedDocs(prev => {
      const newDocs = [...prev];
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(newDocs[index].preview);
      newDocs.splice(index, 1);
      return newDocs;
    });
  }, []);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    // Reset states
    setError('');
    setSuccess(false);
    
    // Validate form data
    const validation = validateRegistration(formData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Create FormData object
      const formDataObj = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value);
      });
      
      // Add user decision from sanctions check
      if (userDecision) {
        formDataObj.append('user_decision', userDecision);
      }
      
      // Add search log ID if available
      if (searchLogId) {
        formDataObj.append('search_log_id', searchLogId);
      }
      
      // Add which fields were updated by OCR
      if (ocrUpdatedFields.length > 0) {
        formDataObj.append('ocr_fields', JSON.stringify(ocrUpdatedFields));
      }
      
      // Add uploaded documents
      uploadedDocs.forEach((doc, index) => {
        if (doc.file) {
          formDataObj.append(`document_${index}`, doc.file);
        }
      });
      
      // FIXED: Handle screenshot properly
      if (screenshotUrl) {
        // Keep the data URL in the form data for now
        // The backend will handle it
        formDataObj.append('screenshot', screenshotUrl);
      }
      
      // Submit registration
      const response = await saveRegistration(formDataObj);
      
      // Store registration ID
      if (response.registration_id) {
        setRegistrationId(response.registration_id);
      }
      
      // Registration successful
      setSuccess(true);
      
      // Clear saved form data
      setSavedFormData(null);
      setSavedOcrFields([]);
      
      // Clear validation errors
      setValidationErrors({});
      
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      setError(`Registration failed: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, userDecision, searchLogId, uploadedDocs, screenshotUrl, ocrUpdatedFields, setSavedFormData, setSavedOcrFields]);
  
  /**
   * Generate PDF report with proper screenshot handling
   */
  const handleGeneratePdf = useCallback(async () => {
    setPdfGenerating(true);
    setPdfError('');
    setPdfUrl('');
    
    try {
      // Get screenshot from searchResults if available
      const screenshotData = searchResults?.screenshotUrl || '';
      const hasScreenshot = !!screenshotData;
      
      // Create FormData object for server request
      const formDataObj = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value || '');
      });
      
      // Add registration ID if available
      if (registrationId) {
        formDataObj.append('registration_id', registrationId);
      }
      
      // Add uploaded documents
      uploadedDocs.forEach((doc, index) => {
        if (doc.file) {
          formDataObj.append(`document_${index}`, doc.file);
        }
      });
      
      // FIXED: Handle screenshot data URL properly
      if (hasScreenshot && screenshotData) {
        // Option 1: Send as data URL (if backend can handle large form fields)
        formDataObj.append('screenshot', screenshotData);
        
        // Option 2: Convert to blob and send as file (more reliable for large images)
        // Uncomment below if Option 1 doesn't work:
        /*
        try {
          const screenshotBlob = dataURLtoBlob(screenshotData);
          formDataObj.append('screenshot_file', screenshotBlob, 'screenshot.png');
          console.log('Screenshot converted to blob, size:', screenshotBlob.size);
        } catch (blobError) {
          console.error('Error converting screenshot to blob:', blobError);
          // Fallback to data URL
          formDataObj.append('screenshot', screenshotData);
        }
        */
      }
      
      // Add OCR fields info
      if (ocrUpdatedFields.length > 0) {
        formDataObj.append('ocr_fields', JSON.stringify(ocrUpdatedFields));
      }
      
      // Log FormData contents for debugging
      console.log('PDF Generation FormData contents:');
      for (let [key, value] of formDataObj.entries()) {
        if (key === 'screenshot') {
          console.log(`  ${key}: [Data URL, length: ${value.length}]`);
        } else if (key.startsWith('document_')) {
          console.log(`  ${key}: [File: ${value.name || 'unknown'}]`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Generate PDF on server side
      const pdfBlob = await generatePdf(formDataObj, registrationId);
      
      // Create URL for the PDF blob
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      return url;
    } catch (err) {
      console.error('PDF generation error:', err);
      setPdfError(`PDF generation failed: ${err.message}`);
      return null;
    } finally {
      setPdfGenerating(false);
    }
  }, [formData, registrationId, uploadedDocs, searchResults, ocrUpdatedFields]);
  
  /**
   * Reset the registration form and go back to search
   */
  const handleReset = useCallback(() => {
    // Clear form data
    setFormData({
      name: '',
      surname: '',
      transactionNumber: '',
      transactionAmount: '',
      euroEquivalent: '',
      address: '',
      documentNumber: '',
      documentIssuePlace: '',
      documentValidity: '',
      birthDate: '',
      birthPlace: '',
      telephone: '',
      email: '',
      salaryOrigin: '',
      transactionIntent: '',
      transactionNature: '',
      suspicious: 'N',
      agentObservations: '',
      docNotes: ''
    });
    
    // Clear OCR fields
    setOcrUpdatedFields([]);
    
    // Clear uploaded documents
    uploadedDocs.forEach(doc => {
      URL.revokeObjectURL(doc.preview);
    });
    setUploadedDocs([]);
    
    // Clear other states
    setValidationErrors({});
    setError('');
    setSuccess(false);
    setRegistrationId(null);
    setPdfUrl('');
    setPdfError('');
    
    // Clear saved form data
    setSavedFormData(null);
    setSavedOcrFields([]);
    
    // Go back to search phase
    goToSearch();
  }, [uploadedDocs, goToSearch, setSavedFormData, setSavedOcrFields]);
  
  return {
    // Form state
    formData,
    setFormData,
    uploadedDocs,
    setUploadedDocs,
    ocrUpdatedFields,
    
    // Validation state
    validationErrors,
    
    // Process state
    loading,
    error,
    success,
    registrationId,
    
    // PDF state
    pdfGenerating,
    pdfError,
    pdfUrl,
    
    // Functions
    handleChange,
    updateField,
    handleFileUpload,
    removeDocument,
    handleSubmit,
    handleGeneratePdf,
    handleReset,
    
    // Customer data from search
    customerData: {
      name,
      surname,
      screenshotUrl,
      userDecision,
      searchLogId
    }
  };
};

export default useRegistration;