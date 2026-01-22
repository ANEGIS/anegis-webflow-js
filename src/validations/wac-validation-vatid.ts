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

  // Create hidden validation field to prevent bot submissions
  const hiddenValidation = document.createElement('input');
  hiddenValidation.type = 'hidden';
  hiddenValidation.name = `vat_validated_${formIndex}`;
  hiddenValidation.required = true;
  hiddenValidation.value = ''; // Start empty - only valid submissions get '1'
  hiddenValidation.setAttribute('data-vat-validation', formIndex.toString());
  if (form) {
    form.appendChild(hiddenValidation);
  }

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

    // Clear hidden field value to block submission
    hiddenValidation.value = '';

    if (form) {
      updateFormSubmitState(form, false);
    }
  }

  function resetValidationState(): void {
    isVatValid = true;

    elements.vatMessage.style.display = 'none';
    elements.vatMessage.innerText = '';

    // Set hidden field value to allow submission
    hiddenValidation.value = '1';

    if (form) {
      updateFormSubmitState(form, true);
    }
  }

  function handleVatIdValidation(): void {
    const { value } = elements.vatInput;

    // Empty VAT should block submission (bots using submit())
    if (!value) {
      showValidationError('NIP jest nieprawidłowy');
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
    let isSubmitting = false;

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

    if (!form.hasAttribute('data-vat-submit-patched')) {
      const nativeSubmit = form.submit.bind(form);

      form.submit = function submitWithVatValidation(this: HTMLFormElement): void {
        if (isSubmitting) return;
        isSubmitting = true;

        handleVatIdValidation();

        if (!isVatValid) {
          isSubmitting = false;
          return;
        }

        nativeSubmit();
        isSubmitting = false;
      };

      form.setAttribute('data-vat-submit-patched', 'true');
    }
  }

  elements.vatInput.addEventListener('input', handleInput);
  elements.vatInput.addEventListener('blur', handleBlur, true);
  elements.vatInput.addEventListener('focusout', handleBlur, true);
}
