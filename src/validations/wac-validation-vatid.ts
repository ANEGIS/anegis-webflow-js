import { checkVAT, countries } from 'anegis-jsvat';

import { VATID_FEEDBACK_ELEMENT, VATID_INPUT_ELEMENT } from '../global/variables';
import type { DOMElementsVatValidation, ValidationResult } from '../types/validation-types';
import { updateFormSubmitState } from '../utils/submit-button';

const LOCKED_COUNTRY = 'PL';

const SUPPORTED_COUNTRIES = [
  ...countries.map((country) => ({
    code: country.codes[0],
    pattern: country.rules.regex[0],
    messages: {
      tooShort: `NIP jest za krótki`,
      tooLong: `NIP jest za długi`,
      invalid: `NIP jest nieprawidłowy`,
    },
  })),
];

export default function WACVatValidation(): void {
  const vatForms = document.querySelectorAll<HTMLFormElement>(`form:has(${VATID_INPUT_ELEMENT})`);

  if (vatForms.length === 0) {
    initializeVatValidation(document);
    return;
  }

  vatForms.forEach((form, index) => {
    initializeVatValidation(form, index);
  });
}

function initializeVatValidation(container: Document | HTMLElement, formIndex = 0): void {
  const elements: DOMElementsVatValidation = {
    vatInput:
      container.querySelector<HTMLInputElement>(VATID_INPUT_ELEMENT) ||
      document.createElement('input'),
    vatMessage:
      container.querySelector<HTMLElement>(VATID_FEEDBACK_ELEMENT) || document.createElement('div'),
  };

  if (!elements.vatInput) return;

  let isVatValid = false;

  if (!elements.vatMessage) {
    elements.vatMessage = document.createElement('div');
    elements.vatMessage.setAttribute('data-vat-feedback', '');
    elements.vatMessage.style.display = 'none';
    elements.vatInput.insertAdjacentElement('afterend', elements.vatMessage);
  }

  const form = elements.vatInput.closest('form');

  elements.vatInput.setAttribute('data-form-index', formIndex.toString());
  elements.vatMessage.setAttribute('data-form-index', formIndex.toString());

  function extractCountryCode(vat: string): { countryCode: string | null; vatNumber: string } {
    const countryCodeMatch = vat.match(/^([A-Za-z]{2})/);

    if (countryCodeMatch) {
      const countryCode = countryCodeMatch[1].toUpperCase();
      const isValidCountry = SUPPORTED_COUNTRIES.some((country) => country.code === countryCode);
      if (isValidCountry) {
        return {
          countryCode,
          vatNumber: vat.substring(2),
        };
      }
    }

    return {
      countryCode: null,
      vatNumber: vat,
    };
  }

  function validateVatId(vat: string): ValidationResult {
    const cleanedVat = vat.replace(/[\s-]/g, '');
    const { countryCode, vatNumber } = extractCountryCode(cleanedVat);
    const selectedCountry = countryCode || LOCKED_COUNTRY;

    const countryConfig = SUPPORTED_COUNTRIES.find((config) => config.code === selectedCountry);
    if (!countryConfig) return { isValid: false, error: 'Contact us via email: sales@anegis.com' };

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

  function showValidationError(message: string): void {
    isVatValid = false;

    elements.vatMessage.style.display = 'flex';
    elements.vatMessage.innerText = message;

    if (form) {
      updateFormSubmitState(form, false);
    }
  }

  function resetValidationState(): void {
    isVatValid = true;

    elements.vatMessage.style.display = 'none';
    elements.vatMessage.innerText = '';

    if (form) {
      updateFormSubmitState(form, true);
    }
  }

  function handleVatIdValidation(): void {
    const { value } = elements.vatInput;

    if (!value && !elements.vatInput.hasAttribute('required')) {
      resetValidationState();
      return;
    }

    const result = validateVatId(value);

    if (result.isValid) {
      resetValidationState();
    } else if (result.error) {
      showValidationError(result.error);
    }
  }

  function handleInput(): void {
    handleVatIdValidation();
  }

  function handleBlur(): void {
    handleVatIdValidation();
  }

  if (form) {
    form.addEventListener(
      'submit',
      (event: Event) => {
        handleVatIdValidation();

        if (!isVatValid) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      },
      true
    );
  }

  elements.vatInput.addEventListener('input', handleInput);
  elements.vatInput.addEventListener('blur', handleBlur, true);
  elements.vatInput.addEventListener('focusout', handleBlur, true);

  handleVatIdValidation();
}
