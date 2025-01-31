import { elements, styles } from './global/variables';
import EmailValidation from './validations/validation-email';
import VatValidation from './validations/validation-vatid';

window.Webflow ||= [];
window.Webflow.push(() => {
  EmailValidation();
  VatValidation();
});
