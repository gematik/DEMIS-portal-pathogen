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

//field ids

export const FIELD_BIRTH_DATE_DEPRECATED = 'birthDate';
export const FIELD_BIRTH_DATE = 'birthDate-datepicker-input-field';
export const FIELD_PREFIX = 'prefix';
export const FIELD_SALUTATION = 'salutation';
export const FIELD_FIRST_NAME = 'firstname';
export const FIELD_LAST_NAME = 'lastname';
export const FIELD_INSTITUTIONAME = 'institutionName';
export const FIELD_DEPARTMENTNAME = 'departmentName';
export const FIELD_BSNR = 'bsnr';
export const FIELD_NOTIFIER_FACILITY_ADDRESS_HOUSE_NUMBER = 'houseNumber';
export const FIELD_NOTIFIER_FACILITY_ADDRESS_STREET = 'street';
export const FIELD_NOTIFIER_FACILITY_ADDRESS_ZIP = 'zip';
export const FIELD_NOTIFIER_FACILITY_ADDRESS_CITY = 'city';
export const FIELD_COPY_ADDRESS = 'copyAddressCheckBox';
export const FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER = 'houseNumber';
export const FIELD_SUBMITTING_FACILITY_ADDRESS_STREET = 'street';
export const FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP = 'zip';
export const FIELD_SUBMITTING_FACILITY_ADDRESS_CITY = 'city';
export const FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER = 'residence-address-houseNumber';
export const FIELD_RESIDENCE_ADDRESS_STREET = 'residence-address-street';
export const FIELD_RESIDENCE_ADDRESS_ZIP = 'residence-address-zip';
export const FIELD_RESIDENCE_ADDRESS_CITY = 'residence-address-city';
export const FIELD_RESIDENCE_ADDRESS_COUNTRY = 'residence-address-country';
export const FIELD_CURRENT_ADDRESS_INSTITUTION_NAME = 'currentAddressInstitutionName';
export const FIELD_CURRENT_ADDRESS_HOUSE_NUMBER = 'current-address-houseNumber';
export const FIELD_CURRENT_ADDRESS_STREET = 'current-address-street';
export const FIELD_CURRENT_ADDRESS_CITY = 'current-address-city';
export const FIELD_CURRENT_ADDRESS_ZIP = 'current-address-zip';
export const FIELD_CURRENT_ADDRESS_COUNTRY = 'current-address-country';
export const FIELD_EMAIL_CY = 'email';
export const FIELD_EMAIL_1 = 'email-0';
export const FIELD_EMAIL_2 = 'email-1';
export const FIELD_EMAIL_3 = 'email-2';
export const FIELD_PHONE_NUMBER_CY = 'phoneNo';
export const FIELD_PHONE_1 = 'phoneNo-0';
export const FIELD_PHONE_2 = 'phoneNo-1';
export const FIELD_PHONE_3 = 'phoneNo-2';
export const FIELD_FEDERAL_STATE = 'federalStateCodeDisplay';
export const FIELD_PATHOGEN_DISPLAY = 'pathogenDisplay';
export const FIELD_PATHOGEN = 'pathogen';
export const FIELD_REPORT_STATUS = 'reportStatus';
export const FIELD_INIT_NOTIFICATION_ID = 'initialNotificationId';
export const FIELD_INTERPRETATION = 'interpretation';
export const FIELD_LAB_ORDER_ID = 'laboratoryOrderId';
export const FIELD_EXTRACTION_DATE_DEPRECATED = 'extractionDate'; //only required until Datepicker runs under feature flag
export const FIELD_RECEIVED_DATE_DEPRECATED = 'receivedDate'; //only required until Datepicker runs under feature flag
export const FIELD_EXTRACTION_DATE = 'extractionDate-datepicker-input-field';
export const FIELD_RECEIVED_DATE = 'receivedDate-datepicker-input-field';
export const FIELD_MATERIAL = 'material';
export const FIELD_METHOD = 'method';
export const FIELD_METHOD_0 = 'method_0';
export const FIELD_RESULT = 'result';

//clipboard keys
export const CLIPBOARD_KEY_FACILITY_NAME = 'F.name';
export const CLIPBOARD_KEY_FACILITY_BSNR = 'F.bsnr';
export const CLIPBOARD_KEY_FACILITY_STREET = 'F.street';
export const CLIPBOARD_KEY_FACILITY_HOUSENO = 'F.houseNumber';
export const CLIPBOARD_KEY_FACILITY_ZIP = 'F.zip';
export const CLIPBOARD_KEY_FACILITY_CITY = 'F.city';
export const CLIPBOARD_KEY_NOTIFIER_SALUTATION = 'N.salutation';
export const CLIPBOARD_KEY_NOTIFIER_PREFIX = 'N.prefix';
export const CLIPBOARD_KEY_NOTIFIER_GIVEN = 'N.given';
export const CLIPBOARD_KEY_NOTIFIER_FAMILY = 'N.family';
export const CLIPBOARD_KEY_NOTIFIER_PHONE = 'N.phone';
export const CLIPBOARD_KEY_NOTIFIER_EMAIL = 'N.email';
export const CLIPBOARD_KEY_SUBMITTING_FACILITY_NAME = 'S.name';
export const CLIPBOARD_KEY_SUBMITTING_FACILITY_BSNR = 'S.bsnr';
export const CLIPBOARD_KEY_SUBMITTING_FACILITY_STREET = 'S.street';
export const CLIPBOARD_KEY_SUBMITTING_FACILITY_HOUSENO = 'S.houseNumber';
export const CLIPBOARD_KEY_SUBMITTING_FACILITY_ZIP = 'S.zip';
export const CLIPBOARD_KEY_SUBMITTING_FACILITY_CITY = 'S.city';
export const CLIPBOARD_KEY_SUBMITTING_NOTIFIER_SALUTATION = 'S.salutation';
export const CLIPBOARD_KEY_SUBMITTING_NOTIFIER_PREFIX = 'S.prefix';
export const CLIPBOARD_KEY_SUBMITTING_NOTIFIER_GIVEN = 'S.given';
export const CLIPBOARD_KEY_SUBMITTING_NOTIFIER_FAMILY = 'S.family';
export const CLIPBOARD_KEY_SUBMITTING_NOTIFIER_PHONE = 'S.phone';
export const CLIPBOARD_KEY_SUBMITTING_NOTIFIER_EMAIL = 'S.email';
export const CLIPBOARD_KEY_PERSON_GENDER = 'P.gender';
export const CLIPBOARD_KEY_PERSON_GIVEN = 'P.given';
export const CLIPBOARD_KEY_PERSON_FAMILY = 'P.family';
export const CLIPBOARD_KEY_PERSON_BIRTHDATE = 'P.birthDate';
export const CLIPBOARD_KEY_RESIDENCE_HOUSENR = 'P.r.houseNumber';
export const CLIPBOARD_KEY_RESIDENCE_STREET = 'P.r.street';
export const CLIPBOARD_KEY_RESIDENCE_ZIP = 'P.r.zip';
export const CLIPBOARD_KEY_RESIDENCE_CITY = 'P.r.city';
export const CLIPBOARD_KEY_RESIDENCE_COUNTRY = 'P.r.country';
export const CLIPBOARD_KEY_RESIDENCE_TYPE = 'P.r.type';
export const CLIPBOARD_KEY_CURRENT_HOUSENR = 'P.c.houseNumber';
export const CLIPBOARD_KEY_CURRENT_STREET = 'P.c.street';
export const CLIPBOARD_KEY_CURRENT_ZIP = 'P.c.zip';
export const CLIPBOARD_KEY_CURRENT_CITY = 'P.c.city';
export const CLIPBOARD_KEY_CURRENT_COUNTRY = 'P.c.country';
export const CLIPBOARD_KEY_CURRENT_INSTITUTION_NAME = 'P.c.name';
export const CLIPBOARD_KEY_CURRENT_TYPE = 'P.c.type';

// clipboard keys notificationCategory
export const CLIPBOARD_KEY_SUBPATHOGEN = 'T.pathogen';
export const CLIPBOARD_KEY_REPORTSTATUS = 'T.reportStatus';
export const CLIPBOARD_KEY_INTERPRETATION_TEXT = 'T.interpretationText';
export const CLIPBOARD_KEY_INITIAL_NOTIFICATION_ID = 'T.relatesTo';
export const CLIPBOARD_KEY_NOTIFICATION_CATEGORY = 'T.notificationCategory';

// clipboard keys diagnostic
export const CLIPBOARD_KEY_INTERPRETATION = 'T.interpretation';
export const CLIPBOARD_KEY_COLLECTED_DATE = 'T.collectedDate';
export const CLIPBOARD_KEY_RECEIVED_DATE = 'T.receivedDate';
export const CLIPBOARD_KEY_MATERIAL = 'T.material';
export const CLIPBOARD_KEY_METHOD = 'T.method';
export const CLIPBOARD_KEY_ANALYT = 'T.analyt';

// clipboard values
export const CLIPBOARD_VALUE_FACILITY_NAME = 'Clipboard Name';
export const CLIPBOARD_VALUE_FACILITY_BSNR = '99987654';
export const CLIPBOARD_VALUE_FACILITY_STREET = 'Clipboard Street';
export const CLIPBOARD_VALUE_FACILITY_HOUSENO = '69';
export const CLIPBOARD_VALUE_FACILITY_ZIP = '33739';
export const CLIPBOARD_VALUE_FACILITY_CITY = 'Bielefeld';
export const CLIPBOARD_VALUE_NOTIFIER_SALUTATION = 'Mrs';
export const CLIPBOARD_VALUE_NOTIFIER_PREFIX = 'Dr.';
export const CLIPBOARD_VALUE_NOTIFIER_GIVEN = 'Vorname';
export const CLIPBOARD_VALUE_NOTIFIER_FAMILY = 'Nachname';
export const CLIPBOARD_VALUE_NOTIFIER_PHONE = '08768324923';
export const CLIPBOARD_VALUE_NOTIFIER_EMAIL = 'v.nachname@gmx.de';

export const CLIPBOARD_VALUE_PERSON_GENDER = 'FEMALE';
export const CLIPBOARD_VALUE_PERSON_GIVEN = 'Testerina';
export const CLIPBOARD_VALUE_PERSON_FAMILY = 'Testersson';
export const CLIPBOARD_VALUE_PERSON_BIRTHDATE = '01.01.2020';

export const CLIPBOARD_VALUE_SUBPATHOGEN = '407479009';
export const CLIPBOARD_VALUE_REPORTSTATUS = 'final';
export const CLIPBOARD_VALUE_INTERPRETATION_TEXT = 'Schaut nicht gut aus';
export const CLIPBOARD_VALUE_INITIAL_NOTIFICATION_ID = '11111111';
export const CLIPBOARD_VALUE_NOTIFICATION_CATEGORY = 'invp';
export const CLIPBOARD_VALUE_INTERPRETATION = 'POS';
export const CLIPBOARD_VALUE_COLLECTED_DATE = '01.01.2025';
export const CLIPBOARD_VALUE_RECEIVED_DATE = '01.01.2025';
export const CLIPBOARD_VALUE_MATERIAL = '123038009';
export const CLIPBOARD_VALUE_METHOD = '117040002';
export const CLIPBOARD_VALUE_ANALYT = 'T.analyt';

export const SPECIMEN_TITLE = 'Probe';
export const MATERIAL_VALUE_INVP = 'Sputum';
export const METHOD_VALUE_INVP = 'Antigenschnelltest';
export const METHOD_VALUE_2_INVP = 'DNA-Sequenzierung';
export const PATHOGEN_DISPLAY = 'Influenzavirus';

//notfier-facility values
export const NOTIFIER_VALUE_INSTITUTION_NAME = 'TEST Organisation';
export const NOTIFIER_VALUE_BSNR = '248123512';
export const NOTIFIER_VALUE_STREET = 'Im Himmelreich';
export const NOTIFIER_VALUE_ZIP = '21481';
export const NOTIFIER_VALUE_CITY = 'Frühling';
export const NOTIFIER_VALUE_HOUSENR = '1';
export const FIELD_NOTIFIER_FACILITY_PREFIX = 'Frau';
export const FIELD_NOTIFIER_FACILITY_SALUTATION = 'Dr.';
export const FIELD_NOTIFIER_FACILITY_FIRSTNAME = 'Melderina';
export const FIELD_NOTIFIER_FACILITY_LASTNAME = 'Melderson';
export const FIELD_NOTIFIER_FACILITY_PHONENUMBER = '0182736912388889';
export const FIELD_NOTIFIER_FACILITY_EMAILADDRESS = 'testerino@test.de';

//submitting-facility values
export const SUBMITTING_VALUE_DEPARTMENT_NAME = 'TEST Organisation Department 8A';

//clipboard values
export const CLIPBOARD_VALUE_COUNTRY_DE = 'DE';
export const CLIPBOARD_VALUE_COUNTRY_KP = 'KP';
export const CLIPBOARD_LABEL_COUNTRY_DE = 'Deutschland';
export const CLIPBOARD_LABEL_FEDERAL_STATE = 'Baden-Württemberg';
export const CLIPBOARD_LABEL_COUNTRY_KP = 'Demokratische Volksrepublik Korea';
export const CLIPBOARD_VALUE_STREET = 'Teststreet';
export const CLIPBOARD_VALUE_ZIP = '12345';
export const CLIPBOARD_VALUE_CITY = 'Bielefeld';
export const CLIPBOARD_VALUE_HOUSENR = '11';
export const CLIPBOARD_VALUE_INSTITUTION_NAME = 'Test Institution';

//address types
export const ADDRESS_TYPE_PRIMARYASCURRENT = 'primaryAsCurrent';
export const ADDRESS_TYPE_SUBMITTING_FACILITY = 'submittingFacility';
export const ADDRESS_TYPE_CURRENT = 'current';
export const ADDRESS_TYPE_OTHER_FACILITY = 'otherFacility';
export const ADDRESS_TYPE_PRIMARY = 'primary';
export const ADDRESS_TYPE_ORDINARY = 'ordinary';

export const VALID_DATE_BEFORE = '01.01.2025';
export const VALID_DATE_AFTER = '21.01.2025';

//validation input values
export const VALUE_INVALID_DATE = '12.13.2012';
export const VALUE_INVALID_NAME_SPECIAL_CHAR = 'Eins$';
export const VALUE_INVALID_NAME_NUMBER = 'Eins1';
export const VALUE_EMPTY = '';
export const VALUE_SPACE = ' ';
export const VALUE_INVALID_SPECIAL_CHAR = 'Testxxx?';
export const VALUE_SHORT_ZIP = '11';
export const VALUE_INVALID_HOUSE_NUMBER = '1a,';
export const VALUE_INVALID_EMAIL_1 = 'auch-ungueltig.de';
export const VALUE_INVALID_EMAIL_2 = '_@test_Me.too';
export const VALUE_INVALID_EMAIL_3 = 'keinesonderzeichen´êa@ü?.djkd';
export const VALUE_INVALID_EMAIL_4 =
  'genau321Zeichen_nach_dem@Lorem-ipsum-dolor-sit-amet--consetetur-sadipscing-elitr--sed-diam-nonumy-eirmod-tempor-invidunt-ut-labore-et-dolore-magna-aliquyam-erat--sed-diam-voluptua.-At-vero-eos-et-accusam-et-justo-duo-dolores-et-ea-rebum.-Stet-clita-kasd-gubergren--no-sea-takimata-sanctus-est-Lorem-ipsum-dolor-sit-amet.-Lorem-ipsum-dolor-sit.com';
export const VALUE_INVALID_EMAIL_5 = '@abc.de';
export const VALUE_INVALID_EMAIL_6 = 'ab@de';
export const VALUE_INVALID_EMAIL_7 = 'ab.de';
export const VALUE_INVALID_EMAIL_8 = 'ab@cde.de[';

export const VALUE_INVALID_PHONE_1 = '1741236589';
export const VALUE_INVALID_PHONE_2 = '01234';
export const VALUE_INVALID_PHONE_3 = '0123456789abc';
export const VALUE_INVALID_PHONE_4 = '(0049)1741236589';
export const VALUE_INVALD_BSNR = '12345678';
export const VALUE_INVALID_DISPLAY = 'Mich gibt es nicht';

//validation error messages
export const ERROR_INVALID_DATE_DEPRECATED = 'Kein gültiges Datum (Beispiele: 05.11.1998)'; //only required until Datepicker runs under feature flag
export const ERROR_INVALID_DATE = 'Das eingegebene Datum ist ungültig';
export const ERROR_INVALID_SPECIAL_CHAR = 'Ihre Eingabe enthält unzulässige Sonderzeichen';
export const ERROR_REQUIRED = 'Diese Angabe wird benötigt';
export const ERROR_MIN_LENGTH = 'Minimallänge nicht erreicht';
export const ERROR_MIN_ONE_CHAR = 'Es muss mindestens ein Zeichen eingegeben werden';
export const ERROR_INVALID_HOUSE_NUMBER = 'Keine gültige Hausnummer';
export const ERROR_INVALID_EMAIL = 'Keine gültige E-Mail (Beispiel: meine.Email@email.de)';
export const ERROR_INVALID_PHONE = 'Die Telefonnummer muss mit 0 oder + beginnen, gefolgt von mindestens 6 Ziffern.';
export const ERROR_INVALID_BSNR = 'Bitte geben Sie Ihre 9-stellige Betriebsstättennummer (BSNR) ein';
export const ERROR_EXTRACTION_DATE = 'Das Entnahmedatum darf nicht nach dem Eingangsdatum liegen';
export const ERROR_OPTION_MISMATCH = 'Keine Übereinstimmung gefunden';
export const ERROR_OPTION_INCOMPLETE = 'Unvollständige Eingabe';

// buttons
export const ADD_BUTTON_EMAIL = '#emailAddresses-add-button';
export const ADD_BUTTON_PHONE = '#phoneNumbers-add-button';
export const ADD_BUTTON_CLIPBOARD = '#btn-fill-form';
