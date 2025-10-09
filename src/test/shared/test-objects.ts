/*
    Copyright (c) 2025 gematik GmbH
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
    For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { AddressType, MethodPathogenDTO, NotificationLaboratoryCategory } from '../../api/notification';
import {
  CLIPBOARD_KEY_CURRENT_CITY,
  CLIPBOARD_KEY_CURRENT_HOUSENR,
  CLIPBOARD_KEY_CURRENT_INSTITUTION_NAME,
  CLIPBOARD_KEY_CURRENT_STREET,
  CLIPBOARD_KEY_CURRENT_TYPE,
  CLIPBOARD_KEY_CURRENT_ZIP,
  CLIPBOARD_KEY_FACILITY_BSNR,
  CLIPBOARD_KEY_FACILITY_CITY,
  CLIPBOARD_KEY_FACILITY_HOUSENO,
  CLIPBOARD_KEY_FACILITY_NAME,
  CLIPBOARD_KEY_FACILITY_STREET,
  CLIPBOARD_KEY_FACILITY_ZIP,
  CLIPBOARD_KEY_NOTIFIER_EMAIL,
  CLIPBOARD_KEY_NOTIFIER_FAMILY,
  CLIPBOARD_KEY_NOTIFIER_GIVEN,
  CLIPBOARD_KEY_NOTIFIER_PHONE,
  CLIPBOARD_KEY_NOTIFIER_PREFIX,
  CLIPBOARD_KEY_PERSON_BIRTHDATE,
  CLIPBOARD_KEY_PERSON_FAMILY,
  CLIPBOARD_KEY_PERSON_GENDER,
  CLIPBOARD_KEY_PERSON_GIVEN,
  CLIPBOARD_KEY_RESIDENCE_CITY,
  CLIPBOARD_KEY_RESIDENCE_COUNTRY,
  CLIPBOARD_KEY_RESIDENCE_HOUSENR,
  CLIPBOARD_KEY_RESIDENCE_STREET,
  CLIPBOARD_KEY_RESIDENCE_TYPE,
  CLIPBOARD_KEY_RESIDENCE_ZIP,
  CLIPBOARD_KEY_SUBMITTING_FACILITY_BSNR,
  CLIPBOARD_KEY_SUBMITTING_FACILITY_CITY,
  CLIPBOARD_KEY_SUBMITTING_FACILITY_HOUSENO,
  CLIPBOARD_KEY_SUBMITTING_FACILITY_NAME,
  CLIPBOARD_KEY_SUBMITTING_FACILITY_STREET,
  CLIPBOARD_KEY_SUBMITTING_FACILITY_ZIP,
  CLIPBOARD_KEY_SUBMITTING_NOTIFIER_EMAIL,
  CLIPBOARD_KEY_SUBMITTING_NOTIFIER_FAMILY,
  CLIPBOARD_KEY_SUBMITTING_NOTIFIER_GIVEN,
  CLIPBOARD_KEY_SUBMITTING_NOTIFIER_PHONE,
  CLIPBOARD_KEY_SUBMITTING_NOTIFIER_PREFIX,
  CLIPBOARD_LABEL_FEDERAL_STATE,
  CLIPBOARD_VALUE_CITY,
  CLIPBOARD_VALUE_COLLECTED_DATE,
  CLIPBOARD_VALUE_COUNTRY_DE,
  CLIPBOARD_VALUE_FACILITY_BSNR,
  CLIPBOARD_VALUE_FACILITY_CITY,
  CLIPBOARD_VALUE_FACILITY_HOUSENO,
  CLIPBOARD_VALUE_FACILITY_NAME,
  CLIPBOARD_VALUE_FACILITY_STREET,
  CLIPBOARD_VALUE_FACILITY_ZIP,
  CLIPBOARD_VALUE_HOUSENR,
  CLIPBOARD_VALUE_INITIAL_NOTIFICATION_ID,
  CLIPBOARD_VALUE_INSTITUTION_NAME,
  CLIPBOARD_VALUE_INTERPRETATION_TEXT,
  CLIPBOARD_VALUE_LABORATORY_ORDER_ID,
  CLIPBOARD_VALUE_MATERIAL,
  CLIPBOARD_VALUE_METHOD,
  CLIPBOARD_VALUE_NOTIFICATION_CATEGORY,
  CLIPBOARD_VALUE_NOTIFIER_EMAIL,
  CLIPBOARD_VALUE_NOTIFIER_FAMILY,
  CLIPBOARD_VALUE_NOTIFIER_GIVEN,
  CLIPBOARD_VALUE_NOTIFIER_PHONE,
  CLIPBOARD_VALUE_NOTIFIER_PREFIX,
  CLIPBOARD_VALUE_PERSON_BIRTHDATE,
  CLIPBOARD_VALUE_PERSON_FAMILY,
  CLIPBOARD_VALUE_PERSON_GENDER,
  CLIPBOARD_VALUE_PERSON_GIVEN,
  CLIPBOARD_VALUE_RECEIVED_DATE,
  CLIPBOARD_VALUE_REPORTSTATUS,
  CLIPBOARD_VALUE_STREET,
  CLIPBOARD_VALUE_SUBPATHOGEN,
  CLIPBOARD_VALUE_ZIP,
  FIELD_BSNR,
  FIELD_CURRENT_ADDRESS_CITY,
  FIELD_CURRENT_ADDRESS_HOUSE_NUMBER,
  FIELD_CURRENT_ADDRESS_INSTITUTION_NAME,
  FIELD_CURRENT_ADDRESS_STREET,
  FIELD_CURRENT_ADDRESS_ZIP,
  FIELD_EMAIL_1,
  FIELD_EXTRACTION_DATE_DEPRECATED,
  FIELD_FEDERAL_STATE,
  FIELD_INIT_NOTIFICATION_ID,
  FIELD_INSTITUTIONAME,
  FIELD_INTERPRETATION,
  FIELD_LAB_ORDER_ID,
  FIELD_MATERIAL,
  FIELD_METHOD_0,
  FIELD_NOTIFIER_FACILITY_ADDRESS_CITY,
  FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER,
  FIELD_NOTIFIER_FACILITY_ADDRESS_STREET,
  FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP,
  FIELD_NOTIFIER_FACILITY_FIRSTNAME,
  FIELD_NOTIFIER_FACILITY_LASTNAME,
  FIELD_NOTIFIER_FACILITY_PREFIX,
  FIELD_PATHOGEN,
  FIELD_PATHOGEN_DISPLAY,
  FIELD_PHONE_1,
  FIELD_RECEIVED_DATE_DEPRECATED,
  FIELD_REPORT_STATUS,
  FIELD_RESIDENCE_ADDRESS_CITY,
  FIELD_RESIDENCE_ADDRESS_COUNTRY,
  FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER,
  FIELD_RESIDENCE_ADDRESS_STREET,
  FIELD_RESIDENCE_ADDRESS_ZIP,
  FIELD_RESULT,
} from './test-constants';
import { TEST_DATA } from './test-data';
import ReportStatusEnum = NotificationLaboratoryCategory.ReportStatusEnum;
import ResultEnum = MethodPathogenDTO.ResultEnum;

interface TestDataStructure {
  selector: string;
  value: string;
  clipboardDataKey?: string;
  clipboardValue?: string;
}

export interface TestDataNotificationCategoryPage {
  federalStateCodeDisplay: TestDataStructure;
  pathogenDisplay: TestDataStructure;
  pathogen: TestDataStructure;
  reportStatus: TestDataStructure;
  initialNotificationId: TestDataStructure;
  interpretation: TestDataStructure;
  laboratoryOrderId: TestDataStructure;
}

export interface TestDataDiagnosticPage {
  extractionDate: TestDataStructure;
  receivedDate: TestDataStructure;
  material: TestDataStructure;
  method: TestDataStructure;
  result: TestDataStructure;
}

// Notifier & Submitter
export interface TestDataFacilityPage {
  institutionName: TestDataStructure;
  bsnr: TestDataStructure | {};
  stationName?: TestDataStructure;
  street: TestDataStructure;
  houseNumber: TestDataStructure;
  zip: TestDataStructure;
  city: TestDataStructure;
  title: TestDataStructure;
  firstName: TestDataStructure;
  lastName: TestDataStructure;
  phone: TestDataStructure;
  email: TestDataStructure;
}

export interface TestDataNotifiedPersonPage {
  gender: TestDataStructure;
  firstName: TestDataStructure;
  lastName: TestDataStructure;
  birthDate: TestDataStructure;
  residenceType: TestDataStructure;
  street: TestDataStructure;
  houseNumber: TestDataStructure;
  zip: TestDataStructure;
  city: TestDataStructure;
  country: TestDataStructure;
  currentAddressType: TestDataStructure;
  currentName: TestDataStructure;
  currentZip: TestDataStructure;
  currentCity: TestDataStructure;
  currentHouseNo: TestDataStructure;
  currentStreet: TestDataStructure;
  phone?: TestDataStructure;
  email?: TestDataStructure;
}

export type FacilityEnum = 'notifier' | 'submitter';

export const TEST_FACILITY = (type: FacilityEnum): TestDataFacilityPage => {
  return {
    institutionName: {
      selector: `#${FIELD_INSTITUTIONAME}`,
      value: 'Sample Institution',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_FACILITY_NAME : CLIPBOARD_KEY_SUBMITTING_FACILITY_NAME,
      clipboardValue: CLIPBOARD_VALUE_FACILITY_NAME,
    },
    bsnr:
      type === 'notifier'
        ? {
            selector: `#${FIELD_BSNR}`,
            value: '123456789',
            clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_FACILITY_BSNR : CLIPBOARD_KEY_SUBMITTING_FACILITY_BSNR,
            clipboardValue: CLIPBOARD_VALUE_FACILITY_BSNR,
          }
        : {},
    // stationName: type === 'submitter' ? {
    //   selector: `#${FIELD_STAT}`,
    //   value: 'Sample Station',
    // },
    street: {
      selector: `#${FIELD_NOTIFIER_FACILITY_ADDRESS_STREET}`,
      value: 'Sample Street',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_FACILITY_STREET : CLIPBOARD_KEY_SUBMITTING_FACILITY_STREET,
      clipboardValue: CLIPBOARD_VALUE_FACILITY_STREET,
    },
    houseNumber: {
      selector: `#${FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER}`,
      value: '123',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_FACILITY_HOUSENO : CLIPBOARD_KEY_SUBMITTING_FACILITY_HOUSENO,
      clipboardValue: CLIPBOARD_VALUE_FACILITY_HOUSENO,
    },
    zip: {
      selector: `#${FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP}`,
      value: '12345',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_FACILITY_ZIP : CLIPBOARD_KEY_SUBMITTING_FACILITY_ZIP,
      clipboardValue: CLIPBOARD_VALUE_FACILITY_ZIP,
    },
    city: {
      selector: `#${FIELD_NOTIFIER_FACILITY_ADDRESS_CITY}`,
      value: 'Sample City',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_FACILITY_CITY : CLIPBOARD_KEY_SUBMITTING_FACILITY_CITY,
      clipboardValue: CLIPBOARD_VALUE_FACILITY_CITY,
    },
    title: {
      selector: `#${FIELD_NOTIFIER_FACILITY_PREFIX}`,
      value: 'Dr.',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_NOTIFIER_PREFIX : CLIPBOARD_KEY_SUBMITTING_NOTIFIER_PREFIX,
      clipboardValue: CLIPBOARD_VALUE_NOTIFIER_PREFIX,
    },
    firstName: {
      selector: `#${FIELD_NOTIFIER_FACILITY_FIRSTNAME}`,
      value: 'John',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_NOTIFIER_GIVEN : CLIPBOARD_KEY_SUBMITTING_NOTIFIER_GIVEN,
      clipboardValue: CLIPBOARD_VALUE_NOTIFIER_GIVEN,
    },
    lastName: {
      selector: `#${FIELD_NOTIFIER_FACILITY_LASTNAME}`,
      value: 'Doe',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_NOTIFIER_FAMILY : CLIPBOARD_KEY_SUBMITTING_NOTIFIER_FAMILY,
      clipboardValue: CLIPBOARD_VALUE_NOTIFIER_FAMILY,
    },
    phone: {
      selector: `#${FIELD_PHONE_1}`,
      value: '0123-456-7890',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_NOTIFIER_PHONE : CLIPBOARD_KEY_SUBMITTING_NOTIFIER_PHONE,
      clipboardValue: CLIPBOARD_VALUE_NOTIFIER_PHONE,
    },
    email: {
      selector: `#${FIELD_EMAIL_1}`,
      value: 'john.doe@example.com',
      clipboardDataKey: type === 'notifier' ? CLIPBOARD_KEY_NOTIFIER_EMAIL : CLIPBOARD_KEY_SUBMITTING_NOTIFIER_EMAIL,
      clipboardValue: CLIPBOARD_VALUE_NOTIFIER_EMAIL,
    },
  };
};

export const TEST_NOTIFIED_PERSON: TestDataNotifiedPersonPage = {
  gender: {
    selector: '#gender',
    value: 'Female',
    clipboardDataKey: CLIPBOARD_KEY_PERSON_GENDER,
    clipboardValue: CLIPBOARD_VALUE_PERSON_GENDER,
  },
  firstName: {
    selector: '#firstname',
    value: 'Jane',
    clipboardDataKey: CLIPBOARD_KEY_PERSON_GIVEN,
    clipboardValue: CLIPBOARD_VALUE_PERSON_GIVEN,
  },
  lastName: {
    selector: '#lastname',
    value: 'Doe',
    clipboardDataKey: CLIPBOARD_KEY_PERSON_FAMILY,
    clipboardValue: CLIPBOARD_VALUE_PERSON_FAMILY,
  },
  birthDate: {
    selector: '#birthDate',
    value: '1990-01-01',
    clipboardDataKey: CLIPBOARD_KEY_PERSON_BIRTHDATE,
    clipboardValue: CLIPBOARD_VALUE_PERSON_BIRTHDATE,
  },
  residenceType: {
    selector: '#residenceType',
    value: AddressType.Primary,
    clipboardDataKey: CLIPBOARD_KEY_RESIDENCE_TYPE,
    clipboardValue: AddressType.Primary,
  },
  street: {
    selector: `#${FIELD_RESIDENCE_ADDRESS_STREET}`,
    value: 'Sample Street',
    clipboardDataKey: CLIPBOARD_KEY_RESIDENCE_STREET,
    clipboardValue: CLIPBOARD_VALUE_STREET,
  },
  houseNumber: {
    selector: `#${FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER}`,
    value: '123',
    clipboardDataKey: CLIPBOARD_KEY_RESIDENCE_HOUSENR,
    clipboardValue: CLIPBOARD_VALUE_HOUSENR,
  },
  zip: {
    selector: `#${FIELD_RESIDENCE_ADDRESS_ZIP}`,
    value: '12345',
    clipboardDataKey: CLIPBOARD_KEY_RESIDENCE_ZIP,
    clipboardValue: CLIPBOARD_VALUE_ZIP,
  },
  city: {
    selector: `#${FIELD_RESIDENCE_ADDRESS_CITY}`,
    value: 'Sample City',
    clipboardDataKey: CLIPBOARD_KEY_RESIDENCE_CITY,
    clipboardValue: CLIPBOARD_VALUE_CITY,
  },
  country: {
    selector: `#${FIELD_RESIDENCE_ADDRESS_COUNTRY}`,
    value: 'Deutschland',
    clipboardDataKey: CLIPBOARD_KEY_RESIDENCE_COUNTRY,
    clipboardValue: CLIPBOARD_VALUE_COUNTRY_DE,
  },
  currentAddressType: {
    selector: '',
    value: AddressType.PrimaryAsCurrent,
    clipboardDataKey: CLIPBOARD_KEY_CURRENT_TYPE,
    clipboardValue: AddressType.PrimaryAsCurrent,
  },
  currentName: {
    selector: `#${FIELD_CURRENT_ADDRESS_INSTITUTION_NAME}`,
    value: 'Test Current Institution',
    clipboardDataKey: CLIPBOARD_KEY_CURRENT_INSTITUTION_NAME,
    clipboardValue: CLIPBOARD_VALUE_INSTITUTION_NAME,
  },
  currentZip: {
    selector: `#${FIELD_CURRENT_ADDRESS_ZIP}`,
    value: '55122',
    clipboardDataKey: CLIPBOARD_KEY_CURRENT_ZIP,
    clipboardValue: CLIPBOARD_VALUE_ZIP,
  },
  currentCity: {
    selector: `#${FIELD_CURRENT_ADDRESS_CITY}`,
    value: 'Mainz',
    clipboardDataKey: CLIPBOARD_KEY_CURRENT_CITY,
    clipboardValue: CLIPBOARD_VALUE_CITY,
  },
  currentHouseNo: {
    selector: `#${FIELD_CURRENT_ADDRESS_HOUSE_NUMBER}`,
    value: '22',
    clipboardDataKey: CLIPBOARD_KEY_CURRENT_HOUSENR,
    clipboardValue: CLIPBOARD_VALUE_HOUSENR,
  },
  currentStreet: {
    selector: `#${FIELD_CURRENT_ADDRESS_STREET}`,
    value: 'Am Volkspark',
    clipboardDataKey: CLIPBOARD_KEY_CURRENT_STREET,
    clipboardValue: CLIPBOARD_VALUE_STREET,
  },
};

export const TEST_NOTIFICATION_CATEGORY: TestDataNotificationCategoryPage = {
  federalStateCodeDisplay: {
    selector: `#${FIELD_FEDERAL_STATE}`,
    value: CLIPBOARD_LABEL_FEDERAL_STATE,
  },
  pathogenDisplay: {
    selector: `#${FIELD_PATHOGEN_DISPLAY}`,
    value: TEST_DATA.pathogenCodeDisplays[0].designations[0].value,
    clipboardDataKey: 'T.notificationCategory',
    clipboardValue: CLIPBOARD_VALUE_NOTIFICATION_CATEGORY,
  },
  pathogen: {
    selector: `#${FIELD_PATHOGEN}`,
    value: TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.answerSet[0].designations[1].value,
    clipboardDataKey: 'T.pathogen',
    clipboardValue: CLIPBOARD_VALUE_SUBPATHOGEN,
  },
  reportStatus: {
    selector: `#${FIELD_REPORT_STATUS}`,
    value: ReportStatusEnum.Final,
    clipboardDataKey: 'T.reportStatus',
    clipboardValue: CLIPBOARD_VALUE_REPORTSTATUS,
  },
  initialNotificationId: {
    selector: `#${FIELD_INIT_NOTIFICATION_ID}`,
    value: CLIPBOARD_VALUE_INITIAL_NOTIFICATION_ID,
    clipboardDataKey: 'T.relatesTo',
    clipboardValue: CLIPBOARD_VALUE_INITIAL_NOTIFICATION_ID,
  },
  interpretation: {
    selector: `#${FIELD_INTERPRETATION}`,
    value: CLIPBOARD_VALUE_INTERPRETATION_TEXT,
    clipboardDataKey: 'T.interpretationText',
    clipboardValue: CLIPBOARD_VALUE_INTERPRETATION_TEXT,
  },
  laboratoryOrderId: {
    selector: `#${FIELD_LAB_ORDER_ID}`,
    value: CLIPBOARD_VALUE_LABORATORY_ORDER_ID,
    clipboardDataKey: 'T.serviceRequest',
    clipboardValue: CLIPBOARD_VALUE_LABORATORY_ORDER_ID,
  },
};

export const specimenDTO: TestDataDiagnosticPage = {
  extractionDate: {
    selector: `[id^=${FIELD_EXTRACTION_DATE_DEPRECATED}]`,
    value: CLIPBOARD_VALUE_COLLECTED_DATE,
    clipboardDataKey: 'T.collectedDate',
    clipboardValue: CLIPBOARD_VALUE_COLLECTED_DATE,
  },
  receivedDate: {
    selector: `[id^=${FIELD_RECEIVED_DATE_DEPRECATED}]`,
    value: CLIPBOARD_VALUE_COLLECTED_DATE,
    clipboardDataKey: 'T.receivedDate',
    clipboardValue: CLIPBOARD_VALUE_RECEIVED_DATE,
  },
  material: {
    selector: `#${FIELD_MATERIAL}`,
    value: 'Anderes Untersuchungsmaterial',
    clipboardDataKey: 'T.material',
    clipboardValue: CLIPBOARD_VALUE_MATERIAL,
  },
  method: {
    selector: `#${FIELD_METHOD_0}`,
    value: 'Sputum',
    clipboardDataKey: 'T.method',
    clipboardValue: CLIPBOARD_VALUE_METHOD,
  },
  result: {
    selector: `#${FIELD_RESULT}_0`,
    value: ResultEnum.Pos,
    clipboardDataKey: 'T.interpretation',
  },
};
