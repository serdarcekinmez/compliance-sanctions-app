


// features/registration/registrationService.js
// Service for handling registration API calls

import { post } from '../../services/api';
import API_ENDPOINTS from '../../config/apiEndpoints';

/**
 * Save customer registration data
 * 
 * @param {FormData} formData - FormData containing registration info and files
 * @returns {Promise<Object>} - Promise resolving to the registration result
 */
export const saveRegistration = async (formData) => {
  try {
    // Use true parameter to indicate this is FormData
    const response = await post(API_ENDPOINTS.SAVE_REGISTRATION, formData, true);
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Generate PDF report for registration
 * 
 * @param {FormData} formData - FormData containing registration info and files
 * @param {string} registrationId - Optional registration ID if already saved
 * @returns {Promise<Blob>} - Promise resolving to the PDF blob
 */
export const generatePdf = async (formData, registrationId = null) => {
  try {
    // Add registration ID to form data if available
    if (registrationId) {
      formData.append('registration_id', registrationId);
    }
    
    // Use true parameter to indicate this is FormData
    const pdfBlob = await post(API_ENDPOINTS.GENERATE_PDF, formData, true);
    return pdfBlob;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

/**
 * Validate registration data before submission
 * 
 * @param {Object} data - Registration data object
 * @returns {Object} - Validation result with isValid flag and errors
 */
export const validateRegistration = (data) => {
  const errors = {};
  
  // Required fields validation
  const requiredFields = [
    'name',
    'surname',
    'transactionNumber',
    'transactionAmount',
    'transactionNature',
  ];
  
  requiredFields.forEach(field => {
    if (!data[field]) {
      errors[field] = 'This field is required';
    }
  });
  
  // Basic email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Transaction amount validation
  if (data.transactionAmount && isNaN(parseFloat(data.transactionAmount))) {
    errors.transactionAmount = 'Please enter a valid amount';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  saveRegistration,
  generatePdf,
  validateRegistration
};