



// hooks/useScreenshot.js
// Enhanced screenshot hook with improved data handling and blob conversion

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import dataURLtoBlob from '../utils/dataURLtoBlob';

/**
 * Custom hook for capturing, processing, and sending screenshots
 * Enhances the existing hook with blob conversion and better error handling
 * 
 * @returns {Object} Screenshot capturing and processing functions
 */
const useScreenshot = () => {
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Captures a high-quality screenshot of a DOM element
   * 
   * @param {HTMLElement} element - The DOM element to capture
   * @param {Object} options - Options for html2canvas
   * @returns {Promise<string|null>} - Screenshot data URL or null on error
   */
  const captureElement = useCallback(async (element, options = {}) => {
    if (!element) {
      setError('No element provided for screenshot');
      return null;
    }

    setIsCapturing(true);
    setError(null);

    try {
      // Before capturing, apply styles to improve table visibility if needed
      const originalStyles = new Map();
      const tableElements = element.querySelectorAll('table, [class*="table"]');
      
      // Store original styles and apply capture styles
      if (tableElements.length > 0) {
        console.log('Optimizing tables for screenshot capture...');
        tableElements.forEach((table) => {
          originalStyles.set(table, table.getAttribute('style'));
          table.style.display = 'table';
          table.style.tableLayout = 'fixed';
          table.style.width = '100%';
          table.style.maxWidth = '100%';
          table.style.borderCollapse = 'collapse';
        });
      }
      
      // Enhanced default options for better quality
      const defaultOptions = {
        useCORS: true,
        allowTaint: true,
        scale: 2.0, // Higher resolution
        logging: false,
        backgroundColor: "#ffffff",
        width: undefined, // Use element's width
        height: undefined, // Use element's height
        imageTimeout: 15000, // Longer timeout for images
        removeContainer: false,
      };
      
      // Add a brief pause to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the screenshot
      console.log('Capturing element with dimensions:', {
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      
      const canvas = await html2canvas(element, { ...defaultOptions, ...options });
      
      // Restore original styles
      if (tableElements.length > 0) {
        tableElements.forEach(table => {
          const originalStyle = originalStyles.get(table);
          if (originalStyle) {
            table.setAttribute('style', originalStyle);
          } else {
            table.removeAttribute('style');
          }
        });
      }
      
      // Get data URL with high quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Slightly compressed for better efficiency
      console.log(`Screenshot captured, size: ${dataUrl.length} bytes`);
      
      setScreenshotUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Screenshot capture failed:', err);
      setError(`Screenshot capture failed: ${err.message}`);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Captures a clean screenshot of a table with special handling
   * 
   * @param {HTMLElement} tableElement - Table element to capture
   * @returns {Promise<string|null>} - Screenshot data URL or null on error
   */
  const captureTable = useCallback(async (tableElement) => {
    if (!tableElement) {
      setError('No table element provided for screenshot');
      return null;
    }
    
    setIsCapturing(true);
    setError(null);
    
    try {
      // Create a clone of the table in a new container for clean capture
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '1000px'; // Fixed width for consistent capture
      container.style.padding = '20px';
      container.style.backgroundColor = '#fff';
      container.style.zIndex = '-9999';
      container.style.visibility = 'hidden';
      
      // Clone the table and optimize for capture
      const tableClone = tableElement.cloneNode(true);
      tableClone.style.width = '100%';
      tableClone.style.maxWidth = '100%';
      tableClone.style.tableLayout = 'fixed';
      tableClone.style.borderCollapse = 'collapse';
      
      // Add the clone to the container
      container.appendChild(tableClone);
      document.body.appendChild(container);
      
      // Capture with custom options for tables
      const options = {
        scale: 2.0,
        backgroundColor: "#ffffff",
        width: 1000, // Match container width
        height: undefined,
        useCORS: true,
        allowTaint: true
      };
      
      // Add a brief pause to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture the table in the container
      const canvas = await html2canvas(container, options);
      
      // Clean up
      document.body.removeChild(container);
      
      // Get data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setScreenshotUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Table screenshot capture failed:', err);
      setError(`Table screenshot failed: ${err.message}`);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Convert screenshot data URL to a Blob for more efficient transmission
   * 
   * @param {string} dataUrl - Screenshot data URL to convert (defaults to current screenshot)
   * @returns {Blob|null} - Blob object or null on error
   */
  const toBlob = useCallback((dataUrl = screenshotUrl) => {
    if (!dataUrl) {
      setError('No screenshot available to convert');
      return null;
    }

    try {
      return dataURLtoBlob(dataUrl);
    } catch (err) {
      console.error('Error converting screenshot to blob:', err);
      setError(`Error converting screenshot: ${err.message}`);
      return null;
    }
  }, [screenshotUrl]);

  /**
   * Prepare screenshot for submission to server
   * 
   * @param {Object} formData - FormData object to append screenshot to
   * @param {string} fieldName - Field name for the screenshot
   * @param {string} dataUrl - Optional data URL (defaults to current screenshot)
   * @returns {FormData|null} - Updated FormData or null on error
   */
  const appendToFormData = useCallback((formData, fieldName = 'screenshot_file', dataUrl = screenshotUrl) => {
    if (!formData || !(formData instanceof FormData)) {
      setError('Invalid FormData object');
      return null;
    }

    if (!dataUrl) {
      setError('No screenshot available');
      return null;
    }

    try {
      // Convert to blob for efficiency
      const blob = toBlob(dataUrl);
      if (!blob) {
        throw new Error('Failed to convert screenshot to blob');
      }

      // Add to FormData with a filename
      formData.append(fieldName, blob, 'screenshot.jpg');
      
      // Also append the raw data URL as fallback
      formData.append('screenshot', dataUrl);
      
      return formData;
    } catch (err) {
      console.error('Error appending screenshot to FormData:', err);
      setError(`Error preparing screenshot: ${err.message}`);
      return null;
    }
  }, [screenshotUrl, toBlob]);

  /**
   * Saves the screenshot to localStorage
   * @param {string} key - Key to store the screenshot under
   * @param {string|null} dataUrl - Optional data URL (defaults to current screenshot)
   * @returns {boolean} - True on success, false on failure
   */
  const saveToLocalStorage = useCallback((key, dataUrl = null) => {
    const url = dataUrl || screenshotUrl;
    if (!url) {
      setError('No screenshot to save');
      return false;
    }

    try {
      localStorage.setItem(key, url);
      return true;
    } catch (err) {
      console.error('Error saving screenshot to localStorage:', err);
      setError(`Error saving screenshot: ${err.message}`);
      return false;
    }
  }, [screenshotUrl]);

  return {
    captureElement,
    captureTable,
    toBlob,
    appendToFormData,
    saveToLocalStorage,
    screenshotUrl,
    setScreenshotUrl,
    isCapturing,
    error,
  };
};

export default useScreenshot;