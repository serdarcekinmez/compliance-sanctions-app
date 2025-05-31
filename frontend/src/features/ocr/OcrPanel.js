



// features/ocr/OcrPanel.js
import React, { useState } from 'react';
import useOcr from './useOcr';
import OcrControls from './OcrControls';
import AiChat from '../ai/AiChat';
import styles from './OcrPanel.module.css';

import { post } from '../../services/api';
import API_ENDPOINTS from '../../config/apiEndpoints';

/**
 * OCR panel – now with enhanced partial‑success handling.
 * Keeps all existing alerts & functionality while adding a richer branch when
 * the AI fails to parse JSON but OCR succeeds.
 */
const OcrPanel = ({
  documents = [],
  onProcessSuccess = null,
  updateFormField = null,
  showSelectionControls = true,
}) => {
  // -----------------------------------------------------------------------
  // Hooks & local state
  // -----------------------------------------------------------------------
  const ocr = useOcr(updateFormField);
  const [selectionMode, setSelectionMode] = useState('single');
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [selectedDocIndices, setSelectedDocIndices] = useState([]);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  const getProcessButtonLabel = () => {
    if (selectionMode === 'single' || documents.length <= 1) return 'Extract Info via OCR';
    const count = selectedDocIndices.length || documents.length;
    return `Process ${count} Page${count !== 1 ? 's' : ''}`;
  };

  // -----------------------------------------------------------------------
  // Main handler: send the doc(s) to /ocr_and_interpret
  // -----------------------------------------------------------------------
  const handleProcessDocuments = async () => {
    if (!documents || documents.length === 0) {
      ocr.setStatus('⚠️ No documents available');
      return;
    }

    // Determine which documents to send
    let docsToProcess;
    if (showSelectionControls && selectedDocIndices.length > 0) {
      docsToProcess = selectedDocIndices.map((i) => documents[i]).filter(Boolean);
    } else {
      docsToProcess = [...documents];
    }

    if (docsToProcess.length === 0) {
      ocr.setStatus('⚠️ No documents selected for processing');
      return;
    }

    // Reset state before new call
    ocr.clearOcrData();

    // Build multipart form
    const formData = new FormData();
    if (docsToProcess.length === 1) {
      formData.append('file', docsToProcess[0].file || docsToProcess[0]);
    } else if (docsToProcess.length >= 2) {
      formData.append('file', docsToProcess[0].file || docsToProcess[0]);
      formData.append('file2', docsToProcess[1].file || docsToProcess[1]);
    }

    try {
      ocr.setStatus('🔄 Processing document with OCR + AI...');
      const result = await post(API_ENDPOINTS.OCR_EXTRACT, formData, true);

      // ------------------------------------------------------------------
      // SUCCESS branch – full extraction
      // ------------------------------------------------------------------
      if (result.status === 'success') {
        // Store extracted data
        ocr.setExtractedData(result.data);
        ocr.setOcrText(result.ocr_text || '');

        // Count & show how many non-empty fields we got
        const validFields = Object.entries(result.data || {}).filter(([, v]) => v !== null && v !== '').length;
        ocr.setStatus(`✅ Successfully extracted ${validFields} fields`);

        // Apply to form if asked
        if (updateFormField && result.data) {
          const applied = ocr.applyToForm(result.data);
          if (applied) ocr.setStatus(`✅ Successfully extracted and applied ${validFields} fields to form`);
        }

        // Upstream callback
        onProcessSuccess?.(result);
        setShowAiAssistant(true);

      // ------------------------------------------------------------------
      // PARTIAL SUCCESS – OCR ok but AI unreliable (enhanced)
      // ------------------------------------------------------------------
      } else if (result.status === 'partial_success') {
        // Always expose raw OCR text for manual review
        ocr.setOcrText(result.ocr_text || '');
        // Clear any structured data so the form doesn’t populate stale values
        ocr.setExtractedData({});

        // Build helpful status message. If backend forwarded an ai_note we
        // include the backend message verbatim; otherwise use a generic text.
        const message = result.ai_note
          ? `⚠️ ${result.message}`
          : '⚠️ OCR completed but AI interpretation had issues. Raw text is available below.';
        ocr.setStatus(message);

        // Keep the chat panel open so the user can still ask the AI questions
        setShowAiAssistant(true);

      // ------------------------------------------------------------------
      // ERROR – complete failure
      // ------------------------------------------------------------------
      } else {
        ocr.setStatus(`❌ Error: ${result.message || 'Processing failed'}`);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      ocr.setStatus(`❌ Error: ${error.message}`);
    }
  };

  // -----------------------------------------------------------------------
  // Toggle AI assistant visibility
  // -----------------------------------------------------------------------
  const toggleAiAssistant = () => setShowAiAssistant((prev) => !prev);

  // -----------------------------------------------------------------------
  // Build context object passed to AiChat
  // -----------------------------------------------------------------------
  const getAiContext = () => {
    const ctx = {
      documentCount: documents.length,
      hasDocuments: documents.length > 0,
    };
    if (ocr.extractedData) ctx.extractedData = ocr.extractedData;
    if (ocr.ocrText) ctx.ocrText = ocr.ocrText;
    return ctx;
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className={styles.ocrPanelContainer}>
      <OcrControls
        isProcessing={ocr.isProcessing}
        onProcess={handleProcessDocuments}
        toggleAiAssistant={toggleAiAssistant}
        showAiAssistant={showAiAssistant}
        selectionMode={selectionMode}
        onChangeSelectionMode={showSelectionControls ? setSelectionMode : null}
        processingLabel={ocr.isProcessing ? 'Processing...' : ''}
        processButtonLabel={getProcessButtonLabel()}
        extractedData={ocr.extractedData}
        disabled={documents.length === 0}
      />

      {ocr.status && (
        <div
          className={`${styles.ocrStatus} ${
            ocr.status.startsWith('✅')
              ? styles.successStatus
              : ocr.status.startsWith('⚠️')
              ? styles.warningStatus
              : ocr.status.startsWith('❌')
              ? styles.errorStatus
              : styles.infoStatus
          }`}
        >
          {ocr.status}
        </div>
      )}

      {showAiAssistant && (
        <div className={styles.aiAssistantContainer}>
          <AiChat context={getAiContext()} />
        </div>
      )}
    </div>
  );
};

export default OcrPanel;
