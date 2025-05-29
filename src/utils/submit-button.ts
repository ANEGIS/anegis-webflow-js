import { styles } from '../global/variables';

interface FormSubmitHandlerOptions {
  form: HTMLFormElement;
  isValid: boolean;
  button?: HTMLElement | null;
}

export function handleFormSubmit({ form, isValid, button }: FormSubmitHandlerOptions): void {
  const submitButton = button || form.querySelector<HTMLElement>('[data-form-submit]');
  if (!submitButton) return;

  if (isValid) {
    enableSubmitButton(submitButton);
  } else {
    disableSubmitButton(submitButton);
  }
}

function enableSubmitButton(button: HTMLElement): void {
  button.removeAttribute('disabled');
  button.style.cursor = styles.normal.cursor;
  button.style.opacity = styles.normal.opacity;
}

function disableSubmitButton(button: HTMLElement): void {
  button.setAttribute('disabled', 'disabled');
  button.style.cursor = styles.error.cursor;
  button.style.opacity = styles.error.opacity;
}

export function areRequiredFieldsValid(form: HTMLFormElement): boolean {
  const requiredFields = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >('[required]');

  return Array.from(requiredFields).every((field) => {
    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked;
      }
      return field.value.trim() !== '';
    }

    return field.value.trim() !== '';
  });
}

export function updateFormSubmitState(form: HTMLFormElement, isValid: boolean): void {
  const submitButton = form.querySelector<HTMLElement>('[data-form-submit]');
  const formIsValid = isValid && areRequiredFieldsValid(form);

  handleFormSubmit({ form, isValid: formIsValid, button: submitButton });
}
