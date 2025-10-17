import { PHONE_FEEDBACK_ELEMENT, PHONE_INPUT_ELEMENT } from '../global/variables';
import { updateFormSubmitState } from '../utils/submit-button';

export function WACPhoneValidation(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize(): void {
    const messages = {
      required: 'Numer telefonu jest wymagany',
      invalidFormat: 'Numer telefonu musi zawierać 9 cyfr',
      missingPrefix: 'Numer telefonu musi zaczynać się od +48 lub 0048',
    };

    const phoneInputs = document.querySelectorAll<HTMLInputElement>(PHONE_INPUT_ELEMENT);
    const phonePairs = new Map<HTMLInputElement, HTMLElement>();

    phoneInputs.forEach((input) => {
      const form = input.closest('form');
      if (!form) return;

      const feedbackElement = form.querySelector<HTMLElement>(PHONE_FEEDBACK_ELEMENT);
      if (feedbackElement) {
        phonePairs.set(input, feedbackElement);
      }
    });

    if (phonePairs.size === 0) return;

    function isValidPhoneFormat(phone: string): boolean {
      if (!phone) return false;

      // Remove all non-digit characters except leading +
      const digits = phone.replace(/\D/g, '');

      // Should be exactly 9 digits (without country code)
      return digits.length === 9 && /^\d+$/.test(digits);
    }

    function hasValidPrefix(phone: string): boolean {
      if (!phone) return false;

      return phone.startsWith('+48') || phone.startsWith('0048');
    }

    function normalizePhoneNumber(phone: string): string {
      if (!phone) return '';

      const trimmed = phone.trim();

      // If already has +48 prefix
      if (trimmed.startsWith('+48')) {
        const digits = trimmed.replace(/\D/g, '');
        return '+48' + digits.slice(-9);
      }

      // If has 0048 prefix
      if (trimmed.startsWith('0048')) {
        const digits = trimmed.replace(/\D/g, '');
        return '+48' + digits.slice(-9);
      }

      // If starts with 0 (Polish local format)
      if (trimmed.startsWith('0')) {
        const digits = trimmed.replace(/\D/g, '');
        return '+48' + digits.slice(-9);
      }

      // If just digits without any prefix
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length === 9) {
        return '+48' + digits;
      }

      return '';
    }

    function showError(input: HTMLInputElement, message: string): void {
      const feedbackElement = phonePairs.get(input);
      if (feedbackElement) {
        feedbackElement.style.display = 'flex';
        feedbackElement.textContent = message;
      }

      const form = input.closest('form');
      if (form) {
        updateFormSubmitState(form, false);
      }
    }

    function clearError(input: HTMLInputElement): void {
      const feedbackElement = phonePairs.get(input);
      if (feedbackElement) {
        feedbackElement.style.display = 'none';
        feedbackElement.textContent = '';
      }
    }

    function validateAndUpdateUI(input: HTMLInputElement): void {
      const form = input.closest('form');
      if (!form) return;

      const phone = input.value.trim();

      if (!phone) {
        clearError(input);
        updateFormSubmitState(form, false);
        return;
      }

      // Check if has valid prefix
      if (!hasValidPrefix(phone)) {
        showError(input, messages.missingPrefix);
        updateFormSubmitState(form, false);
        return;
      }

      // Check if has valid format (9 digits)
      if (!isValidPhoneFormat(phone)) {
        showError(input, messages.invalidFormat);
        updateFormSubmitState(form, false);
        return;
      }

      // Normalize and set the formatted value
      const normalized = normalizePhoneNumber(phone);
      if (normalized) {
        input.value = normalized;
        clearError(input);
        updateFormSubmitState(form, true);
      } else {
        showError(input, messages.invalidFormat);
        updateFormSubmitState(form, false);
      }
    }

    phonePairs.forEach((_, input) => {
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
          const phone = input.value.trim();

          if (!phone && input.hasAttribute('required')) {
            event.preventDefault();
            showError(input, messages.required);
            return false;
          }

          if (phone && (!hasValidPrefix(phone) || !isValidPhoneFormat(phone))) {
            event.preventDefault();
            validateAndUpdateUI(input);
            return false;
          }

          // Normalize before submit
          if (phone) {
            const normalized = normalizePhoneNumber(phone);
            input.value = normalized;
          }

          return true;
        });
      }

      validateAndUpdateUI(input);
    });
  }
}
