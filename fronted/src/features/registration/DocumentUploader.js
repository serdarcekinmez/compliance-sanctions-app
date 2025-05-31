




// features/registration/DocumentUploader.js
import React from 'react';
import { TextArea } from '../../components/common/Input';
import OcrPanel from '../ocr/OcrPanel';
import styles from './DocumentUploader.module.css';

/**
 * Document upload component with OCR integration
 * Simplified to use OcrPanel component
 */
const DocumentUploader = ({
  uploadedDocs = [],
  handleFileUpload,
  removeDocument,
  screenshotUrl,
  docNotes,
  handleChange,
  updateFormField  // Function to update form fields from OCR
}) => {
  
  return (
    <div className={styles.uploaderContainer}>
      <h2>Document Management</h2>

      {/* Upload section */}
      <div className={styles.uploadSection}>
        <label htmlFor="document-upload" className={styles.uploadLabel}>
          <div className={styles.uploadIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Choose Files</span>
          <span className={styles.supportedFormats}>
            (ID Cards, Passports, Proof of Address)
          </span>
        </label>
        <input
          id="document-upload"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          className={styles.fileInput}
        />
      </div>

      {/* Previews */}
      {(uploadedDocs.length > 0 || screenshotUrl) && (
        <div className={styles.uploadPreviewsContainer}>
          <h3 className={styles.previewsTitle}>Uploaded Documents</h3>
          <div className={styles.uploadPreviews}>
            {/* Screenshot display */}
            {screenshotUrl && (
              <div className={styles.screenshotContainer}>
                <h4 className={styles.previewsTitle}>
                  Sanctions Check Screenshot
                </h4>
                <div className={styles.screenshotThumbnail}>
                  <img
                    src={screenshotUrl}
                    alt="Sanctions check screenshot"
                  />
                </div>
              </div>
            )}

            {/* Document thumbnails */}
            {uploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                className={styles.docThumbnail}
              >
                <img src={doc.preview} alt={`Document ${idx + 1}`} />
                <button
                  className={styles.removeButton}
                  onClick={e => {
                    e.stopPropagation();
                    removeDocument(idx);
                  }}
                  type="button"
                  aria-label="Remove document"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className={styles.uploadCount}>
            {uploadedDocs.length > 0 && (
              `${uploadedDocs.length} document${
                uploadedDocs.length > 1 ? 's' : ''
              } uploaded`
            )}
          </div>
        </div>
      )}

       {/* OCR Panel - always visible now */}
      <OcrPanel
        documents={uploadedDocs}
        updateFormField={updateFormField}
        showSelectionControls={uploadedDocs.length > 1}
      />
      

      {/* Document notes */}
      <TextArea
        id="docNotes"
        name="docNotes"
        label="Notes for Compliance Officers"
        value={docNotes}
        onChange={handleChange}
        rows={4}
      />
    </div>
  );
};

export default DocumentUploader;