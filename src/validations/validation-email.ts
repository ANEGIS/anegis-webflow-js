import { EMAIL_LIST } from 'src/global/email-blocked-domains';
import {
  EMAIL_FEEDBACK_ELEMENT,
  EMAIL_INPUT_ELEMENT,
  FORM_SUBMIT_BUTTON,
} from 'src/global/variables';
import { styles } from 'src/global/variables';

export function EmailValidation(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize(): void {
    const htmlLang = document.documentElement.lang?.toLowerCase() || '';
    const browserLang = navigator.language?.toLowerCase() || '';
    const isPolish =
      htmlLang.startsWith('pl') || browserLang.startsWith('pl') || browserLang.includes('pl');

    const messages = {
      businessEmail: isPolish ? 'Użyj biznesowego adresu email!' : 'Please use business email!',
      invalidFormat: isPolish ? 'Nieprawidłowy format adresu e-mail!' : 'Invalid e-mail format!',
    };

    const emailInput = findElement<HTMLInputElement>(EMAIL_INPUT_ELEMENT);
    const emailMessage = findElement<HTMLElement>(EMAIL_FEEDBACK_ELEMENT);
    const submitButton = findElement<HTMLElement>(FORM_SUBMIT_BUTTON);
    const form = emailInput?.closest('form');

    if (!emailInput || !emailMessage || !submitButton) {
      console.error('Email validation: Required elements not found');
      return;
    }

    function isValidEmailFormat(email: string): boolean {
      if (!email || !email.includes('@')) return false;

      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      return emailRegex.test(email);
    }

    function isAllowedDomain(email: string): boolean {
      if (!email || !email.includes('@')) return false;

      const parts = email.split('@');
      if (parts.length !== 2) return false;

      const domain = parts[1].toLowerCase();
      return !EMAIL_LIST.includes(domain);
    }

    function showError(message: string): void {
      if (emailMessage) emailMessage.style.display = 'block';
      if (emailMessage) emailMessage.textContent = message;
      if (emailMessage) emailMessage.style.color = styles.error.color;
      if (emailInput) emailInput.style.borderBottomColor = styles.error.color;
      disableSubmitButton();
    }

    function clearError(): void {
      if (emailMessage) emailMessage.style.display = 'none';
      if (emailMessage) emailMessage.textContent = '';
      if (emailInput) emailInput.style.borderBottomColor = styles.normal.color;
    }

    function disableSubmitButton(): void {
      if (submitButton) submitButton.setAttribute('disabled', 'disabled');
      if (submitButton) submitButton.style.cursor = styles.error.cursor;
      if (submitButton) submitButton.style.opacity = styles.error.opacity;
    }

    function enableSubmitButton(): void {
      if (submitButton) submitButton.removeAttribute('disabled');
      if (submitButton) submitButton.style.cursor = styles.normal.cursor;
      if (submitButton) submitButton.style.opacity = styles.normal.opacity;
    }

    function areRequiredFieldsValid(): boolean {
      if (!form) return true;

      const requiredFields = form.querySelectorAll('[required]');

      return Array.from(requiredFields).every((field) => {
        if (field instanceof HTMLInputElement) {
          if (field.type === 'checkbox' || field.type === 'radio') {
            return field.checked;
          }
          return field.value.trim() !== '';
        }

        if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
          return field.value.trim() !== '';
        }

        return true;
      });
    }

    function validateAndUpdateUI(): void {
      const email = emailInput?.value.trim();

      if (!email) {
        clearError();
        disableSubmitButton();
        return;
      }

      if (!isValidEmailFormat(email)) {
        if (email.includes('@')) {
          showError(messages.invalidFormat);
        } else {
          clearError();
        }
        disableSubmitButton();
        return;
      }

      if (!isAllowedDomain(email)) {
        showError(messages.businessEmail);
        disableSubmitButton();
        return;
      }

      clearError();

      if (areRequiredFieldsValid()) {
        enableSubmitButton();
      } else {
        disableSubmitButton();
      }
    }

    ['input', 'keyup', 'change', 'blur'].forEach((eventType) => {
      emailInput.addEventListener(eventType, validateAndUpdateUI);
    });

    if (form) {
      form.querySelectorAll('input, select, textarea').forEach((element) => {
        ['input', 'change', 'blur'].forEach((eventType) => {
          element.addEventListener(eventType, validateAndUpdateUI);
        });
      });

      form.addEventListener('submit', (event) => {
        const email = emailInput.value.trim();

        if (!isValidEmailFormat(email) || !isAllowedDomain(email)) {
          event.preventDefault();
          validateAndUpdateUI();
          return false;
        }

        if (!areRequiredFieldsValid()) {
          event.preventDefault();
          return false;
        }

        return true;
      });
    }

    validateAndUpdateUI();
  }

  function findElement<T extends HTMLElement>(...selectors: string[]): T | null {
    for (const selector of selectors) {
      const element = document.querySelector(selector) as T;
      if (element) return element;
    }
    return null;
  }
}
