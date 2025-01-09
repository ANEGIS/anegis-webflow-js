import { EMAIL_LIST } from '../global/email-blocked-domains';
import { BASIC_COLOR, ERROR_COLOR } from '../global/variables';
import type { DOMElementsEmailValidation, Styles } from '../types/validation-types';

const EMAIL_INPUT_ELEMENT = '[data-email-input]';
const EMAIL_FEEDBACK_ELEMENT = '[data-email-feedback]';

export default function EmailValidation() {
  const htmlLang = document.documentElement.lang?.toLowerCase() || '';
  const browserLang = navigator.language?.toLowerCase() || '';
  const isPolishSite =
    htmlLang.startsWith('pl') || browserLang.startsWith('pl') || browserLang.includes('pl');

  const elements: DOMElementsEmailValidation = {
    emailInput: document.querySelector(EMAIL_INPUT_ELEMENT) as HTMLInputElement,
    emailMessage: document.querySelector(EMAIL_FEEDBACK_ELEMENT) as HTMLElement,
  };

  if (!elements.emailInput || !elements.emailMessage) {
    return;
  }

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

  function showValidationError(message: string): void {
    elements.emailMessage.style.display = 'block';
    elements.emailMessage.innerText = message;
    elements.emailMessage.style.color = styles.error.color;
    elements.emailInput.style.borderBottomColor = styles.error.color;
  }

  function resetValidationState(): void {
    elements.emailMessage.style.display = 'none';
    elements.emailMessage.innerText = '';
    elements.emailInput.style.borderBottomColor = styles.normal.color;
  }

  function checkEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.match(emailRegex)) {
      if (isPolishSite) {
        showValidationError('Nieprawidłowy format adresu e-mail!');
      } else {
        showValidationError('Invalid e-mail format!');
      }
      return false;
    }
    return true;
  }

  function checkEmailDomain(value: string) {
    if (EMAIL_LIST.includes(value.split('@')[1])) {
      if (isPolishSite) {
        showValidationError('Użyj biznesowego adresu email!');
      } else {
        showValidationError('Please use business email!');
      }
      return;
    }
  }

  function handleEmailValidation() {
    const email = elements.emailInput.value.trim();
    resetValidationState();
    if (!email) return;
    if (!checkEmailFormat(email)) return;

    checkEmailDomain(email);
  }

  elements.emailInput.addEventListener('input', handleEmailValidation);
}
