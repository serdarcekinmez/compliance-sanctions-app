


// services/api.js
// Centralized API service for making HTTP requests

/**
 * Base API service for handling HTTP requests
 */
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Makes a GET request to the API
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} params - Query parameters as object
 * @returns {Promise<any>} - Promise resolving to the response data
 */
export const get = async (endpoint, params = {}) => {
  try {
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Makes a POST request to the API
 * @param {string} endpoint - The API endpoint to call
 * @param {Object|FormData} data - The data to send in the request body
 * @param {boolean} isFormData - Whether the data is FormData (for file uploads)
 * @returns {Promise<any>} - Promise resolving to the response data
 */
export const post = async (endpoint, data, isFormData = false) => {
  try {
    const headers = isFormData 
      ? {} // Let the browser set the content type with boundary for FormData
      : { 'Content-Type': 'application/json' };

    const body = isFormData ? data : JSON.stringify(data);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });

    // Handle binary responses (like PDF)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      return await response.blob();
    }

    // Handle JSON responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default {
  get,
  post,
};