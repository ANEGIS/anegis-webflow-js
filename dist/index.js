"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/validation-email.ts
  function EmailValidation() {
    console.log("email validation");
  }

  // src/validation-vatid.ts
  var WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  var VALID_LENGTH = 10;
  var MSG_CHARS_EXCEED = "Numer NIP jest za d\u0142ugi";
  var MSG_CHARS_RECEDE = "Numer NIP jest za kr\xF3tki";
  var MSG_CHARS_INVALID = "Numer NIP jest nieprawid\u0142owy!";
  var BASIC_COLOR = "var(--turquise-a)";
  var ERROR_COLOR = "var(--alert-hover)";
  function VatValidation() {
    const htmlLang = document.documentElement.lang?.toLowerCase() || "";
    const browserLang = navigator.language?.toLowerCase() || "";
    const isPolishSite = htmlLang.startsWith("pl") || browserLang.startsWith("pl") || browserLang.includes("pl");
    if (!isPolishSite) {
      console.log("VAT ID validation is only enabled for Polish language sites");
      return;
    }
    const elements = {
      inputBox: document.querySelector("[data-nip-input]"),
      msgVatID: document.querySelector("[data-nip-feedback]"),
      submitButton: document.querySelector("[data-nip-submit]")
    };
    if (!elements.inputBox || !elements.msgVatID || !elements.submitButton) {
      console.warn("Required DOM elements for VAT ID validation not found");
      return;
    }
    const styles = {
      error: {
        color: ERROR_COLOR,
        opacity: "0.5"
      },
      normal: {
        color: BASIC_COLOR,
        opacity: "1"
      }
    };
    function validatePolishVatId(vatId) {
      const cleanVatId = vatId.replace(/[\s-]/g, "");
      if (!/^\d{10}$/.test(cleanVatId)) {
        return {
          isValid: false,
          error: `VAT ID must contain exactly ${VALID_LENGTH} digits`
        };
      }
      const digits = cleanVatId.split("").map(Number);
      const sum = WEIGHTS.reduce((acc, weight, index) => acc + weight * digits[index], 0);
      const checkDigit = digits[9];
      const expectedCheckDigit = sum % 11;
      return expectedCheckDigit === checkDigit ? { isValid: true, normalizedVatId: cleanVatId } : { isValid: false, error: "Invalid checksum" };
    }
    function showValidationError(message) {
      elements.msgVatID.style.display = "block";
      elements.msgVatID.innerText = message;
      elements.msgVatID.style.color = styles.error.color;
      elements.inputBox.style.borderBottomColor = styles.error.color;
      elements.submitButton.setAttribute("disabled", "true");
      elements.submitButton.style.opacity = styles.error.opacity;
    }
    function resetValidationState() {
      elements.msgVatID.style.display = "none";
      elements.msgVatID.innerText = "";
      elements.inputBox.style.borderBottomColor = styles.normal.color;
      elements.submitButton.removeAttribute("disabled");
      elements.submitButton.style.opacity = styles.normal.opacity;
    }
    function handleVatIdValidation(value) {
      const result = validatePolishVatId(value);
      if (result.isValid) {
        console.log("Valid VAT ID:", result.normalizedVatId);
        resetValidationState();
      } else if (value.length > VALID_LENGTH) {
        showValidationError(MSG_CHARS_EXCEED);
      } else if (value.length < VALID_LENGTH) {
        showValidationError(MSG_CHARS_RECEDE);
      } else {
        console.log("Invalid VAT ID:", result.error);
        showValidationError(MSG_CHARS_INVALID);
      }
    }
    function observeElement(element, property, callback, delay = 0) {
      const elementPrototype = Object.getPrototypeOf(element);
      if (elementPrototype.hasOwnProperty(property)) {
        const descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
        if (descriptor) {
          Object.defineProperty(element, property, {
            get: function() {
              return descriptor.get?.apply(this, arguments);
            },
            set: function() {
              const oldValue = this[property];
              descriptor.set?.apply(this, arguments);
              const newValue = this[property];
              if (typeof callback === "function") {
                setTimeout(callback.bind(this, oldValue, newValue), delay);
              }
              return newValue;
            }
          });
        }
      }
    }
    elements.inputBox.addEventListener("input", (e) => {
      const target = e.target;
      console.log("Input value changed via UI. New value: '%s'", target.value);
      handleVatIdValidation(target.value);
    });
    observeElement(elements.inputBox, "value", (oldValue, newValue) => {
      console.log("Input value changed via API. Value changed from '%s' to '%s'", oldValue, newValue);
    });
    const testVatIds = [
      "5270103391",
      // Valid
      "123-456-78-90",
      // Invalid
      "1234567890",
      // Invalid
      "527-010-33-91"
      // Valid but with formatting
    ];
    testVatIds.forEach((vatId) => {
      const result = validatePolishVatId(vatId);
      console.log(`VAT ID: ${vatId}`);
      console.log("Result:", result);
      console.log("---");
    });
  }

  // src/index.ts
  window.Webflow ||= [];
  window.Webflow.push(() => {
    EmailValidation();
    VatValidation();
  });
})();
//# sourceMappingURL=index.js.map
