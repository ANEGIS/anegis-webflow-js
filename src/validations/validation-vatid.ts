import { checkVAT, countries } from 'anegis-jsvat';

import {
  styles,
  VATID_COUNTRY_ELEMENT,
  VATID_FEEDBACK_ELEMENT,
  VATID_INPUT_ELEMENT,
} from '../global/variables';
import type { DOMElementsVatValidation, ValidationResult } from '../types/validation-types';

const isPolishSite = document.documentElement.lang?.toLowerCase().startsWith('pl');

const SUPPORTED_COUNTRIES = [
  ...countries.map((country) => ({
    code: country.codes[0],
    emoji: getCountryEmoji(country.codes[0]),
    pattern: country.rules.regex[0],
    messages: {
      tooShort: isPolishSite ? `Nieprawidłowy numer NIP` : `Invalid VAT number format`,
      tooLong: isPolishSite ? `Nieprawidłowy numer NIP` : `Invalid VAT number format`,
      invalid: isPolishSite ? `Nieprawidłowy numer NIP` : `Invalid VAT number format`,
    },
  })),
];

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
  const vatForms = document.querySelectorAll(`form:has(${VATID_INPUT_ELEMENT})`);

  if (vatForms.length === 0) {
    initializeVatValidation(document);
    return;
  }

  vatForms.forEach((form, index) => {
    initializeVatValidation(form, index);
  });
}

function initializeVatValidation(container, formIndex = 0) {
  const elements: DOMElementsVatValidation & {
    submitButton?: HTMLButtonElement | HTMLInputElement;
    form?: HTMLFormElement;
  } = {
    vatInput: container.querySelector(VATID_INPUT_ELEMENT) as HTMLInputElement,
    vatMessage: container.querySelector(VATID_FEEDBACK_ELEMENT) as HTMLElement,
    vatSelect: container.querySelector(VATID_COUNTRY_ELEMENT) as HTMLSelectElement,
  };

  if (!elements.vatInput) return;

  let isVatValid = false;
  let hasErrorMessage = false;

  if (!elements.vatMessage) {
    elements.vatMessage = document.createElement('div');
    elements.vatMessage.setAttribute('data-vat-feedback', '');
    elements.vatMessage.style.display = 'none';
    elements.vatInput.insertAdjacentElement('afterend', elements.vatMessage);
  }

  elements.form = elements.vatInput.closest('form');
  elements.submitButton =
    elements.form?.querySelector('button[type="submit"], input[type="submit"]') || undefined;

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
    select.setAttribute('data-form-index', formIndex.toString());
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
    elements.vatSelect.setAttribute('data-form-index', formIndex.toString());
    const defaultCountry = getBrowserCountry();
    SUPPORTED_COUNTRIES.forEach((country) => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = `${country.emoji} ${country.code}`;
      option.selected = country.code === defaultCountry;
      elements.vatSelect?.appendChild(option);
    });
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

  function getSelectedCountry(): string {
    return elements.vatSelect ? elements.vatSelect.value : getBrowserCountry();
  }

  function validateVatId(vat: string): ValidationResult {
    const cleanedVat = vat.replace(/[\s-]/g, '');
    const { countryCode, vatNumber } = extractCountryCode(cleanedVat);
    const selectedCountry = countryCode || getSelectedCountry();

    if (countryCode && elements.vatSelect && elements.vatSelect.value !== countryCode) {
      elements.vatSelect.value = countryCode;
    }

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

  function updateSubmitButtonState(forceDisable = false): void {
    if (elements.submitButton && elements.form) {
      const requiredFields = Array.from(elements.form.querySelectorAll('[required]')) as Array<
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

      const shouldDisable =
        forceDisable || !isVatValid || !allRequiredFieldsFilled || hasErrorMessage;
      elements.submitButton.disabled = shouldDisable;

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
    isVatValid = false;
    hasErrorMessage = true;

    elements.vatMessage.style.display = 'block';
    elements.vatMessage.innerText = message;
    if (window.location.toString().includes('anegis')) {
      elements.vatMessage.style.color = styles.error.color;
      elements.vatInput.style.borderBottomColor = styles.error.color;
      elements.vatSelect.style.borderBottomColor = styles.error.color;
    }

    updateSubmitButtonState(true);
  }

  function resetValidationState(): void {
    isVatValid = true;
    hasErrorMessage = false;

    elements.vatMessage.style.display = 'none';
    elements.vatMessage.innerText = '';
    elements.vatInput.style.borderBottomColor = styles.normal.color;
    elements.vatSelect.style.borderBottomColor = styles.normal.color;

    updateSubmitButtonState();
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

  function hasVisibleErrorMessage(): boolean {
    return (
      elements.vatMessage.style.display === 'block' && elements.vatMessage.innerText.trim() !== ''
    );
  }

  function forceButtonStateConsistency() {
    if (hasVisibleErrorMessage() && elements.submitButton && !elements.submitButton.disabled) {
      elements.submitButton.disabled = true;
      elements.submitButton.style.cursor = styles.error.cursor;
      elements.submitButton.style.opacity = styles.error.opacity;
    }

    setTimeout(forceButtonStateConsistency, 50);
  }

  forceButtonStateConsistency();

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

  if (elements.submitButton) {
    const buttonObserver = new MutationObserver(() => {
      if (hasVisibleErrorMessage() && !elements.submitButton.disabled) {
        elements.submitButton.disabled = true;
        elements.submitButton.style.cursor = styles.error.cursor;
        elements.submitButton.style.opacity = styles.error.opacity;
      }
    });

    buttonObserver.observe(elements.submitButton, {
      attributes: true,
      attributeFilter: ['disabled'],
    });
  }

  if (elements.form) {
    const originalSubmit = elements.form.submit;
    elements.form.submit = function () {
      if (hasVisibleErrorMessage()) {
        return false;
      }

      return originalSubmit.apply(this, arguments);
    };

    elements.form.addEventListener(
      'submit',
      function (event) {
        handleVatIdValidation();

        if (hasVisibleErrorMessage()) {
          event.preventDefault();
          event.stopPropagation();

          if (elements.submitButton) {
            elements.submitButton.disabled = true;
            elements.submitButton.style.cursor = styles.error.cursor;
            elements.submitButton.style.opacity = styles.error.opacity;
          }

          return false;
        }
      },
      true
    );

    const inputSelector = 'input, select, textarea';
    elements.form.querySelectorAll(inputSelector).forEach((input) => {
      input.addEventListener('input', () => {
        if (input === elements.vatInput) {
          handleVatIdValidation();
        } else if (hasVisibleErrorMessage()) {
          updateSubmitButtonState(true);
        } else {
          updateSubmitButtonState();
        }
      });

      input.addEventListener('change', () => {
        if (input === elements.vatInput || input === elements.vatSelect) {
          handleVatIdValidation();
        } else if (hasVisibleErrorMessage()) {
          updateSubmitButtonState(true);
        } else {
          updateSubmitButtonState();
        }
      });

      input.addEventListener('blur', () => {
        if (input === elements.vatInput) {
          handleVatIdValidation();
        }

        if (hasVisibleErrorMessage()) {
          updateSubmitButtonState(true);
        }
      });
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.matches(inputSelector)) {
            node.addEventListener('input', () => {
              if (node === elements.vatInput) {
                handleVatIdValidation();
              } else if (hasVisibleErrorMessage()) {
                updateSubmitButtonState(true);
              } else {
                updateSubmitButtonState();
              }
            });

            node.addEventListener('change', () => {
              if (node === elements.vatInput || node === elements.vatSelect) {
                handleVatIdValidation();
              } else if (hasVisibleErrorMessage()) {
                updateSubmitButtonState(true);
              } else {
                updateSubmitButtonState();
              }
            });

            node.addEventListener('blur', () => {
              if (node === elements.vatInput) {
                handleVatIdValidation();
              }

              if (hasVisibleErrorMessage()) {
                updateSubmitButtonState(true);
              }
            });
          }
        });
      });
    });

    observer.observe(elements.form, {
      childList: true,
      subtree: true,
    });
  }

  if (elements.submitButton) {
    const originalClickHandler = elements.submitButton.onclick;

    elements.submitButton.onclick = function (event) {
      if (hasVisibleErrorMessage()) {
        event.preventDefault();
        event.stopPropagation();

        elements.submitButton.disabled = true;
        elements.submitButton.style.cursor = styles.error.cursor;
        elements.submitButton.style.opacity = styles.error.opacity;

        return false;
      }

      if (originalClickHandler) {
        return originalClickHandler.call(this, event);
      }
    };
  }

  elements.vatInput.addEventListener('input', handleVatIdValidation);
  elements.vatSelect?.addEventListener('change', handleVatIdValidation);

  elements.vatInput.addEventListener(
    'blur',
    () => {
      handleVatIdValidation();

      if (hasVisibleErrorMessage()) {
        updateSubmitButtonState(true);
      }
    },
    true
  );

  elements.vatInput.addEventListener(
    'focusout',
    () => {
      handleVatIdValidation();

      if (hasVisibleErrorMessage()) {
        updateSubmitButtonState(true);
      }
    },
    true
  );

  observeElement(elements.vatInput, 'value', () => {
    handleVatIdValidation();
  });

  handleVatIdValidation();

  if (hasVisibleErrorMessage()) {
    hasErrorMessage = true;
    updateSubmitButtonState(true);
  }
}

console.log('Validation initialized');
