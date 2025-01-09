import type { Styles } from '../types/validation-types';

export const FORM_SUBMIT_BUTTON = '[data-form-submit]';
export const BASIC_COLOR = 'var(--turquise-a)';
export const ERROR_COLOR = 'var(--alert-hover)';

export const styles: Styles = {
  error: {
    color: ERROR_COLOR,
    opacity: '0.5',
  },
  normal: {
    color: BASIC_COLOR,
    opacity: '1',
  },
};
