import { styles } from '../global/variables';
import type { DOMElementsVatValidation, ValidationResult } from '../types/validation-types';

const VATID_PL_WEIGHTS: readonly number[] = [6, 5, 7, 2, 3, 4, 5, 6, 7];
const VATID_VALID_LENGTH = 10;
const VATID_MSG_CHARS_EXCEED = 'Numer NIP jest za długi';
const VATID_MSG_CHARS_RECEDE = 'Numer NIP jest za krótki';
const VATID_MSG_CHARS_INVALID = 'Numer NIP jest nieprawidłowy!';

const VATID_INPUT_ELEMENT = '[data-vat-input]';
const VATID_FEEDBACK_ELEMENT = '[data-vat-feedback]';

export default function VatValidation() {
  const htmlLang = document.documentElement.lang?.toLowerCase() || '';
  const browserLang = navigator.language?.toLowerCase() || '';
  const isPolishSite =
    htmlLang.startsWith('pl') || browserLang.startsWith('pl') || browserLang.includes('pl');

  if (!isPolishSite) {
    console.log('VAT validation is NOT running');
    return;
  }

  // DOM Elements
  const elements: DOMElementsVatValidation = {
    vatIdInput: document.querySelector(VATID_INPUT_ELEMENT) as HTMLInputElement,
    vatIdMessage: document.querySelector(VATID_FEEDBACK_ELEMENT) as HTMLElement,
  };

  if (!elements.vatIdInput || !elements.vatIdMessage) {
    return;
  }

  function validatePolishVatId(vatId: string): ValidationResult {
    const cleanVatId = vatId.replace(/[\s-]/g, '');

    if (!/^\d{10}$/.test(cleanVatId)) {
      return {
        isValid: false,
        error: `VAT ID must contain exactly ${VATID_VALID_LENGTH} digits`,
      };
    }

    const digits = cleanVatId.split('').map(Number);
    const sum = VATID_PL_WEIGHTS.reduce((acc, weight, index) => acc + weight * digits[index], 0);
    const checkDigit = digits[9];
    const expectedCheckDigit = sum % 11;

    return expectedCheckDigit === checkDigit
      ? { isValid: true, normalizedVatId: cleanVatId }
      : { isValid: false, error: 'Invalid checksum' };
  }

  /**
   * Updates UI to show validation error
   */
  function showValidationError(message: string): void {
    elements.vatIdMessage.style.display = 'block';
    elements.vatIdMessage.innerText = message;
    elements.vatIdMessage.style.color = styles.error.color;
    elements.vatIdInput.style.borderBottomColor = styles.error.color;
  }

  function resetValidationState(): void {
    elements.vatIdMessage.style.display = 'none';
    elements.vatIdMessage.innerText = '';
    elements.vatIdInput.style.borderBottomColor = styles.normal.color;
  }

  function handleVatIdValidation(value: string): void {
    const result = validatePolishVatId(value);

    if (result.isValid) {
      resetValidationState();
    } else if (value.length > VATID_VALID_LENGTH) {
      showValidationError(VATID_MSG_CHARS_EXCEED);
    } else if (value.length < VATID_VALID_LENGTH) {
      showValidationError(VATID_MSG_CHARS_RECEDE);
    } else {
      showValidationError(VATID_MSG_CHARS_INVALID);
    }
  }

  function observeElement<T extends HTMLElement>(
    element: T,
    property: keyof T,
    callback: (oldValue: unknown, newValue: unknown) => void,
    delay: number = 0
  ): void {
    const elementPrototype = Object.getPrototypeOf(element);

    if (Object.prototype.hasOwnProperty.call(elementPrototype, property)) {
      const descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);

      if (descriptor) {
        Object.defineProperty(element, property, {
          get: function (this: T) {
            return descriptor.get?.call(this);
          },
          set: function (this: T, value: unknown) {
            const oldValue = this[property];
            descriptor.set?.call(this, value);
            const newValue = this[property];

            if (typeof callback === 'function') {
              setTimeout(callback.bind(this, oldValue, newValue), delay);
            }
            return newValue;
          },
        });
      }
    }
  }

  elements.vatIdInput.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    handleVatIdValidation(target.value);
  });

  observeElement(elements.vatIdInput, 'value', (newValue: unknown) => {
    handleVatIdValidation(String(newValue));
  });
}
