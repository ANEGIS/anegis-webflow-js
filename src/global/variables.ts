import type { Styles } from '../types/validation-types';

/* COLORS */
export const BASIC_COLOR = 'var(--turquise-a)';
export const ERROR_COLOR = 'var(--alert-hover)';
/* end of V:COLORS */

/* ATTRIBUTES */
export const FORM_SUBMIT_BUTTON = '[data-form-submit]';
export const EMAIL_INPUT_ELEMENT = '[data-email-input]';
export const EMAIL_FEEDBACK_ELEMENT = '[data-email-feedback]';
export const PHONE_INPUT_ELEMENT = '[data-phone-input]';
export const PHONE_FEEDBACK_ELEMENT = '[data-phone-feedback]';
export const VATID_INPUT_ELEMENT = '[data-vat-input]';
export const VATID_FEEDBACK_ELEMENT = '[data-vat-feedback]';
export const VATID_COUNTRY_ELEMENT = '[data-vat-country]';
/* end of ATTRIBUTES */

/* ELEMENTS */
export const elements = {
  submitButton: {
    attribute: FORM_SUBMIT_BUTTON,
    query: document.querySelector(FORM_SUBMIT_BUTTON),
  },
  emailInput: {
    attribute: EMAIL_INPUT_ELEMENT,
    query: document.querySelector(EMAIL_INPUT_ELEMENT),
  },
  vatInput: {
    attribute: VATID_INPUT_ELEMENT,
    query: document.querySelector(VATID_INPUT_ELEMENT),
  },
};
/* end of ELEMENTS */

/* STYLES */
export const styles: Styles = {
  error: {
    color: ERROR_COLOR,
    opacity: '0.5',
    cursor: 'not-allowed',
  },
  normal: {
    color: BASIC_COLOR,
    opacity: '1',
    cursor: 'pointer',
  },
};
/* end of STYLES */
