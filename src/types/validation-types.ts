export type ValidationResult = {
  isValid: boolean;
  error?: string;
  normalizedVatId?: string;
};

export type DOMElementsVatValidation = {
  vatInput: HTMLInputElement;
  vatMessage: HTMLElement;
  vatSelect: HTMLSelectElement;
};

export type DOMElementsEmailValidation = {
  emailInput: HTMLInputElement;
  emailMessage: HTMLElement;
  submitButton: HTMLButtonElement;
};

export type Styles = {
  error: {
    color: string;
    opacity: string;
    cursor: string;
  };
  normal: {
    color: string;
    opacity: string;
    cursor: string;
  };
};
