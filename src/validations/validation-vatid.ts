import { checkVAT, countries } from 'jsvat';

import {
  styles,
  VATID_COUNTRY_ELEMENT,
  VATID_FEEDBACK_ELEMENT,
  VATID_INPUT_ELEMENT,
} from '../global/variables';
import type { DOMElementsVatValidation, ValidationResult } from '../types/validation-types';

const isPolishSite = document.documentElement.lang?.toLowerCase().startsWith('pl');

const SUPPORTED_COUNTRIES = countries.map((country) => ({
  code: country.codes[0],
  emoji: getCountryEmoji(country.codes[0]),
  pattern: country.rules.regex[0],
  messages: {
    tooShort: isPolishSite ? `NIP jest za krótki` : `VAT number is too short`,
    tooLong: isPolishSite ? `NIP jest za długi` : `VAT number is too long`,
    invalid: isPolishSite ? `Nieprawidłowy numer NIP` : `Invalid VAT number format`,
  },
}));

function getCountryEmoji(countryCode: string) {
  const offset = 127397;
  const emoji = countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + offset))
    .join('');
  return emoji;
}

export default function VatValidation() {
  const elements: DOMElementsVatValidation & {
    submitButton?: HTMLButtonElement | HTMLInputElement;
  } = {
    vatInput: document.querySelector(VATID_INPUT_ELEMENT) as HTMLInputElement,
    vatMessage: document.querySelector(VATID_FEEDBACK_ELEMENT) as HTMLElement,
    vatSelect: document.querySelector(VATID_COUNTRY_ELEMENT) as HTMLSelectElement,
  };

  if (!elements.vatInput || !elements.vatMessage) return;

  elements.submitButton =
    elements.vatInput
      .closest('form')
      ?.querySelector('button[type="submit"], input[type="submit"]') || undefined;

  function getBrowserCountry(): string {
    const browserLang = navigator.language;
    const countryCode = browserLang.split('-')[1]?.toUpperCase() || browserLang.toUpperCase();
    const isValidCountry = SUPPORTED_COUNTRIES.some((country) => country.code === countryCode);
    if (isPolishSite) {
      return isValidCountry ? countryCode : 'PL';
    }
    return isValidCountry ? countryCode : 'GB';
  }

  function createVatSelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.setAttribute('data-vat-country', '');
    const defaultCountry = getBrowserCountry();

    SUPPORTED_COUNTRIES.forEach((country) => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = `${country.emoji} ${country.code}`;
      option.selected = country.code === defaultCountry;
      select.appendChild(option);
    });

    return select;
  }

  if (!elements.vatSelect) {
    const select = createVatSelect();
    elements.vatInput.parentNode?.insertBefore(select, elements.vatInput);
    elements.vatSelect = select;
  } else {
    elements.vatSelect.innerHTML = '';
    const defaultCountry = getBrowserCountry();
    SUPPORTED_COUNTRIES.forEach((country) => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = `${country.emoji} ${country.code}`;
      option.selected = country.code === defaultCountry;
      elements.vatSelect?.appendChild(option);
    });
  }

  function extractCountryCode(vat: string): { countryCode: string | null; vatNumber: string } {
    const cleanVat = vat.replace(/[\s-]/g, '');
    const countryCodeMatch = cleanVat.match(/^([A-Za-z]{2})/);

    if (countryCodeMatch) {
      const countryCode = countryCodeMatch[1].toUpperCase();
      const isValidCountry = SUPPORTED_COUNTRIES.some((country) => country.code === countryCode);
      if (isValidCountry) {
        return {
          countryCode,
          vatNumber: cleanVat.substring(2),
        };
      }
    }

    return {
      countryCode: null,
      vatNumber: cleanVat,
    };
  }

  function getSelectedCountry(): string {
    return elements.vatSelect ? elements.vatSelect.value : getBrowserCountry();
  }

  function validateVatId(vat: string): ValidationResult {
    const { countryCode, vatNumber } = extractCountryCode(vat);
    const selectedCountry = countryCode || getSelectedCountry();

    // Update dropdown if country code is detected in input
    if (countryCode && elements.vatSelect && elements.vatSelect.value !== countryCode) {
      elements.vatSelect.value = countryCode;
    }

    const countryConfig = SUPPORTED_COUNTRIES.find((config) => config.code === selectedCountry);
    if (!countryConfig) return { isValid: false, error: 'Unsupported country' };

    const fullVatNumber = `${selectedCountry}${vatNumber}`;
    if (!countryConfig.pattern.test(fullVatNumber)) {
      if (vatNumber.length > countryConfig.pattern.toString().length - 2) {
        return { isValid: false, error: countryConfig.messages.tooLong };
      }
      if (vatNumber.length < countryConfig.pattern.toString().length - 2) {
        return { isValid: false, error: countryConfig.messages.tooShort };
      }
      return { isValid: false, error: countryConfig.messages.invalid };
    }

    const jsvatResult = checkVAT(fullVatNumber, countries);
    return jsvatResult.isValid
      ? { isValid: true, normalizedVatId: fullVatNumber }
      : { isValid: false, error: countryConfig.messages.invalid };
  }

  function updateSubmitButtonState(isValid: boolean): void {
    if (elements.submitButton) {
      const form = elements.vatInput.closest('form');
      if (form) {
        const requiredFields = Array.from(form.querySelectorAll('[required]')) as Array<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >;

        const allRequiredFieldsFilled = requiredFields.every((field) => {
          if (
            field instanceof HTMLInputElement &&
            (field.type === 'checkbox' || field.type === 'radio')
          ) {
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
    elements.vatMessage.style.display = 'block';
    elements.vatMessage.innerText = message;
    elements.vatMessage.style.color = styles.error.color;
    elements.vatInput.style.borderBottomColor = styles.error.color;
    elements.vatSelect.style.borderBottomColor = styles.error.color;
    updateSubmitButtonState(false);
  }

  function resetValidationState(): void {
    elements.vatMessage.style.display = 'none';
    elements.vatMessage.innerText = '';
    elements.vatInput.style.borderBottomColor = styles.normal.color;
    elements.vatSelect.style.borderBottomColor = styles.normal.color;
    const currentVatValidation = validateVatId(elements.vatInput.value);
    updateSubmitButtonState(currentVatValidation.isValid);
  }

  function handleVatIdValidation(): void {
    const { value } = elements.vatInput;
    const result = validateVatId(value);

    if (result.isValid) {
      resetValidationState();
    } else if (result.error) {
      showValidationError(result.error);
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

  const form = elements.vatInput.closest('form');
  if (form) {
    const inputSelector = 'input, select, textarea';
    form.querySelectorAll(inputSelector).forEach((input) => {
      input.addEventListener('input', () => {
        const currentVatValidation = validateVatId(elements.vatInput.value);
        updateSubmitButtonState(currentVatValidation.isValid);
      });

      input.addEventListener('change', () => {
        const currentVatValidation = validateVatId(elements.vatInput.value);
        updateSubmitButtonState(currentVatValidation.isValid);
      });
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.matches(inputSelector)) {
            node.addEventListener('input', () => {
              const currentVatValidation = validateVatId(elements.vatInput.value);
              updateSubmitButtonState(currentVatValidation.isValid);
            });

            node.addEventListener('change', () => {
              const currentVatValidation = validateVatId(elements.vatInput.value);
              updateSubmitButtonState(currentVatValidation.isValid);
            });
          }
        });
      });
    });

    observer.observe(form, {
      childList: true,
      subtree: true,
    });
  }

  elements.vatInput.addEventListener('input', handleVatIdValidation);
  elements.vatSelect?.addEventListener('change', handleVatIdValidation);

  observeElement(elements.vatInput, 'value', () => {
    handleVatIdValidation();
  });

  handleVatIdValidation();
}
