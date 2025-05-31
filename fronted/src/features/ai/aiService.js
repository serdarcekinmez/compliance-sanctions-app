



// features/ai/aiService.js
// Service for handling AI assistant API calls

import { post } from '../../services/api';
import API_ENDPOINTS from '../../config/apiEndpoints';

/**
 * Send a query to the AI assistant
 * 
 * @param {string} query - The user's query
 * @param {Object} context - Additional context for the AI
 * @returns {Promise<Object>} - Promise resolving to the AI response
 */
export const sendChatQuery = async (query, context = {}) => {
  try {
    // Create FormData for the request
    const formData = new FormData();
    formData.append('query', query);
    
    // Add context if available
    if (context && Object.keys(context).length > 0) {
      formData.append('context', JSON.stringify(context));
    }
    
    // Use the API service to make the request
    return await post(API_ENDPOINTS.CHAT_WITH_AI, formData, true);
  } catch (error) {
    console.error('AI chat request failed:', error);
    throw error;
  }
};

/**
 * Format an error message for the AI chat
 * 
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error message
 */
export const formatErrorMessage = (error) => {
  return {
    sender: 'ai',
    text: `Sorry, I couldn't process your request. ${error.message || 'Please try again later.'}`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format a system message for the AI chat
 * 
 * @param {string} text - The message text
 * @returns {Object} - Formatted system message
 */
export const createSystemMessage = (text) => {
  return {
    sender: 'system',
    text,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format a user message for the AI chat
 * 
 * @param {string} text - The message text
 * @returns {Object} - Formatted user message
 */
export const createUserMessage = (text) => {
  return {
    sender: 'user',
    text,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format an AI response message
 * 
 * @param {string} text - The message text
 * @returns {Object} - Formatted AI message
 */
export const createAiMessage = (text) => {
  return {
    sender: 'ai',
    text,
    timestamp: new Date().toISOString()
  };
};

export default {
  sendChatQuery,
  formatErrorMessage,
  createSystemMessage,
  createUserMessage,
  createAiMessage
};