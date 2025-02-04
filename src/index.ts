import EmailValidation from './validations/validation-email';
import VatValidation from './validations/validation-vatid';

window.Webflow ||= [];
window.Webflow.push(() => {
  EmailValidation();
  VatValidation();
});
