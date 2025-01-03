// Types
type ValidationResult = {
  isValid: boolean;
  error?: string;
  normalizedVatId?: string;
};

type DOMElements = {
  inputBox: HTMLInputElement;
  msgVatID: HTMLElement;
  submitButton: HTMLButtonElement;
};

type Styles = {
  error: {
    color: string;
    opacity: string;
  };
  normal: {
    color: string;
    opacity: string;
  };
};

// Constants
const WEIGHTS: readonly number[] = [6, 5, 7, 2, 3, 4, 5, 6, 7];
const VALID_LENGTH = 10;
const MSG_CHARS_EXCEED = 'Numer NIP jest za długi';
const MSG_CHARS_RECEDE = 'Numer NIP jest za krótki';
const MSG_CHARS_INVALID = 'Numer NIP jest nieprawidłowy!';
const BASIC_COLOR = 'var(--turquise-a)';
const ERROR_COLOR = 'var(--alert-hover)';

export function VatValidation() {
  const htmlLang = document.documentElement.lang?.toLowerCase() || '';
  const browserLang = navigator.language?.toLowerCase() || '';
  const isPolishSite =
    htmlLang.startsWith('pl') || browserLang.startsWith('pl') || browserLang.includes('pl');

  // Only proceed if the site is in Polish
  if (!isPolishSite) {
    console.log('VAT ID validation is only enabled for Polish language sites');
    return;
  }

  // DOM Elements
  const elements: DOMElements = {
    inputBox: document.querySelector('[data-nip-input]') as HTMLInputElement,
    msgVatID: document.querySelector('[data-nip-feedback]') as HTMLElement,
    submitButton: document.querySelector('[data-nip-submit]') as HTMLButtonElement,
  };

  // Exit if required elements are not found
  if (!elements.inputBox || !elements.msgVatID || !elements.submitButton) {
    console.warn('Required DOM elements for VAT ID validation not found');
    return;
  }

  // Styles
  const styles: Styles = {
    error: {
      color: ERROR_COLOR,
      opacity: '0.5',
    },
    normal: {
      color: BASIC_COLOR,
      opacity: '1',
    },
  };

  /**
   * Validates a Polish VAT ID (NIP)
   */
  function validatePolishVatId(vatId: string): ValidationResult {
    const cleanVatId = vatId.replace(/[\s-]/g, '');

    if (!/^\d{10}$/.test(cleanVatId)) {
      return {
        isValid: false,
        error: `VAT ID must contain exactly ${VALID_LENGTH} digits`,
      };
    }

    const digits = cleanVatId.split('').map(Number);
    const sum = WEIGHTS.reduce((acc, weight, index) => acc + weight * digits[index], 0);
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
    elements.msgVatID.style.display = 'block';
    elements.msgVatID.innerText = message;
    elements.msgVatID.style.color = styles.error.color;
    elements.inputBox.style.borderBottomColor = styles.error.color;
    elements.submitButton.setAttribute('disabled', 'true');
    elements.submitButton.style.opacity = styles.error.opacity;
  }

  /**
   * Resets UI to normal state
   */
  function resetValidationState(): void {
    elements.msgVatID.style.display = 'none';
    elements.msgVatID.innerText = '';
    elements.inputBox.style.borderBottomColor = styles.normal.color;
    elements.submitButton.removeAttribute('disabled');
    elements.submitButton.style.opacity = styles.normal.opacity;
  }

  /**
   * Handles VAT ID validation and UI updates
   */
  function handleVatIdValidation(value: string): void {
    const result = validatePolishVatId(value);

    if (result.isValid) {
      console.log('Valid VAT ID:', result.normalizedVatId);
      resetValidationState();
    } else if (value.length > VALID_LENGTH) {
      showValidationError(MSG_CHARS_EXCEED);
    } else if (value.length < VALID_LENGTH) {
      showValidationError(MSG_CHARS_RECEDE);
    } else {
      console.log('Invalid VAT ID:', result.error);
      showValidationError(MSG_CHARS_INVALID);
    }
  }

  /**
   * Observes changes to an element's property
   */
  function observeElement<T extends HTMLElement>(
    element: T,
    property: keyof T,
    callback: (oldValue: any, newValue: any) => void,
    delay: number = 0
  ): void {
    const elementPrototype = Object.getPrototypeOf(element);

    if (elementPrototype.hasOwnProperty(property)) {
      const descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);

      if (descriptor) {
        Object.defineProperty(element, property, {
          get: function () {
            return descriptor.get?.apply(this, arguments);
          },
          set: function () {
            const oldValue = this[property];
            descriptor.set?.apply(this, arguments);
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

  // Event Listeners
  elements.inputBox.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    console.log("Input value changed via UI. New value: '%s'", target.value);
    handleVatIdValidation(target.value);
  });

  // Observer setup
  observeElement(elements.inputBox, 'value', (oldValue: string, newValue: string) => {
    console.log("Input value changed via API. Value changed from '%s' to '%s'", oldValue, newValue);
  });

  // Example test cases
  const testVatIds: string[] = [
    '5270103391', // Valid
    '123-456-78-90', // Invalid
    '1234567890', // Invalid
    '527-010-33-91', // Valid but with formatting
  ];

  // Run tests
  testVatIds.forEach((vatId) => {
    const result = validatePolishVatId(vatId);
    console.log(`VAT ID: ${vatId}`);
    console.log('Result:', result);
    console.log('---');
  });
}
