// components/common/Input.js
// Reusable input components for forms

import React from 'react';
import styles from './Input.module.css';

/**
 * Text input component with standard functionality
 */
export const Input = ({
  id,
  name,
  type = 'text',
  label,
  value = '',
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={styles.input}
        {...rest}
      />
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

/**
 * Textarea component for multiline text
 */
export const TextArea = ({
  id,
  name,
  label,
  value = '',
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  error = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={styles.textarea}
        {...rest}
      />
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

/**
 * Select dropdown component
 */
export const Select = ({
  id,
  name,
  label,
  value = '',
  onChange,
  children,
  required = false,
  disabled = false,
  error = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={styles.select}
        {...rest}
      >
        {children}
      </select>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

/**
 * Checkbox component
 */
export const Checkbox = ({
  id,
  name,
  label,
  checked = false,
  onChange,
  disabled = false,
  error = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.checkboxGroup} ${error ? styles.hasError : ''} ${className}`}>
      <div className={styles.checkboxWrapper}>
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={styles.checkbox}
          {...rest}
        />
        
        {label && (
          <label htmlFor={id} className={styles.checkboxLabel}>
            {label}
          </label>
        )}
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

/**
 * Range input component with value display
 */
export const Range = ({
  id,
  name,
  label,
  value = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  showValue = true,
  valuePrefix = '',
  valueSuffix = '',
  disabled = false,
  error = null,
  className = '',
  ...rest
}) => {
  return (
    <div className={`${styles.formGroup} ${error ? styles.hasError : ''} ${className}`}>
      <div className={styles.rangeHeader}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        
        {showValue && (
          <span className={styles.rangeValue}>
            {valuePrefix}{value}{valueSuffix}
          </span>
        )}
      </div>
      
      <input
        type="range"
        id={id}
        name={name}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        disabled={disabled}
        className={styles.rangeInput}
        {...rest}
      />
      
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

// Also export as a default object for convenience
export default {
  Input,
  TextArea,
  Select,
  Checkbox,
  Range
};