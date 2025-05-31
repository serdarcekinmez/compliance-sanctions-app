


// config/apiEndpoints.js
// Centralized configuration for API endpoints

/**
 * API Endpoints configuration
 * Keeping all endpoints in one place makes it easier to manage and update
 */
const API_ENDPOINTS = {
    // Sanctions search related endpoints
    VERIFY_IDENTITY: '/verify_identity',
    
    // Registration related endpoints
    SAVE_REGISTRATION: '/save_registration',
    
    // PDF generation
    GENERATE_PDF: '/generate_pdf',
    
    // OCR and document processing
    OCR_EXTRACT: '/ocr_and_interpret',
    EXTRACT_IDENTITY: '/extract_identity_info',

    PREPARE_PRADO_URL: '/prepare_prado_url',
    // AI chat assistant
    CHAT_WITH_AI: '/chat_with_ai'
  };
  
  export default API_ENDPOINTS;