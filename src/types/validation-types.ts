export type ValidationResult = {
  isValid: boolean;
  error?: string;
  normalizedVatId?: string;
};

export type DOMElementsVatValidation = {
  vatIdInput: HTMLInputElement;
  vatIdMessage: HTMLElement;
};

export type DOMElementsEmailValidation = {
  emailInput: HTMLInputElement;
  emailMessage: HTMLElement;
};

export type Styles = {
  error: {
    color: string;
    opacity: string;
  };
  normal: {
    color: string;
    opacity: string;
  };
};
