import { PHONE_FEEDBACK_ELEMENT, PHONE_INPUT_ELEMENT } from '../global/variables';
import { updateFormSubmitState } from '../utils/submit-button';

export function WACPhoneValidation(): void {
  console.log('WACPhoneValidation – Works!');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize(): void {
    const messages = {
      required: 'Numer telefonu jest wymagany',
      invalidFormat: 'Numer telefonu musi zawierać 9 cyfr',
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

      const digits = phone.replace(/\D/g, '');

      return digits.length === 9 && /^\d+$/.test(digits);
    }

    function extractNineDigits(phone: string): string {
      if (!phone) return '';

      const digits = phone.replace(/\D/g, '');
      return digits.slice(-9);
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

      // Check if has valid format (9 digits)
      if (!isValidPhoneFormat(phone)) {
        showError(input, messages.invalidFormat);
        updateFormSubmitState(form, false);
        return;
      }

      clearError(input);
      updateFormSubmitState(form, true);
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

          if (phone && !isValidPhoneFormat(phone)) {
            event.preventDefault();
            validateAndUpdateUI(input);
            return false;
          }

          // Extract 9 digits and add +48 prefix on submit
          if (phone) {
            const nineDigits = extractNineDigits(phone);
            input.value = '+48' + nineDigits;
          }

          return true;
        });
      }

      validateAndUpdateUI(input);
    });
  }
}
