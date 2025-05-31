



// features/sanctions/SearchForm.js
// Fixed version ensuring proper input handling

import React from 'react';
import styles from './SearchForm.module.css';

/**
 * Component for the sanctions search form
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - First name value
 * @param {Function} props.setName - Function to update first name
 * @param {string} props.surname - Last name value
 * @param {Function} props.setSurname - Function to update last name
 * @param {number} props.threshold - Matching threshold value
 * @param {Function} props.setThreshold - Function to update threshold
 * @param {boolean} props.loading - Whether form is in loading state
 * @param {string} props.error - Error message if any
 * @param {Function} props.handleSubmit - Form submission handler
 */
const SearchForm = ({ 
  name, 
  setName, 
  surname, 
  setSurname, 
  threshold, 
  setThreshold,
  loading,
  error,
  handleSubmit 
}) => {
  // Handler for name input changes
  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  // Handler for surname input changes
  const handleSurnameChange = (e) => {
    setSurname(e.target.value);
  };

  // Handler for threshold input changes
  const handleThresholdChange = (e) => {
    // Ensure the threshold is a number between 0 and 100
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setThreshold(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name">First Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={handleNameChange}
          required
          placeholder="Enter first name"
          className={styles.textInput}
          autoComplete="given-name"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="surname">Last Name:</label>
        <input
          id="surname"
          type="text"
          value={surname}
          onChange={handleSurnameChange}
          required
          placeholder="Enter last name"
          className={styles.textInput}
          autoComplete="family-name"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="threshold">Matching Threshold (%):</label>
        <input
          id="threshold"
          type="number"
          value={threshold}
          onChange={handleThresholdChange}
          min="0"
          max="100"
          required
          className={styles.numberInput}
        />
        <div className={styles.thresholdSlider}>
          <input
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={handleThresholdChange}
            className={styles.slider}
          />
        </div>
      </div>
      
      <button 
        type="submit" 
        className={styles.primaryButton} 
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify Identity'}
      </button>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </form>
  );
};

export default SearchForm;