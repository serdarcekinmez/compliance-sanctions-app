import React from 'react';
import { Input, TextArea, Select } from '../../components/common/Input';
import { PrimaryButton, SecondaryButton, DangerButton } from '../../components/common/Button';
import styles from './RegistrationForm.module.css';

const RegistrationForm = ({ 
  formData,
  handleChange,
  validationErrors,
  loading,
  error,
  onSubmit,
  onBack,
  ocrUpdatedFields = []
}) => {
  const isAutoFilled = (fieldName) => (
    ocrUpdatedFields.includes(fieldName) &&
    !!formData[fieldName]
  );
  const showOcrNotice = ocrUpdatedFields.length > 0;

  return (
    <div className={styles.formContainer}>
      <h2>Registration Details</h2>

      {showOcrNotice && (
        <div className={styles.ocrNotice}>
          <span className={styles.ocrBadge}>OCR</span>
          Some fields were filled automatically. You can edit any field if needed.
        </div>
      )}

      <form className={styles.form} onSubmit={e => { e.preventDefault(); onSubmit(); }}>
        <div className={styles.mainLayout}>

          {/* Left column */}
          <div className={styles.leftColumn}>

            {/* Personal Information */}
            <div className={styles.section}>
              <h3>Personal Information</h3>
              <Input
                id="name" name="name" label="First Name(s)"
                value={formData.name} onChange={handleChange}
                required error={validationErrors.name}
                className={isAutoFilled('name') ? styles.prefilledField : ''}
              />
              <Input
                id="surname" name="surname" label="Last Name"
                value={formData.surname} onChange={handleChange}
                required error={validationErrors.surname}
                className={isAutoFilled('surname') ? styles.prefilledField : ''}
              />
              <div className={styles.inlineFields}>
                <Select
                  id="sex" name="sex" label="Sex"
                  value={formData.sex} onChange={handleChange}
                  error={validationErrors.sex}
                  className={isAutoFilled('sex') ? styles.prefilledField : ''}
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="X">Other</option>
                </Select>
                <Input
                  id="nationality" name="nationality" label="Nationality"
                  value={formData.nationality} onChange={handleChange}
                  placeholder="e.g. FRA"
                  error={validationErrors.nationality}
                  className={isAutoFilled('nationality') ? styles.prefilledField : ''}
                />
              </div>
              <Input
                id="birthDate" name="birthDate" label="Birth Date"
                value={formData.birthDate} onChange={handleChange}
                placeholder="YYYY-MM-DD"
                error={validationErrors.birthDate}
                className={isAutoFilled('birthDate') ? styles.prefilledField : ''}
              />
              <Input
                id="birthPlace" name="birthPlace" label="Birth Place"
                value={formData.birthPlace} onChange={handleChange}
                placeholder="City of birth"
                error={validationErrors.birthPlace}
                className={isAutoFilled('birthPlace') ? styles.prefilledField : ''}
              />
            </div>

            {/* Bottom sections: Contact & Document Info side by side */}
            <div className={styles.bottomSections}>

              {/* Contact Information */}
              <div className={styles.bottomSection}>
                <h3>Contact Information</h3>
                <TextArea
                  id="address" name="address" label="Address"
                  value={formData.address} onChange={handleChange}
                  placeholder="Full address including country"
                  error={validationErrors.address}
                  className={isAutoFilled('address') ? styles.prefilledField : ''}
                  rows={3}
                />
                <Input
                  id="telephone" name="telephone" label="Telephone"
                  value={formData.telephone} onChange={handleChange}
                  placeholder="Phone number"
                  error={validationErrors.telephone}
                />
                <Input
                  id="email" name="email" type="email" label="Email"
                  value={formData.email} onChange={handleChange}
                  placeholder="Email address"
                  error={validationErrors.email}
                />
              </div>

              {/* Document Information */}
              <div className={styles.bottomSection}>
                <h3>Document Information</h3>
                <Input
                  id="documentNumber" name="documentNumber" label="Document Number"
                  value={formData.documentNumber} onChange={handleChange}
                  placeholder="ID/Passport number"
                  error={validationErrors.documentNumber}
                  className={isAutoFilled('documentNumber') ? styles.prefilledField : ''}
                />
                <Input
                  id="documentIssuePlace" name="documentIssuePlace" label="Place of Issue"
                  value={formData.documentIssuePlace} onChange={handleChange}
                  placeholder="City/Authority"
                  error={validationErrors.documentIssuePlace}
                  className={isAutoFilled('documentIssuePlace') ? styles.prefilledField : ''}
                />
                <Input
                  id="documentIssueDate" name="documentIssueDate" label="Issue Date"
                  value={formData.documentIssueDate} onChange={handleChange}
                  placeholder="YYYY-MM-DD"
                  error={validationErrors.documentIssueDate}
                  className={isAutoFilled('documentIssueDate') ? styles.prefilledField : ''}
                />
                <Input
                  id="expiryDate" name="expiryDate" label="Expiry Date"
                  value={formData.expiryDate} onChange={handleChange}
                  placeholder="YYYY-MM-DD or 'unlimited'"
                  error={validationErrors.expiryDate}
                  className={isAutoFilled('expiryDate') ? styles.prefilledField : ''}
                />
              </div>

            </div>
          </div>

          {/* Right column */}
          <div className={styles.rightColumn}>
            <div className={styles.section}>
              <h3>Transaction Details</h3>
              <Input
                id="transactionNumber" name="transactionNumber" label="Transaction Number"
                value={formData.transactionNumber} onChange={handleChange}
                required error={validationErrors.transactionNumber}
              />
              <Input
                id="transactionAmount" name="transactionAmount" type="number" label="Transaction Amount"
                value={formData.transactionAmount} onChange={handleChange}
                required error={validationErrors.transactionAmount}
              />
              <Input
                id="euroEquivalent" name="euroEquivalent" type="number" label="Euro Equivalent"
                value={formData.euroEquivalent} onChange={handleChange}
                error={validationErrors.euroEquivalent}
              />
              <Select
                id="transactionNature" name="transactionNature" label="Transaction Nature"
                value={formData.transactionNature} onChange={handleChange}
                required error={validationErrors.transactionNature}
              >
                <option value="">Select an option</option>
                <option value="exchange">Exchange</option>
                <option value="cash_advance">Cash Advance</option>
                <option value="travel_checks">Travel Checks</option>
                <option value="custom_vat">Custom VAT</option>
              </Select>
              <TextArea
                id="transactionIntent" name="transactionIntent" label="Transaction Intent"
                value={formData.transactionIntent} onChange={handleChange}
                rows={3} error={validationErrors.transactionIntent}
                placeholder="Why is the customer making the transaction?"
              />
            </div>
            <div className={styles.section}>
              <h3>Additional Information</h3>
              <Input
                id="salaryOrigin" name="salaryOrigin" label="Source of Funds"
                value={formData.salaryOrigin} onChange={handleChange}
                placeholder="e.g. Employment, Business, etc."
                error={validationErrors.salaryOrigin}
              />
              <Select
                id="suspicious" name="suspicious" label="Suspicious Transaction"
                value={formData.suspicious} onChange={handleChange}
                error={validationErrors.suspicious}
              >
                <option value="N">No</option>
                <option value="Y">Yes</option>
              </Select>
              <TextArea
                id="agentObservations" name="agentObservations" label="Agent Observations"
                value={formData.agentObservations} onChange={handleChange}
                rows={2} error={validationErrors.agentObservations}
                placeholder="Any additional observations"
              />
            </div>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.formActions}>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onBack}>
            Back to Search
          </SecondaryButton>
          <DangerButton
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
                onBack();
              }
            }}
          >
            Cancel & Reset
          </DangerButton>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
