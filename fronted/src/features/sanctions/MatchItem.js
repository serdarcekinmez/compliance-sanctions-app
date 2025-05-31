



// features/sanctions/MatchItem.js
// Fixed version with proper column alignment

import React, { useState } from 'react';
import styles from './MatchItem.module.css';

/**
 * @param {Object} props - Component props
 * @param {Object} props.match - Match data object
 * @param {boolean} props.isExpanded - Whether the item is expanded to show details
 * @param {Function} props.toggleDetails - Function to toggle details visibility
 */
const MatchItem = ({ match, isExpanded, toggleDetails }) => {
  const [showRawJson, setShowRawJson] = useState(false);
  
  // Helper to display N/A for null/undefined values
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return value;
  };

  // Truncate text to exactly 40 characters max
  const truncateText = (text, maxLength = 40) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Format JSON for display - ensuring the full content is preserved
  const formattedJson = JSON.stringify(match, null, 2);
  
  // Extract additional information from the match object
  const extractSanctionInfo = (match) => {
    const info = {
      authority: 'N/A',
      sourceUrl: 'N/A',
      program: 'N/A',
      provisions: 'N/A',
      listingDate: 'N/A',
      startDate: 'N/A'
    };
    
    // Try to extract from nested structure if available
    if (match.original && match.original.details && match.original.details.properties) {
      const props = match.original.details.properties;
      
      // Check for sanctions array
      if (props.sanctions && props.sanctions.length > 0 && props.sanctions[0].properties) {
        const sanctionProps = props.sanctions[0].properties;
        
        // Extract values (handling array values)
        info.authority = Array.isArray(sanctionProps.authority) ? sanctionProps.authority[0] : sanctionProps.authority || 'N/A';
        info.sourceUrl = Array.isArray(sanctionProps.sourceUrl) ? sanctionProps.sourceUrl[0] : sanctionProps.sourceUrl || 'N/A';
        info.program = Array.isArray(sanctionProps.program) ? sanctionProps.program[0] : sanctionProps.program || 'N/A';
        info.provisions = Array.isArray(sanctionProps.provisions) ? sanctionProps.provisions[0] : sanctionProps.provisions || 'N/A';
        info.listingDate = Array.isArray(sanctionProps.listingDate) ? sanctionProps.listingDate[0] : sanctionProps.listingDate || 'N/A';
        info.startDate = Array.isArray(sanctionProps.startDate) ? sanctionProps.startDate[0] : sanctionProps.startDate || 'N/A';
      }
    }
    
    return info;
  };
  
  // Get additional sanction info
  const sanctionInfo = extractSanctionInfo(match);

  // Format the score as a percentage with proper fallbacks
  const scoreDisplay = match.score !== undefined && match.score !== null 
    ? `${match.score}%` 
    : 'N/A';

  return (
    <div className={styles.matchItem}>
      {/* Tabular Horizontal Layout - Main Row with Fixed Width Columns */}
      <div 
        className={`${styles.matchRow} ${isExpanded ? styles.expanded : ''}`}
        onClick={toggleDetails}
      >
        <div className={styles.matchCol} style={{width: '30%'}}>
          <span className={styles.colLabel}>Name</span>
          <span className={styles.colValue}>{match.name} {match.surname}</span>
        </div>
        
        <div className={styles.matchCol} style={{width: '20%'}}>
          <span className={styles.colLabel}>Country</span>
          <span className={styles.colValue}>{formatValue(match.country)}</span>
        </div>
        
        <div className={styles.matchCol} style={{width: '30%'}}>
          <span className={styles.colLabel}>Authority</span>
          <span className={styles.colValue}>{formatValue(sanctionInfo.authority)}</span>
        </div>
        
        <div className={styles.matchCol} style={{width: '20%'}}>
          <span className={styles.colLabel}>Score</span>
          <span className={`${styles.colValue} ${styles.score}`}>{scoreDisplay}</span>
        </div>
        
        <div className={styles.expandToggle}>
          <svg 
            className={isExpanded ? styles.rotated : ''}
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M4 6L8 10L12 6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      
      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className={styles.detailsContainer}>
          <div className={styles.detailsGrid}>
            {/* Left Column */}
            <div className={styles.detailsColumn}>
              <div className={styles.detailsSection}>
                <h4>Identity Information</h4>
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Full Name:</span>
                    <span className={styles.detailsValue}>{match.name} {match.surname}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Country:</span>
                    <span className={styles.detailsValue}>{formatValue(match.country)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Birth Date:</span>
                    <span className={styles.detailsValue}>{formatValue(match.birthDate)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Birth Place:</span>
                    <span className={styles.detailsValue}>{formatValue(match.birthPlace)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Nationality:</span>
                    <span className={styles.detailsValue}>{formatValue(match.nationality)}</span>
                  </div>
                </div>
              </div>
              
              {match.addresses && match.addresses.length > 0 && (
                <div className={styles.detailsSection}>
                  <h4>Known Addresses</h4>
                  <ul className={styles.addressList}>
                    {match.addresses.map((address, index) => (
                      <li key={index}>{address}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {match.aliases && match.aliases.length > 0 && (
                <div className={styles.detailsSection}>
                  <h4>Known Aliases</h4>
                  <ul className={styles.aliasList}>
                    {match.aliases.map((alias, index) => (
                      <li key={index}>{alias}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Right Column */}
            <div className={styles.detailsColumn}>
              <div className={styles.detailsSection}>
                <h4>Sanction Information</h4>
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Authority:</span>
                    <span className={styles.detailsValue}>{formatValue(sanctionInfo.authority)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Sanction Type:</span>
                    <span className={styles.detailsValue}>{formatValue(match.sanctionType)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Sanction List:</span>
                    <span className={styles.detailsValue}>{formatValue(match.sanctionList)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Program:</span>
                    <span className={styles.detailsValue}>{formatValue(sanctionInfo.program)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailsLabel}>Provisions:</span>
                    <span className={styles.detailsValue}>{formatValue(sanctionInfo.provisions)}</span>
                  </div>
                  {sanctionInfo.sourceUrl && sanctionInfo.sourceUrl !== 'N/A' && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailsLabel}>Source URL:</span>
                      <span className={styles.detailsValue}>
                        <a 
                          href={sanctionInfo.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncateText(sanctionInfo.sourceUrl, 35)}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {match.additionalInfo && (
            <div className={styles.detailsSection}>
              <h4>Additional Information</h4>
              <p className={styles.additionalInfo}>{match.additionalInfo}</p>
            </div>
          )}
          
          <div className={styles.jsonSection}>
            <button 
              className={styles.jsonButton}
              onClick={(e) => {
                e.stopPropagation();
                setShowRawJson(!showRawJson);
              }}
              type="button"
            >
              {showRawJson ? 'Hide Raw JSON' : 'Show Raw JSON (Developers)'}
            </button>
            
            {showRawJson && (
              <div className={styles.jsonContainer}>
                <pre className={styles.jsonCode}>{formattedJson}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchItem;