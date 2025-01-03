import { EmailValidation } from './validation-email';
import { VatValidation } from './validation-vatid';

window.Webflow ||= [];
window.Webflow.push(() => {
  EmailValidation();
  VatValidation();
});
