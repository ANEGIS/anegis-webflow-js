const FORM_ELEMENT = '#wf-form-offer-en-form-1234kupciazpupci';
const FORM_ID_EN = 'c84e2bd0-0a9d-ef11-8a6a-000d3a66c0c2';
const FORM_ID_PL = 'f4116d6c-079d-ef11-8a6a-6045bddd96d1';
const FORM_API_URL =
  'https://public-eur.mkt.dynamics.com/api/v1.0/orgs/1e5b64c1-c132-4237-9477-532bcddae3fd/landingpageforms';
const FORM_MAPPINGS = [
  {
    FormFieldName: 'nip',
    DataverseFieldName: 'an_an_taxnumber',
  },
  {
    FormFieldName: 'company-name',
    DataverseFieldName: 'an_an_companyname',
  },
  {
    FormFieldName: 'name',
    DataverseFieldName: 'firstname',
  },
  {
    FormFieldName: 'surname',
    DataverseFieldName: 'lastname',
  },
  {
    FormFieldName: 'job-title',
    DataverseFieldName: 'jobtitle',
  },
  {
    FormFieldName: 'email',
    DataverseFieldName: 'emailaddress1',
  },
  {
    FormFieldName: 'phone',
    DataverseFieldName: 'mobilephone',
  },
  {
    FormFieldName: '***Please fill***',
    DataverseFieldName: 'msdynmkt_purposeid;channels;optinwhenchecked',
    DataverseFieldValue: '7744ce7e-e68a-ef11-ac21-000d3ab16d95;Email,Text;true',
  },
  {
    FormFieldName: 'offer-and-acceptance',
    DataverseFieldName: 'an_privacypolicyaccepted',
    DataverseFieldValue: [
      { FormValue: '1', DataverseValue: '1' }, // Privacy policy accepted
    ],
  },
  {
    FormFieldName: 'agreement',
    DataverseFieldName: 'an_roadshowtermsandconditionsaccepted',
    DataverseFieldValue: [
      { FormValue: '1', DataverseValue: '1' }, // Road show terms and conditions accepted
    ],
  },
  {
    FormFieldName: 'input',
    DataverseFieldName: 'cr8b4_bazawiedzy',
  },
  {
    FormFieldName: 'message',
    DataverseFieldName: 'description',
  },
];

const htmlLang = document.documentElement.lang?.toLowerCase() || '';
const browserLang = navigator.language?.toLowerCase() || '';
const isPolishSite =
  htmlLang.startsWith('pl') || browserLang.startsWith('pl') || browserLang.includes('pl');

d365mktformcapture.waitForElement(FORM_ELEMENT).then((form) => {
  const mappings = FORM_MAPPINGS;
  form.addEventListener(
    'submit',
    (e) => {
      const serializedForm = d365mktformcapture.serializeForm(form, mappings);
      const payload = serializedForm.SerializedForm.build();

      const captureConfig = {
        FormId: isPolishSite ? FORM_ID_PL : FORM_ID_EN,
        FormApiUrl: FORM_API_URL,
      };
      d365mktformcapture.submitForm(captureConfig, payload);
    },
    true
  );
});
