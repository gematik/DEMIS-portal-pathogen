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

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { format, isValid, parse } from 'date-fns';
import { DateTime } from 'luxon';
import { v4 as uuid_v4 } from 'uuid';

import { CodeDisplay, Designation, NotifiedPersonBasicInfo, PractitionerInfo } from '../../../api/notification';
// CONST:..................................

/*** id: de-DE ***/
export const LOCALE_ID_DE: string = 'de-DE';
registerLocaleData(localeDe, LOCALE_ID_DE, localeDeExtra);

/*** format: yyyy-MM-dd ***/
export const DATE_FORMAT: string = 'yyyy-MM-dd';
/*** format: yyyy-MM-dd ***/
export const DATE_FORMAT_LUXON: string = 'yyyy-LL-dd';
/*** format: dd.MM.yyyy ***/
export const UI_DATE_FORMAT_GER: string = 'TT.MM.JJJJ';
export const UI_DATE_FORMAT_ENG: string = 'dd.MM.yyyy';
/*** format: dd.LL.yyyy ***/
export const UI_LUXON_DATE_FORMAT: string = 'dd.LL.yyyy';
/*** format: dd.LL.yyyy HH:mm:ss ***/
export const UI_LUXON_DATE_TIME_FORMAT: string = `${UI_DATE_FORMAT_ENG} HH:mm:ss`;
/*** yyyy, mm.yyyy, dd.MM.yyyy ***/
export const UI_DATE_PLACE_HOLDER_ENG: string = `${UI_DATE_FORMAT_ENG.toLowerCase()}`;
export const PARTIAL_DATE_FORMAT: string = 'yyyy | mm.yyyy | dd.mm.yyyy ';
/*** code: DE ***/
export const GERMANY_COUNTRY_CODE: string = 'DE';
/*** code: 21481 ***/
export const ZIP_CODE_DEFAULT: string = '21481';

export const ZIP_GERMANY_MIN_LENGTH: number = 4;
export const ZIP_GERMANY_MAX_LENGTH: number = 5;
export const ZIP_INTERNATIONAL_MIN_LENGTH: number = 3;
export const ZIP_INTERNATIONAL_MAX_LENGTH: number = 50;
export const TEXT_MAX_LENGTH: number = 100;
export const MORE_INFO_MAX_LENGTH: number = 5000;
export const HOUSE_NBR_MAX_LENGTH: number = 51;
export const PHONE_MIN_LENGTH: number = 7; // 0 oder +, gefolgt von mindestens 6 Ziffern
export const PHONE_MAX_LENGTH: number = 50;
export const EMAIL_MAX_LENGTH: number = 5000;

// VALIDATIONS: More about this Reg-exp rules: https://wiki.gematik.de/pages/viewpage.action?pageId=459871766 ..........

export const BSNR_REG_EXP: RegExp = /^\d{9}$/; // 9-stellige Nummer
export const DATE_FORMAT_PARTIAL_EXP: RegExp = /^(((0?[1-9]|[1-2]\d|3[0-1])\.)?(0?[1-9]|1[0-2])\.)?(\d(\d(\d[1-9]|[1-9]0)|[1-9]00)|[1-9]000)$/; //yyyy, mm.yyyy, dd.mm.yyyy, m.yyyy, d.m.yyyy
export const DATE_FORMAT_DD_MM_YYYY_REG_EXP: RegExp = /^(0[1-9]|[12]\d|3[01])[.](0[1-9]|1[012])[.]([1-9])\d{3}$/; // for the format: dd.mm.yyyy
export const EMAIL_REG_EXP: RegExp = /^[A-Z0-9+_.-]+@[A-Z0-9.-]{5,320}$/i;
export const HOUSE_NBR_REG_EXP: RegExp = /^\d[\/ \-+0-9a-zA-Z]{0,50}$/; // No special characters allowed
export const PHONE_REG_EXP: RegExp = /^[0+][0-9 \-()]{6,50}$/; // Starts with 0 or +, followed by 7-15 digits
export const TEXT_REG_EXP: RegExp = /^[^@\\*?$|=´'"\[\]{}<>]{0,100}$/; // No dangerous signs allowed
export const STREET_REG_EXP: RegExp = /^[^@\\*?$|=´"\[\]{}<>]{0,100}$/;
export const ADDITIONAL_INFO_REG_EXP: RegExp = /^[^\\=´'<>]{0,5000}$/; // No dangerous signs allowed
export const ZIP_GERMANY_REG_EXP: RegExp = /^\d{5}$/; // 5 Ziffern allowed
export const ZIP_GERMANY_SHORT_REG_EXP: RegExp = /^\d{3}$/; // 3-stellige Nummer
export const ZIP_INTERNATIONAL_REG_EXP: RegExp = /(?=^[\w\- ]{3,50}$)(?=.*\d)/;
export const NAME_REG_EXP: RegExp = /^[^@\\*?$|=´'"\[\]{}<>0-9]{0,100}$/; // from https://wiki.gematik.de/x/JRlpGw
export const NUMBER_OF_BEDS: RegExp = /^\d{0,6}$/;

export const REQUIRED_FIELD: string = 'Pflichtfeld';
export const MINIMUM_LENGTH_NOT_REACHED = 'Minimallänge nicht erreicht';
export const BSNR_ERROR_MSG: string = 'Bitte geben Sie Ihre 9-stellige Betriebsstättennummer (BSNR) ein';
export const CHECK_INPUT_ERROR_MSG: string = 'Eingabe bitte überprüfen';
export const DATE_FORMAT_ERROR_MSG: string = 'Kein gültiges Datum (Beispiele: 05.11.1998)';
export const DATE_NOT_EXIST: string = 'Das Datum existiert nicht!';
export const PARTIAL_DATE_FORMAT_ERROR_MSG: string = 'Kein gültiges Datum (Beispiele: 2022, 08.1978, 05.11.1998)';
export const DATE_IN_FUTURE_ERROR_MSG: string = 'Das Datum darf nicht in der Zukunft liegen';
export const EMAIL_ERROR_MSG: string = 'Keine gültige E-Mail (Beispiel: meine.Email@email.de)';
export const BLANK_ERROR_MSG: string = 'Es muss mindestens ein Zeichen eingegeben werden';
export const HOUSE_NBR_ERROR_MSG: string = 'Keine gültige Hausnummer';
export const END_DATE_LATER_THAN_START_DATE_ERROR_MSG: string = 'Das Startdatum darf nicht nach dem Enddatum liegen';
export const NO_SPECIAL_CHARACTERS_ALLOWED_ERROR_MSG: string = 'Es sind keine Sonderzeichen erlaubt';
export const PHONE_ERROR_MSG: string = 'Die Telefonnummer muss mit 0 oder + beginnen, gefolgt von mindestens 6 Ziffern.';
export const TEXT_ERROR_MSG: string = 'Ihre Eingabe enthält unzulässige Sonderzeichen';
export const ZIP_GERMANY_ERROR_MSG: string = 'Die Postleitzahl muss aus 5 Ziffern bestehen';
export const ZIP_GERMANY_SHORT_ERROR_MSG: string = 'Die Postleitzahl muss aus 3 Ziffern bestehen';
export const ZIP_INTERNATIONAL_ERROR_MSG: string = 'Die Postleitzahl muss aus mindestens 3 Zeichen und einer Ziffer bestehen';
export const INIT_INFO_VALIDATOR_ERROR_MSG: string = 'Informationen zur Person nicht vollständig!';
export const ADDITIONAL_INFO_ERROR_MSG: string = 'Ihre Eingabe enthält unzulässige Sonderzeichen.';
export const NUMBER_OF_BEDS_ERROR_MSG: string = 'Bitte geben Sie eine positive Zahl ein.';
export const EMPTY_DROPDOWN_MENU_MSG: string = 'Es konnten keine Standorte zu Ihrem Institutionskennzeichen gefunden werden!';
export const VALUE_DEFAULT_PLACEHOLDER = 'Bitte eingeben';
export const VALUE_DEFUALT_SELECT_PLACEHOLDER = 'Bitte auswählen';

export const GERMAN_LANGUAGE_SELECTORS = ['de', 'de-de', 'de-at', 'de-ch'];

export const MY_DATE_FORMATS = {
  parse: { dateInput: UI_LUXON_DATE_FORMAT },
  display: {
    dateInput: UI_LUXON_DATE_FORMAT,
    monthYearLabel: 'yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'yyyy',
  },
};

// FUNCTIONS:...............................

/***
 * for automatic generation of a UUID *
 */
export function createUUID(): string {
  return uuid_v4();
}

/***
 * to get the current date with local timestamp and not the UTC time
 */
export function getTimestamp(): string {
  return getTimestampFromDate(new Date());
}

/***
 * special for getting the local timestamp and not the UTC time
 *
 * @param datetime
 */
export function getTimestampFromDate(datetime: Date): string {
  /**
   * special for getting the local timestamp and not the UTC time.
   */
  return new Date(datetime.toString().split('GMT')[0] + ' UTC').toISOString();
}

/***
 *
 * @param profile
 * @param id
 */
export function createReferenceUrl(profile: string, id: string): string {
  return profile.concat('/', id);
}

/***
 * returns current date as Date
 *
 * @param stringFormat
 */
export function newDate(stringFormat?: string): string {
  return format(new Date(), stringFormat ? stringFormat : DATE_FORMAT);
}

/***
 *
 * @param date
 */
export function setDateTimeStringFormat(date: Date): string {
  const now: Date = new Date();
  date.setHours(now.getHours());
  date.setMinutes(now.getMinutes());
  date.setSeconds(now.getSeconds());
  return date.toISOString();
}

/***
 * to reformat date string from DD.MM.YYYY to MM.DD.YYYY
 *
 * @param date
 */
export function convertDeToUsStringDateFormat(date: string): string {
  const splitDate = date.split('.');
  return `${splitDate[1]}.${splitDate[0]}.${splitDate[2]}`;
}

/***
 * to convert string to date
 *
 * @param date
 */
export function stringToDate(date: string): Date {
  return new Date(date);
}

/***
 * to convert string to Luxon date
 *
 * @param date
 * @param format
 */
export function stringToDateFromLuxon(date: string, format?: string): Date {
  format = format ?? UI_LUXON_DATE_FORMAT;
  //@ts-ignore
  return !!date && DateTime.fromFormat(date, format).isValid ? DateTime.fromFormat(date, format).toJSDate() : null;
}

/**
 * Converts a date string in YYYY-MM-DD format to dd.MM.yyyy.
 * Returns empty string if input is not exactly in that format or invalid.
 */
export function isoToGermanFormat(dateIso: string): string {
  if (!dateIso) return '';
  const parsed = parse(dateIso, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? format(parsed, 'dd.MM.yyyy') : '';
}

/**
 * If a german date string is given (ie. 14.03.2020 or 03.2022), it will be converted to ISO format.
 * @param input
 */
export function germanToIsoFormat(input: string): string {
  const formatsToTry = ['dd.MM.yyyy', 'MM.yyyy'];
  for (const fmt of formatsToTry) {
    const parsed = parse(input, fmt, new Date());
    if (isValid(parsed)) {
      if (fmt === 'dd.MM.yyyy') return format(parsed, 'yyyy-MM-dd');
      if (fmt === 'MM.yyyy') return format(parsed, 'yyyy-MM');
    }
  }

  return input;
}

/**
 * Converts a date string to YYMMDD format.
 * Supports both "DD.MM.YYYY" and "YYYY-MM-DD".
 *
 * @param date e.g., "05.11.1998" or "1998-11-05"
 * @returns birthDate as YYMMDD, e.g., "981105"
 */
export function formatDateToYYMMDD(date: string): string {
  if (!date) return '';

  const formatsToTry = ['dd.MM.yyyy', 'yyyy-MM-dd'];

  for (const fmt of formatsToTry) {
    const parsed = parse(date, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyMMdd');
    }
  }

  return '';
}

/***
 * to build date from partial (yyyy, mm.yyyy) date
 *  - PS: can be use to check if the partial date is in the future
 *
 * @param partialDate
 */
export function buildDateFromPartialDate(partialDate: string): Date | null {
  if (partialDate) {
    const splitDate: Array<string> = partialDate.split('.');
    switch (splitDate.length) {
      case 1:
        return new Date(`01.01.${splitDate[0]}`); // length = 1 when date = yyyy
      case 2:
        return new Date(`${splitDate[0]}.01.${splitDate[1]}`); // length = 2 when date = mm.yyyy
      case 3:
        return DateTime.fromFormat(partialDate, UI_LUXON_DATE_FORMAT).toJSDate();
      default:
        return null;
    }
  } else {
    return null;
  }
}

/***
 * to reformat date:
 *  - from: UI String "yyyy, mm.yyyy. dd.mm.yyyy"
 *  - to: FHIR specified string "yyyy, yyyy-mm, yyyy-mm-dd"
 *
 * @param partialDate
 */
export function reformatUiDateString(partialDate: string): string | null {
  if (partialDate) {
    const splitDate: Array<string> = partialDate.split('.');
    switch (splitDate.length) {
      case 1:
        return partialDate;
      case 2:
        return `${splitDate[1]}-${convertPartialDate(splitDate[0])}`;
      case 3:
        return `${splitDate[2]}-${convertPartialDate(splitDate[1])}-${convertPartialDate(splitDate[0])}`;
      default:
        return null;
    }
  } else {
    return null;
  }
}

/**
 * used on partial dates
 * i.e. Feb: 2 -> 02
 */
function convertPartialDate(no: string): string {
  return no.length > 1 ? no : `0${no}`;
}

/***
 * to reformat the date before sending it to "notification-gateway" so that it looks
 * like the fhir Date format
 *
 *  - from: UI String "dd.mm.yyyy"
 *  - to: FHIR specified string "yyyy-MM-dd"
 *
 * @param date
 */
export function toFhirDateFormat(date: string): string {
  if (!!date) {
    return DateTime.fromFormat(date, UI_LUXON_DATE_FORMAT).toFormat(DATE_FORMAT_LUXON);
  } else {
    return '';
  }
}

/***
 * to reformat the date before sending it to "notification-gateway" so that it looks
 * like the fhir Date-Time format
 *
 *  - from: UI String "dd.mm.yyyy"
 *  - to: FHIR specified date-time string (ISO) "yyyy-MM-dd'T'HH:mm:ss.SSSXXX" *
 *
 * @param date
 */
//@ts-ignore
export function toFhirDateTimeFormat(date: string): string {
  if (!!date) {
    return DateTime.fromFormat(toFhirDateFormat(date), DATE_FORMAT_LUXON).toString();
  }
}

const escapeRegExp = (string: string) => {
  //we have options with () and []
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function filterDisplayValues(term: string, data: string[]): string[] {
  const escapedTerm = escapeRegExp(term);
  const regex = new RegExp(escapedTerm, 'i');
  return data.filter(text => regex.test(text));
}

export function getDesignationValueIfAvailable(codeDisplay?: CodeDisplay): string | undefined {
  const germanDisplayValue: Array<Designation> = //@ts-ignore
    codeDisplay?.designations?.filter(d => GERMAN_LANGUAGE_SELECTORS.includes(d.language?.toLowerCase()));
  return germanDisplayValue?.length > 0 ? germanDisplayValue[0].value : codeDisplay?.display;
}

export function formatCodeDisplayToDisplay(cd: CodeDisplay): string {
  return getDesignationValueIfAvailable(cd);
}

export function findCodeDisplayByDisplayValue(codeDisplayList: CodeDisplay[], displayValue: string): CodeDisplay {
  return codeDisplayList.find(cd => cd.designations.find(d => d.value === displayValue)) || codeDisplayList.find(cd => cd.display === displayValue);
}

export function findCodeDisplayByCodeValue(codeDisplayList: CodeDisplay[], codeValue: string): CodeDisplay {
  return codeDisplayList.find(cd => cd.code === codeValue);
}

/**
 * Create a new function that attempts to match an unknown value to an instance
 * of the given Enum. If the function fails, an error is thrown. Otherwise the
 * matched instance is returned.
 */
function createEnumParser<Enum>(enumDefinition: Record<string, Enum>) {
  return function (val: unknown): Enum {
    if (typeof val === 'string') {
      const titleCase = `${val[0].toLocaleUpperCase()}${val.substring(1).toLocaleLowerCase()}`;
      const result = enumDefinition[titleCase];
      if (result !== undefined) {
        return result;
      }
    }

    throw new Error(`Unknown value '${val}'`);
  };
}

// 'None' is hardcoded and not in the enum because it's only needed for the frontend
export const ExtendedSalutationEnum = {
  ...PractitionerInfo.SalutationEnum,
  None: 'None' as ExtendedSalutationType,
};

export type ExtendedSalutationType = PractitionerInfo.SalutationEnum | 'None';

export const parseGender = createEnumParser<NotifiedPersonBasicInfo.GenderEnum>(NotifiedPersonBasicInfo.GenderEnum);
export const parseSalutation = createEnumParser<ExtendedSalutationType>(ExtendedSalutationEnum);
