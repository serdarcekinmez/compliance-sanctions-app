




// features/ai/useAi.js
// Custom hook for handling AI chat operations

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  sendChatQuery, 
  createUserMessage, 
  createAiMessage, 
  createSystemMessage,
  formatErrorMessage
} from './aiService';

/**
 * Custom hook for AI chat functionality
 * 
 * @param {Object} initialContext - Initial context for the AI
 * @returns {Object} - Hook state and functions
 */
const useAi = (initialContext = {}) => {
  // Chat messages state - Changed from useLocalStorage to useState
  const [messages, setMessages] = useState([]);
  
  // Input and loading state
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Context state
  const [context, setContext] = useState(initialContext);

  // PRADO context state
  const [pradoContext, setPradoContext] = useState(null);
  
  // Ref for auto-scrolling to bottom of chat
  const chatEndRef = useRef(null);
  
  // Track if welcome message has been added
  const [welcomeAdded, setWelcomeAdded] = useState(false);
  
  // Effect to scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Effect to add welcome message only once
  useEffect(() => {
    if (messages.length === 0 && !welcomeAdded) {
      // Add welcome message
      const welcomeMessage = createSystemMessage(
        "Hello! I'm your AI assistant. I can help you with PRADO document verification. Please specify the country (e.g., 'Belgium ID card', 'French passport')."
      );
      setMessages([welcomeMessage]);
      setWelcomeAdded(true);
    }
  }, [messages.length, welcomeAdded]);
  
  // Update context when initialContext changes
  useEffect(() => {
    setContext(initialContext);
  }, [initialContext]);
  
  /**
   * Send a message to the AI assistant
   * 
   * @param {string} text - The message text to send
   */
  const sendMessage = useCallback(async (text) => {
    // Don't send empty messages
    if (!text || !text.trim()) return;
    
    // Add user message to chat
    const userMessage = createUserMessage(text);
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input field and set loading state
    setInputText('');
    setIsLoading(true);
    
    try {
      // Call API with current context
      const response = await sendChatQuery(text, context);
      
      if (response.status === 'success') {
        // Add AI response to chat
        const aiMessage = createAiMessage(response.response);
        setMessages(prev => [...prev, aiMessage]);
        
        // Store PRADO context globally for button access
        if (response.pradoContext) {
          window.pradoContext = response.pradoContext;
          setPradoContext(response.pradoContext);
        } else {
          // Don't clear pradoContext if not provided in response
          // This allows keeping the context across multiple messages
        }
      } else {
        // Add error message
        const errorMessage = formatErrorMessage(new Error(response.message || 'Unknown error'));
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Add error message
      const errorMessage = formatErrorMessage(error);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);
  
  /**
   * Handle input change
   * 
   * @param {Object} e - Event object
   */
  const handleInputChange = useCallback((e) => {
    setInputText(e.target.value);
  }, []);
  
  /**
   * Handle form submission
   * 
   * @param {Object} e - Event object
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    sendMessage(inputText);
  }, [inputText, sendMessage]);
  
  /**
   * Add a system message to the chat
   * 
   * @param {string} text - The system message text
   */
  const addSystemMessage = useCallback((text) => {
    const systemMessage = createSystemMessage(text);
    setMessages(prev => [...prev, systemMessage]);
  }, []);
  
  /**
   * Clear chat history
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setWelcomeAdded(false); // Reset welcome message flag
    window.pradoContext = null;
    setPradoContext(null);
  }, []);
  
  /**
   * Update the AI context
   * 
   * @param {Object} newContext - New context data
   */
  const updateContext = useCallback((newContext) => {
    setContext(prev => ({
      ...prev,
      ...newContext
    }));
  }, []);
  
  return {
    // State
    messages,
    inputText,
    isLoading,
    context,
    chatEndRef,
    pradoContext,
    
    // Functions
    setInputText,
    handleInputChange,
    handleSubmit,
    sendMessage,
    addSystemMessage,
    clearChat,
    updateContext
  };
};

export default useAi;