



// components/common/Button.js
// Reusable button component

import React from 'react';
import styles from './Button.module.css';

/**
 * Reusable Button component with various variants
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (primary, secondary, danger, success, warning)
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS class
 */
const Button = ({
  variant = 'primary',
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
  ...props
}) => {
  // Map of variant names to CSS class names
  const variantClasses = {
    primary: styles.primary,
    secondary: styles.secondary,
    danger: styles.danger,
    success: styles.success,
    warning: styles.warning,
  };
  
  // Get the CSS class for the specified variant, default to primary
  const variantClass = variantClasses[variant] || variantClasses.primary;
  
  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${className} ${disabled ? styles.disabled : ''}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Primary button variant
 */
export const PrimaryButton = (props) => (
  <Button variant="primary" {...props} />
);

/**
 * Secondary button variant
 */
export const SecondaryButton = (props) => (
  <Button variant="secondary" {...props} />
);

/**
 * Danger button variant
 */
export const DangerButton = (props) => (
  <Button variant="danger" {...props} />
);

/**
 * Success button variant
 */
export const SuccessButton = (props) => (
  <Button variant="success" {...props} />
);

/**
 * Warning button variant
 */
export const WarningButton = (props) => (
  <Button variant="warning" {...props} />
);

export default Button;