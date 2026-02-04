/*
    Copyright (c) 2026 gematik GmbH
    Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
    European Commission – subsequent versions of the EUPL (the "Licence").
    You may not use this work except in compliance with the Licence.
    You find a copy of the Licence in the "Licence" file or at
    https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
    Unless required by applicable law or agreed to in writing,
    software distributed under the Licence is distributed on an "AS IS" basis,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
    In case of changes by gematik find details in the "Readme" file.
    See the Licence for the specific language governing permissions and limitations under the Licence.
    *******
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import {
  ADDRESS_TYPE_CURRENT,
  ADDRESS_TYPE_ORDINARY,
  ADDRESS_TYPE_OTHER_FACILITY,
  ADDRESS_TYPE_PRIMARY,
  CLIPBOARD_KEY_CURRENT_CITY,
  CLIPBOARD_KEY_CURRENT_COUNTRY,
  CLIPBOARD_KEY_CURRENT_HOUSENR,
  CLIPBOARD_KEY_CURRENT_INSTITUTION_NAME,
  CLIPBOARD_KEY_CURRENT_STREET,
  CLIPBOARD_KEY_CURRENT_TYPE,
  CLIPBOARD_KEY_CURRENT_ZIP,
  CLIPBOARD_KEY_RESIDENCE_CITY,
  CLIPBOARD_KEY_RESIDENCE_COUNTRY,
  CLIPBOARD_KEY_RESIDENCE_HOUSENR,
  CLIPBOARD_KEY_RESIDENCE_STREET,
  CLIPBOARD_KEY_RESIDENCE_TYPE,
  CLIPBOARD_KEY_RESIDENCE_ZIP,
  CLIPBOARD_VALUE_CITY,
  CLIPBOARD_VALUE_COUNTRY_DE,
  CLIPBOARD_VALUE_COUNTRY_KP,
  CLIPBOARD_VALUE_HOUSENR,
  CLIPBOARD_VALUE_INSTITUTION_NAME,
  CLIPBOARD_VALUE_STREET,
  CLIPBOARD_VALUE_ZIP,
  ERROR_INVALID_BSNR,
  ERROR_INVALID_DATE,
  ERROR_INVALID_EMAIL,
  ERROR_INVALID_HOUSE_NUMBER,
  ERROR_INVALID_PHONE,
  ERROR_INVALID_SPECIAL_CHAR,
  ERROR_MIN_LENGTH,
  ERROR_MIN_ONE_CHAR,
  ERROR_OPTION_INCOMPLETE,
  ERROR_OPTION_MISMATCH,
  ERROR_REQUIRED,
  FIELD_BIRTH_DATE,
  FIELD_BSNR,
  FIELD_CURRENT_ADDRESS_CITY,
  FIELD_CURRENT_ADDRESS_HOUSE_NUMBER,
  FIELD_CURRENT_ADDRESS_INSTITUTION_NAME,
  FIELD_CURRENT_ADDRESS_STREET,
  FIELD_CURRENT_ADDRESS_ZIP,
  FIELD_DEPARTMENTNAME,
  FIELD_EMAIL_1,
  FIELD_EXTRACTION_DATE,
  FIELD_FIRST_NAME,
  FIELD_INSTITUTIONAME,
  FIELD_LAST_NAME,
  FIELD_MATERIAL,
  FIELD_METHOD_0,
  FIELD_NOTIFIER_FACILITY_ADDRESS_CITY,
  FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER,
  FIELD_NOTIFIER_FACILITY_ADDRESS_STREET,
  FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP,
  FIELD_NOTIFIER_FACILITY_EMAILADDRESS,
  FIELD_NOTIFIER_FACILITY_FIRSTNAME,
  FIELD_NOTIFIER_FACILITY_LASTNAME,
  FIELD_NOTIFIER_FACILITY_PHONENUMBER,
  FIELD_NOTIFIER_FACILITY_PREFIX,
  FIELD_PHONE_1,
  FIELD_PREFIX,
  FIELD_RECEIVED_DATE,
  FIELD_RESIDENCE_ADDRESS_CITY,
  FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER,
  FIELD_RESIDENCE_ADDRESS_STREET,
  FIELD_RESIDENCE_ADDRESS_ZIP,
  FIELD_SUBMITTING_FACILITY_ADDRESS_CITY,
  FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER,
  FIELD_SUBMITTING_FACILITY_ADDRESS_STREET,
  FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP,
  METHOD_VALUE_INVP,
  NOTIFIER_VALUE_BSNR,
  NOTIFIER_VALUE_CITY,
  NOTIFIER_VALUE_HOUSENR,
  NOTIFIER_VALUE_INSTITUTION_NAME,
  NOTIFIER_VALUE_STREET,
  NOTIFIER_VALUE_ZIP,
  VALUE_EMPTY,
  VALUE_INVALD_BSNR,
  VALUE_INVALID_DATE,
  VALUE_INVALID_DISPLAY,
  VALUE_INVALID_EMAIL_1,
  VALUE_INVALID_EMAIL_2,
  VALUE_INVALID_EMAIL_3,
  VALUE_INVALID_EMAIL_4,
  VALUE_INVALID_EMAIL_5,
  VALUE_INVALID_EMAIL_6,
  VALUE_INVALID_EMAIL_7,
  VALUE_INVALID_EMAIL_8,
  VALUE_INVALID_HOUSE_NUMBER,
  VALUE_INVALID_NAME_NUMBER,
  VALUE_INVALID_NAME_SPECIAL_CHAR,
  VALUE_INVALID_PHONE_1,
  VALUE_INVALID_PHONE_2,
  VALUE_INVALID_PHONE_3,
  VALUE_INVALID_PHONE_4,
  VALUE_INVALID_SPECIAL_CHAR,
  VALUE_SHORT_ZIP,
  VALUE_SPACE,
} from './test-constants';

export const TEST_DATA = {
  countryCodeDisplays: [
    {
      code: 'DE',
      display: 'Germany',
      designations: [
        {
          language: 'de-DE',
          value: 'Deutschland',
        },
      ],
      system: 'urn:iso:std:iso:3166',
    },
    {
      code: 'KP',
      display: 'North Korea',
      designations: [
        {
          language: 'de-DE',
          value: 'Demokratische Volksrepublik Korea',
        },
      ],
      system: 'urn:iso:std:iso:3166',
    },
  ],
  federalStateCodeDisplays: [
    {
      code: 'DE-BW',
      display: 'Baden-Württemberg',
      designations: [],
    },
    {
      code: 'DE-BE',
      display: 'Berlin',
      designations: [],
    },
    {
      code: 'DE-BB',
      display: 'Brandenburg',
      designations: [],
    },
  ],
  pathogenCodeDisplays: [
    {
      code: 'invp',
      display: 'Influenzavirus; Meldepflicht nur für den direkten Nachweis',
      designations: [
        {
          language: 'de-DE',
          value: 'Influenzavirus',
        },
      ],
    },
    {
      code: 'bovp',
      display: 'humanpathogene Bornaviren; Meldepflicht nur für den direkten Nachweis',
      designations: [
        {
          language: 'de-DE',
          value: 'Bornaviren',
        },
      ],
    },
    {
      code: 'zkvp',
      display: 'Zika-Virus',
      designations: [
        {
          language: 'de-DE',
          value: 'Zika-Virus',
        },
      ],
    },
  ],
  diagnosticBasedOnPathogenSelectionINVP: {
    codeDisplay: {
      code: 'invp',
      display: 'Influenzavirus; Meldepflicht nur für den direkten Nachweis',
      designations: [
        {
          language: 'de-DE',
          value: 'Influenzavirus',
        },
      ],
    },
    header: 'Influenzavirus',
    subheader: 'Meldepflicht nur für den direkten Nachweis',
    methods: [
      {
        code: '117040002',
        display: 'Nucleic acid sequencing (procedure)',
        designations: [
          {
            language: 'en-US',
            value: 'Nucleic acid sequencing (procedure)',
          },
          {
            language: 'de-DE',
            value: 'DNA-Sequenzierung',
          },
        ],
      },
      {
        code: '708099001',
        display: 'Rapid immunoassay technique (qualifier value)',
        designations: [
          {
            language: 'de-DE',
            value: 'Antigenschnelltest',
          },
          {
            language: 'en-US',
            value: 'Rapid immunoassay technique (qualifier value)',
          },
        ],
      },
    ],
    materials: [
      {
        code: '123038009',
        display: 'Specimen (specimen)',
        designations: [
          {
            language: 'de-DE',
            value: 'Anderes Untersuchungsmaterial',
          },
          {
            language: 'en-US',
            value: 'Specimen (specimen)',
          },
        ],
      },
      {
        code: '119334006',
        display: 'Sputum specimen (specimen)',
        designations: [
          {
            language: 'de-DE',
            value: 'Sputum',
          },
          {
            language: 'en-US',
            value: 'Sputum specimen (specimen)',
          },
        ],
      },
    ],
    answerSet: [
      {
        code: '407479009',
        display: 'Influenza A virus (organism)',
        designations: [
          {
            language: 'en-US',
            value: 'Influenza A virus (organism)',
          },
          {
            language: 'de-DE',
            value: 'Influenza A-Virus',
          },
        ],
      },
      {
        code: '407480007',
        display: 'Influenza B virus (organism)',
        designations: [
          {
            language: 'en-US',
            value: 'Influenza B virus (organism)',
          },
          {
            language: 'de-DE',
            value: 'Influenza-B-Virus',
          },
        ],
      },
    ],
    substances: [],
    resistances: [],
    resistanceGenes: [],
    staticSystemVersions: [
      {
        system: 'http://snomed.info/sct',
        version: 'http://snomed.info/sct/11000274103/version/20241115',
      },
      {
        system: 'http://loinc.org',
        version: '2.79',
      },
    ],
  },
  diagnosticBasedOnPathogenSelectionBOVP: {
    codeDisplay: {
      code: 'bovp',
      display: 'humanpathogene Bornaviren; Meldepflicht nur für den direkten Nachweis',
      designations: [
        {
          language: 'de-DE',
          value: 'Bornaviren',
        },
      ],
    },
    header: 'humanpathogene Bornaviren',
    subheader: 'Meldepflicht nur für den direkten Nachweis',
    methods: [
      {
        code: '117040002',
        display: 'Nucleic acid sequencing (procedure)',
        designations: [
          {
            language: 'en-US',
            value: 'Nucleic acid sequencing (procedure)',
          },
          {
            language: 'de-DE',
            value: 'DNA-Sequenzierung',
          },
        ],
      },
      {
        code: '121276004',
        display: 'Antigen assay (procedure)',
        designations: [
          {
            language: 'en-US',
            value: 'Antigen assay (procedure)',
          },
          {
            language: 'de-DE',
            value: 'Antigennachweis',
          },
        ],
      },
      {
        code: '398545005',
        display: 'Nucleic acid assay (procedure)',
        designations: [
          {
            language: 'en-US',
            value: 'Nucleic acid assay (procedure)',
          },
          {
            language: 'de-DE',
            value: 'Nukleinsäurenachweis',
          },
        ],
      },
      {
        code: '61594008',
        display: 'Microbial culture (procedure)',
        designations: [
          {
            language: 'en-US',
            value: 'Microbial culture (procedure)',
          },
          {
            language: 'de-DE',
            value: 'Mikrobielle Kultur',
          },
        ],
      },
    ],
    materials: [
      {
        code: '123038009',
        display: 'Specimen (specimen)',
        designations: [
          {
            language: 'de-DE',
            value: 'Anderes Untersuchungsmaterial',
          },
          {
            language: 'en-US',
            value: 'Specimen (specimen)',
          },
        ],
      },
      {
        code: '309129006',
        display: 'Nerve tissue specimen (specimen)',
        designations: [
          {
            language: 'en-US',
            value: 'Nerve tissue specimen (specimen)',
          },
          {
            language: 'de-DE',
            value: 'Nervengewebeprobe',
          },
        ],
      },
    ],
    answerSet: [
      {
        code: '285349002',
        display: 'Borna disease virus (organism)',
        designations: [
          {
            language: 'en-US',
            value: 'Borna disease virus (organism)',
          },
          {
            language: 'de-DE',
            value: 'Borna-disease-Virus',
          },
        ],
      },
      {
        code: '407340002',
        display: 'Genus Bornavirus (organism)',
        designations: [
          {
            language: 'de-DE',
            value: 'Gattung Bornavirus',
          },
          {
            language: 'en-US',
            value: 'Genus Bornavirus (organism)',
          },
        ],
      },
    ],
    substances: [],
    resistances: [],
    resistanceGenes: [],
  },

  notifierFacility: {
    facilityInfo: {
      institutionName: 'TEST Organisation',
      bsnr: '248123512',
      existsBsnr: true,
    },
    address: {
      zip: '21481',
      country: 'DE',
      street: 'Im Himmelreich',
      additionalInfo: null,
      city: 'Frühling',
      houseNumber: '1',
      addressType: 'current',
    },
    contact: {
      salutation: 'Mr',
      prefix: 'Dr',
      firstname: 'Melderina',
      lastname: 'Melderson',
    },
    contacts: {
      phoneNumbers: [{ contactType: 'phone', value: '0182736912388889', usage: 'work' }],
      emailAddresses: [{ contactType: 'email', value: 'testerino@test.de' }],
    },
  },
  submittingFacility: {
    facilityInfo: {
      institutionName: 'TEST Organisation',
      departmentName: 'TEST Department',
    },
    address: {
      zip: '21481',
      country: 'DE',
      street: 'Im Himmelreich',
      additionalInfo: null,
      city: 'Frühling',
      houseNumber: '1',
    },
    contact: {
      salutation: 'Mr',
      prefix: 'Dr',
      firstname: 'Melderina',
      lastname: 'Melderson',
    },
    contacts: {
      phoneNumbers: [{ contactType: 'phone', value: '0182736912388889', usage: 'work' }],
      emailAddresses: [{ contactType: 'email', value: 'testerino@test.de' }],
    },
  },
};

export const TEST_PARAMETER_SET_NOTIFIER = {
  facilityInfo: [
    {
      field: FIELD_INSTITUTIONAME,
      value: NOTIFIER_VALUE_INSTITUTION_NAME,
    },
    {
      field: FIELD_BSNR,
      value: NOTIFIER_VALUE_BSNR,
    },
  ],
  address: [
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_STREET,
      value: NOTIFIER_VALUE_STREET,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP,
      value: NOTIFIER_VALUE_ZIP,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: NOTIFIER_VALUE_HOUSENR,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_CITY,
      value: NOTIFIER_VALUE_CITY,
    },
  ],
  contactPerson: [
    {
      field: FIELD_PREFIX,
      value: FIELD_NOTIFIER_FACILITY_PREFIX,
    },
    {
      field: FIELD_FIRST_NAME,
      value: FIELD_NOTIFIER_FACILITY_FIRSTNAME,
    },
    {
      field: FIELD_LAST_NAME,
      value: FIELD_NOTIFIER_FACILITY_LASTNAME,
    },
  ],
  contacts: {
    phoneNumbers: [{ field: FIELD_PHONE_1, value: FIELD_NOTIFIER_FACILITY_PHONENUMBER }],
    emailAddresses: [{ field: FIELD_EMAIL_1, value: FIELD_NOTIFIER_FACILITY_EMAILADDRESS }],
  },
};

export const TEST_PARAMETER_VALIDATION = {
  submittingFacilityInfo: [
    {
      field: FIELD_INSTITUTIONAME,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_INSTITUTIONAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_DEPARTMENTNAME,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
  ],
  facilityInfo: [
    {
      field: FIELD_INSTITUTIONAME,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_INSTITUTIONAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_INSTITUTIONAME,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },

    {
      field: FIELD_BSNR,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_BSNR,
    },
    {
      field: FIELD_BSNR,
      value: VALUE_SPACE,
      expectedResult: ERROR_INVALID_BSNR,
    },
    {
      field: FIELD_BSNR,
      value: VALUE_INVALD_BSNR,
      expectedResult: ERROR_INVALID_BSNR,
    },
    {
      field: FIELD_BSNR,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
  ],
  notifierFacilityAddress: [
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_STREET,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_STREET,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP,
      value: VALUE_SHORT_ZIP,
      expectedResult: ERROR_MIN_LENGTH,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_LENGTH,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: VALUE_INVALID_HOUSE_NUMBER,
      expectedResult: ERROR_INVALID_HOUSE_NUMBER,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: VALUE_SPACE,
      expectedResult: ERROR_INVALID_HOUSE_NUMBER,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_CITY,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_CITY,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_NOTIFIER_FACILITY_ADDRESS_CITY,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
  ],
  submittingFacilityAddress: [
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_STREET,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_STREET,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP,
      value: VALUE_SHORT_ZIP,
      expectedResult: ERROR_MIN_LENGTH,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_LENGTH,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: VALUE_INVALID_HOUSE_NUMBER,
      expectedResult: ERROR_INVALID_HOUSE_NUMBER,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: VALUE_SPACE,
      expectedResult: ERROR_INVALID_HOUSE_NUMBER,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_CITY,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_CITY,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_SUBMITTING_FACILITY_ADDRESS_CITY,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
  ],
  contactPerson: [
    {
      field: FIELD_PREFIX,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_PREFIX,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_INVALID_NAME_NUMBER,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_INVALID_NAME_NUMBER,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
  ],
  notifiedPerson: [
    {
      field: FIELD_BIRTH_DATE,
      value: VALUE_INVALID_DATE,
      expectedResult: ERROR_INVALID_DATE,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_INVALID_NAME_NUMBER,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_FIRST_NAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_INVALID_NAME_NUMBER,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_LAST_NAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
  ],
  residenceAddress: [
    {
      field: FIELD_RESIDENCE_ADDRESS_STREET,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_RESIDENCE_ADDRESS_STREET,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_RESIDENCE_ADDRESS_ZIP,
      value: VALUE_SHORT_ZIP,
      expectedResult: ERROR_MIN_LENGTH,
    },
    {
      field: FIELD_RESIDENCE_ADDRESS_ZIP,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER,
      value: VALUE_INVALID_HOUSE_NUMBER,
      expectedResult: ERROR_INVALID_HOUSE_NUMBER,
    },
    {
      field: FIELD_RESIDENCE_ADDRESS_CITY,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_RESIDENCE_ADDRESS_CITY,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
  ],
  currentAddress: [
    {
      field: FIELD_CURRENT_ADDRESS_INSTITUTION_NAME,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_CURRENT_ADDRESS_INSTITUTION_NAME,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_CURRENT_ADDRESS_INSTITUTION_NAME,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_CURRENT_ADDRESS_STREET,
      value: VALUE_INVALID_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
    {
      field: FIELD_CURRENT_ADDRESS_STREET,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_CURRENT_ADDRESS_ZIP,
      value: VALUE_SHORT_ZIP,
      expectedResult: ERROR_MIN_LENGTH,
    },
    {
      field: FIELD_CURRENT_ADDRESS_ZIP,
      value: VALUE_EMPTY,
      expectedResult: ERROR_REQUIRED,
    },
    {
      field: FIELD_CURRENT_ADDRESS_HOUSE_NUMBER,
      value: VALUE_INVALID_HOUSE_NUMBER,
      expectedResult: ERROR_INVALID_HOUSE_NUMBER,
    },
    {
      field: FIELD_CURRENT_ADDRESS_CITY,
      value: VALUE_SPACE,
      expectedResult: ERROR_MIN_ONE_CHAR,
    },
    {
      field: FIELD_CURRENT_ADDRESS_CITY,
      value: VALUE_INVALID_NAME_SPECIAL_CHAR,
      expectedResult: ERROR_INVALID_SPECIAL_CHAR,
    },
  ],
  phone: [
    { value: VALUE_EMPTY, expectedResult: ERROR_REQUIRED },
    { value: VALUE_SPACE, expectedResult: ERROR_INVALID_PHONE },
    { value: VALUE_INVALID_PHONE_1, expectedResult: ERROR_INVALID_PHONE },
    { value: VALUE_INVALID_PHONE_2, expectedResult: ERROR_INVALID_PHONE },
    { value: VALUE_INVALID_PHONE_3, expectedResult: ERROR_INVALID_PHONE },
    { value: VALUE_INVALID_PHONE_4, expectedResult: ERROR_INVALID_PHONE },
  ],
  email: [
    { value: VALUE_EMPTY, expectedResult: ERROR_REQUIRED },
    { value: VALUE_SPACE, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_1, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_2, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_3, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_4, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_5, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_6, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_7, expectedResult: ERROR_INVALID_EMAIL },
    { value: VALUE_INVALID_EMAIL_8, expectedResult: ERROR_INVALID_EMAIL },
  ],
  diagnostic: {
    receivedDate: [
      { field: FIELD_RECEIVED_DATE, value: VALUE_EMPTY, expectedResult: ERROR_REQUIRED },
      { field: FIELD_RECEIVED_DATE, value: VALUE_INVALID_DATE, expectedResult: ERROR_INVALID_DATE },
    ],
    extractionDate: [
      {
        field: FIELD_EXTRACTION_DATE,
        value: VALUE_INVALID_DATE,
        expectedResult: ERROR_INVALID_DATE,
      },
    ],
    material: [
      { field: FIELD_MATERIAL, value: VALUE_SPACE, expectedResult: ERROR_OPTION_INCOMPLETE },
      { field: FIELD_MATERIAL, value: VALUE_INVALID_DISPLAY, expectedResult: ERROR_OPTION_MISMATCH },
    ],
    method: [
      {
        field: FIELD_METHOD_0,
        value: METHOD_VALUE_INVP.substring(0, METHOD_VALUE_INVP.length - 2),
        expectedResult: ERROR_OPTION_INCOMPLETE,
      },
      { field: FIELD_METHOD_0, value: VALUE_INVALID_DISPLAY, expectedResult: ERROR_OPTION_MISMATCH },
    ],
  },
};

export const TEST_PARAMETER_CLIPBOARD_RESIDENCE_ADDRESS_SINGLE_PRIMARY = [
  {
    key: CLIPBOARD_KEY_RESIDENCE_HOUSENR,
    value: CLIPBOARD_VALUE_HOUSENR,
    addressType: ADDRESS_TYPE_PRIMARY,
    selector: `#${FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER}`,
  },
  {
    key: CLIPBOARD_KEY_RESIDENCE_STREET,
    value: CLIPBOARD_VALUE_STREET,
    addressType: ADDRESS_TYPE_PRIMARY,
    selector: `#${FIELD_RESIDENCE_ADDRESS_STREET}`,
  },
  {
    key: CLIPBOARD_KEY_RESIDENCE_ZIP,
    value: CLIPBOARD_VALUE_ZIP,
    addressType: ADDRESS_TYPE_PRIMARY,
    selector: `#${FIELD_RESIDENCE_ADDRESS_ZIP}`,
  },
  {
    key: CLIPBOARD_KEY_RESIDENCE_CITY,
    value: CLIPBOARD_VALUE_CITY,
    addressType: ADDRESS_TYPE_PRIMARY,
    selector: `#${FIELD_RESIDENCE_ADDRESS_CITY}`,
  },
];

export const TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_SINGLE_OTHER_FACILITY = [
  {
    key: CLIPBOARD_KEY_CURRENT_STREET,
    value: CLIPBOARD_VALUE_STREET,
    addressType: ADDRESS_TYPE_OTHER_FACILITY,
    selector: `#${FIELD_CURRENT_ADDRESS_STREET}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_ZIP,
    value: CLIPBOARD_VALUE_ZIP,
    addressType: ADDRESS_TYPE_OTHER_FACILITY,
    selector: `#${FIELD_CURRENT_ADDRESS_ZIP}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_CITY,
    value: CLIPBOARD_VALUE_CITY,
    addressType: ADDRESS_TYPE_OTHER_FACILITY,
    selector: `#${FIELD_CURRENT_ADDRESS_CITY}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_HOUSENR,
    value: CLIPBOARD_VALUE_HOUSENR,
    addressType: ADDRESS_TYPE_OTHER_FACILITY,
    selector: `#${FIELD_CURRENT_ADDRESS_HOUSE_NUMBER}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_INSTITUTION_NAME,
    value: CLIPBOARD_VALUE_INSTITUTION_NAME,
    addressType: ADDRESS_TYPE_OTHER_FACILITY,
    selector: `#${FIELD_CURRENT_ADDRESS_INSTITUTION_NAME}`,
  },
];

export const TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_SINGLE = [
  {
    key: CLIPBOARD_KEY_CURRENT_STREET,
    value: CLIPBOARD_VALUE_STREET,
    addressType: ADDRESS_TYPE_CURRENT,
    selector: `#${FIELD_CURRENT_ADDRESS_STREET}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_ZIP,
    value: CLIPBOARD_VALUE_ZIP,
    addressType: ADDRESS_TYPE_CURRENT,
    selector: `#${FIELD_CURRENT_ADDRESS_ZIP}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_CITY,
    value: CLIPBOARD_VALUE_CITY,
    addressType: ADDRESS_TYPE_CURRENT,
    selector: `#${FIELD_CURRENT_ADDRESS_CITY}`,
  },
  {
    key: CLIPBOARD_KEY_CURRENT_HOUSENR,
    value: CLIPBOARD_VALUE_HOUSENR,
    addressType: ADDRESS_TYPE_CURRENT,
    selector: `#${FIELD_CURRENT_ADDRESS_HOUSE_NUMBER}`,
  },
];

export const TEST_PARAMETER_CLIPBOARD_RESIDENCE_ADDRESS_FULL = [
  [CLIPBOARD_KEY_RESIDENCE_HOUSENR, CLIPBOARD_VALUE_HOUSENR],
  [CLIPBOARD_KEY_RESIDENCE_STREET, CLIPBOARD_VALUE_STREET],
  [CLIPBOARD_KEY_RESIDENCE_ZIP, CLIPBOARD_VALUE_ZIP],
  [CLIPBOARD_KEY_RESIDENCE_CITY, CLIPBOARD_VALUE_CITY],
  [CLIPBOARD_KEY_RESIDENCE_COUNTRY, CLIPBOARD_VALUE_COUNTRY_DE],
  [CLIPBOARD_KEY_RESIDENCE_TYPE, ADDRESS_TYPE_ORDINARY],
];

export const TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_FULL = [
  [CLIPBOARD_KEY_CURRENT_HOUSENR, CLIPBOARD_VALUE_HOUSENR],
  [CLIPBOARD_KEY_CURRENT_STREET, CLIPBOARD_VALUE_STREET],
  [CLIPBOARD_KEY_CURRENT_ZIP, CLIPBOARD_VALUE_ZIP],
  [CLIPBOARD_KEY_CURRENT_CITY, CLIPBOARD_VALUE_CITY],
  [CLIPBOARD_KEY_CURRENT_COUNTRY, CLIPBOARD_VALUE_COUNTRY_KP],
  [CLIPBOARD_KEY_CURRENT_INSTITUTION_NAME, CLIPBOARD_VALUE_INSTITUTION_NAME],
  [CLIPBOARD_KEY_CURRENT_TYPE, ADDRESS_TYPE_OTHER_FACILITY],
];
