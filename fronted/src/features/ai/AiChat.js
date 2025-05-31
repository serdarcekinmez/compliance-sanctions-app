



// features/ai/AiChat.js
// Component for AI chat interaction

import React from 'react';
import useAi from './useAi';
import styles from './AiChat.module.css';

/**
 * Component for AI chat interaction
 * 
 * @param {Object} props - Component props
 * @param {Object} props.context - Context for the AI (e.g., OCR data)
 */
const AiChat = ({ context = {} }) => {
  // Get AI chat hook
  const ai = useAi(context);
  
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h3>AI Assistant</h3>
        <button 
          className={styles.clearButton} 
          onClick={ai.clearChat}
          aria-label="Clear chat history"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6L5 20M5 6L19 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Clear</span>
        </button>
      </div>
      
      <div className={styles.messagesContainer}>
        {ai.messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${styles[message.sender]}`}
          >
            {message.sender === 'system' && (
              <div className={styles.systemIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 17.75L5.82798 20.995L7.00696 14.122L2.00696 9.25495L8.90696 8.25495L11.993 2.00195L15.079 8.25495L21.979 9.25495L16.979 14.122L18.158 20.995L12 17.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            
            {message.sender === 'user' && (
              <div className={styles.userIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 20.01L18.01 19.999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20.01L6.01 19.999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20.01L12.01 19.999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 12C18 16 13.5 20 12 20C10.5 20 6 16 6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            
            {message.sender === 'ai' && (
              <div className={styles.aiIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16C17.5228 16 22 13.3137 22 10C22 6.68629 17.5228 4 12 4C6.47715 4 2 6.68629 2 10C2 13.3137 6.47715 16 12 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 13V17C19 18.6569 15.866 20 12 20C8.13401 20 5 18.6569 5 17V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            
            <div className={styles.messageContent}>
              {message.text.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
        
        {/* Element for auto-scrolling */}
        <div ref={ai.chatEndRef} />
      </div>

        {ai.pradoContext && ai.pradoContext.suggestPrado && (
          <div className={styles.pradoSuggestion}>
            <span>
              click the PRADO button above to verify!
            </span>
          </div>
        )}
      
      <form className={styles.inputForm} onSubmit={ai.handleSubmit}>
        <input
          type="text"
          value={ai.inputText}
          onChange={ai.handleInputChange}
          placeholder="Type your question..."
          className={styles.chatInput}
          disabled={ai.isLoading}
        />
        <button 
          type="submit"
          className={styles.sendButton}
          disabled={ai.isLoading || !ai.inputText.trim()}
        >
          {ai.isLoading ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default AiChat;