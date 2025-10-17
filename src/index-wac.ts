import { WACEmailValidation } from './validations/wac-validation-email';
import { WACPhoneValidation } from './validations/wac-validation-phone';
import WACVatValidation from './validations/wac-validation-vatid';

window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  WACEmailValidation();
  WACPhoneValidation();
  WACVatValidation();
});
