import { WACEmailValidation } from './validations/wac-validation-email';
import WACVatValidation from './validations/wac-validation-vatid';

window.Webflow = window.Webflow || [];
window.Webflow.push(() => {
  WACEmailValidation();
  WACVatValidation();
});
