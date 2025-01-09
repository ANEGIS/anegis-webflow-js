// import { FORM_SUBMIT_BUTTON } from './global/variables';
// import { styles } from './global/variables';
import EmailValidation from './validations/validation-email';
import VatValidation from './validations/validation-vatid';

function FormValidation() {
  console.log('works!');
  // const submitButton = document.querySelector(FORM_SUBMIT_BUTTON) as HTMLButtonElement;
  // submitButton.disabled = true;
  // submitButton.style.opacity = styles.error.opacity;
  // if (VatValidation && EmailValidation) {
  //   submitButton.disabled = false;
  //   submitButton.style.opacity = styles.normal.opacity;
  // }
}
window.Webflow ||= [];
window.Webflow.push(() => {
  EmailValidation();
  VatValidation();
  FormValidation();
});
