import { EMAIL_LIST } from '../global/email-blocked-domains';
import { EMAIL_FEEDBACK_ELEMENT, EMAIL_INPUT_ELEMENT, styles } from '../global/variables';
import type { DOMElementsEmailValidation } from '../types/validation-types';

const messages = {
  businessEmail: {
    pl: 'Użyj biznesowego adresu email!',
    en: 'Please use business email!',
  },
  invalidFormat: {
    pl: 'Nieprawidłowy format adresu e-mail!',
    en: 'Invalid e-mail format!',
  },
};

export default function EmailValidation() {
  const htmlLang = document.documentElement.lang?.toLowerCase() || '';
  const browserLang = navigator.language?.toLowerCase() || '';
  const isPolishSite =
    htmlLang.startsWith('pl') || browserLang.startsWith('pl') || browserLang.includes('pl');

  const elements: DOMElementsEmailValidation = {
    emailInput: document.querySelector(EMAIL_INPUT_ELEMENT) as HTMLInputElement,
    emailMessage: document.querySelector(EMAIL_FEEDBACK_ELEMENT) as HTMLElement,
    submitButton: document.querySelector('[data-form-submit]') as HTMLButtonElement,
  };

  if (!elements.emailInput || !elements.emailMessage) {
    return;
  }

  function updateSubmitButtonState(isValid: boolean): void {
    if (elements.submitButton) {
      const form = elements.emailInput.closest('form');
      if (form) {
        const requiredFields = Array.from(form.querySelectorAll('[required]')) as Array<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >;

        const allRequiredFieldsFilled = requiredFields.every((field) => {
          if (field.type === 'checkbox' || field.type === 'radio') {
            return field.checked;
          }
          return field.value.trim() !== '';
        });

        elements.submitButton.disabled = !isValid || !allRequiredFieldsFilled;
      } else {
        elements.submitButton.disabled = !isValid;
      }

      if (elements.submitButton.disabled) {
        elements.submitButton.style.cursor = styles.error.cursor;
        elements.submitButton.style.opacity = styles.error.opacity;
      } else {
        elements.submitButton.style.cursor = styles.normal.cursor;
        elements.submitButton.style.opacity = styles.normal.opacity;
      }
    }
  }

  function showValidationError(message: string): void {
    elements.emailMessage.style.display = 'block';
    elements.emailMessage.innerText = message;
    elements.emailMessage.style.color = styles.error.color;
    elements.emailInput.style.borderBottomColor = styles.error.color;
    updateSubmitButtonState(false);
  }

  function resetValidationState(): void {
    elements.emailMessage.style.display = 'none';
    elements.emailMessage.innerText = '';
    elements.emailInput.style.borderBottomColor = styles.normal.color;
    updateSubmitButtonState(true);
  }

  function validateEmail(email: string): boolean {
    if (!email) {
      return false;
    }

    // Check format first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      if (isPolishSite) {
        showValidationError(messages.invalidFormat.pl);
      } else {
        showValidationError(messages.invalidFormat.en);
      }
      return false;
    }

    // Then check domain
    if (EMAIL_LIST.includes(email.split('@')[1])) {
      if (isPolishSite) {
        showValidationError(messages.businessEmail.pl);
      } else {
        showValidationError(messages.businessEmail.en);
      }
      return false;
    }

    return true;
  }

  function handleEmailValidation() {
    const email = elements.emailInput.value.trim();
    const isValid = validateEmail(email);

    if (isValid) {
      resetValidationState();
    }

    updateSubmitButtonState(isValid);
  }

  // Add form-wide validation handling
  const form = elements.emailInput.closest('form');
  if (form) {
    const inputSelector = 'input, select, textarea';

    form.querySelectorAll(inputSelector).forEach((input) => {
      input.addEventListener('input', handleEmailValidation);
      input.addEventListener('change', handleEmailValidation);
    });

    // Handle dynamically added form elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.matches(inputSelector)) {
            node.addEventListener('input', handleEmailValidation);
            node.addEventListener('change', handleEmailValidation);
          }
        });
      });
    });

    observer.observe(form, {
      childList: true,
      subtree: true,
    });
  }

  elements.emailInput.addEventListener('input', handleEmailValidation);

  // Initial validation
  handleEmailValidation();
}
