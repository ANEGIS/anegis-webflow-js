import { EMAIL_LIST } from 'src/global/email-blocked-domains';
import { EMAIL_FEEDBACK_ELEMENT, EMAIL_INPUT_ELEMENT, styles } from 'src/global/variables';

import { updateFormSubmitState } from '../utils/submit-button';

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

    const emailInputs = document.querySelectorAll<HTMLInputElement>(EMAIL_INPUT_ELEMENT);
    const emailPairs = new Map<HTMLInputElement, HTMLElement>();

    emailInputs.forEach((input) => {
      const form = input.closest('form');
      if (!form) return;

      const feedbackElement = form.querySelector<HTMLElement>(EMAIL_FEEDBACK_ELEMENT);
      if (feedbackElement) {
        emailPairs.set(input, feedbackElement);
      }
    });

    if (emailPairs.size === 0) {
      console.error('Email validation: No matching email input and feedback elements found');
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

    function showError(input: HTMLInputElement, message: string): void {
      const feedbackElement = emailPairs.get(input);
      if (feedbackElement) {
        feedbackElement.style.display = 'block';
        feedbackElement.textContent = message;
        feedbackElement.style.color = styles.error.color;
      }
      input.style.borderBottomColor = styles.error.color;

      const form = input.closest('form');
      if (form) {
        updateFormSubmitState(form, false);
      }
    }

    function clearError(input: HTMLInputElement): void {
      const feedbackElement = emailPairs.get(input);
      if (feedbackElement) {
        feedbackElement.style.display = 'none';
        feedbackElement.textContent = '';
      }
      input.style.borderBottomColor = styles.normal.color;
    }

    function validateAndUpdateUI(input: HTMLInputElement): void {
      const form = input.closest('form');
      if (!form) return;

      const email = input.value.trim();

      if (!email) {
        clearError(input);
        updateFormSubmitState(form, false);
        return;
      }

      if (!isValidEmailFormat(email)) {
        if (email.includes('@')) {
          showError(input, messages.invalidFormat);
        } else {
          clearError(input);
        }
        updateFormSubmitState(form, false);
        return;
      }

      if (!isAllowedDomain(email)) {
        showError(input, messages.businessEmail);
        updateFormSubmitState(form, false);
        return;
      }

      clearError(input);
      updateFormSubmitState(form, true);
    }

    emailPairs.forEach((_, input) => {
      ['input', 'keyup', 'change', 'blur'].forEach((eventType) => {
        input.addEventListener(eventType, () => validateAndUpdateUI(input));
      });

      const form = input.closest('form');
      if (form) {
        form
          .querySelectorAll<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >('input, select, textarea')
          .forEach((element) => {
            ['input', 'change', 'blur'].forEach((eventType) => {
              element.addEventListener(eventType, () => validateAndUpdateUI(input));
            });
          });

        form.addEventListener('submit', (event: Event) => {
          const email = input.value.trim();

          if (!isValidEmailFormat(email) || !isAllowedDomain(email)) {
            event.preventDefault();
            validateAndUpdateUI(input);
            return false;
          }

          if (!email && input.hasAttribute('required')) {
            event.preventDefault();
            return false;
          }

          return true;
        });
      }

      validateAndUpdateUI(input);
    });
  }
}
