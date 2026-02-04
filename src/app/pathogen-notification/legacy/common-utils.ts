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

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { format, isValid, parse } from 'date-fns';
import { DateTime } from 'luxon';

import { CodeDisplay, Designation, Gender, PractitionerInfo } from '../../../api/notification';
import { selectOption } from '@gematik/demis-portal-core-library/lib/formly/commons';
// CONST:..................................

/*** id: de-DE ***/
export const LOCALE_ID_DE = 'de-DE';
registerLocaleData(localeDe, LOCALE_ID_DE, localeDeExtra);

/*** format: yyyy-MM-dd ***/
export const DATE_FORMAT = 'yyyy-MM-dd';

/*** format: dd.MM.yyyy ***/
export const UI_DATE_FORMAT_GER = 'TT.MM.JJJJ';
/*** format: dd.LL.yyyy ***/
export const UI_LUXON_DATE_FORMAT = 'dd.LL.yyyy';
/*** code: DE ***/
export const GERMANY_COUNTRY_CODE = 'DE';
/*** code: 21481 ***/
export const ZIP_CODE_DEFAULT = '21481';

export const ZIP_GERMANY_MIN_LENGTH = 4;
export const ZIP_GERMANY_MAX_LENGTH = 5;
export const ZIP_INTERNATIONAL_MIN_LENGTH = 3;
export const ZIP_INTERNATIONAL_MAX_LENGTH = 50;
export const TEXT_MAX_LENGTH = 100;
export const MORE_INFO_MAX_LENGTH = 5000;
export const PHONE_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 5000;

// VALIDATIONS: More about this Reg-exp rules: https://wiki.gematik.de/pages/viewpage.action?pageId=459871766 ..........

export const BSNR_REG_EXP = /^\d{9}$/; // 9-stellige Nummer
export const DATE_FORMAT_PARTIAL_EXP = /^(((0?[1-9]|[1-2]\d|3[0-1])\.)?(0?[1-9]|1[0-2])\.)?(\d(\d(\d[1-9]|[1-9]0)|[1-9]00)|[1-9]000)$/; //yyyy, mm.yyyy, dd.mm.yyyy, m.yyyy, d.m.yyyy
export const DATE_FORMAT_DD_MM_YYYY_REG_EXP = /^(0[1-9]|[12]\d|3[01])[.](0[1-9]|1[012])[.]([1-9])\d{3}$/; // for the format: dd.mm.yyyy
export const EMAIL_REG_EXP = /^[A-Z0-9+_.-]+@[A-Z0-9.-]{5,320}$/i;
export const HOUSE_NBR_REG_EXP = /^\d[/ \-+0-9a-zA-Z]{0,50}$/; // No special characters allowed
export const PHONE_REG_EXP = /^[0+][0-9 \-()]{6,50}$/; // Starts with 0 or +, followed by 7-15 digits
export const TEXT_REG_EXP = /^[^@\\*?$|=´'"[\]{}<>]{0,100}$/; // No dangerous signs allowed
export const STREET_REG_EXP = /^[^@\\*?$|=´"[\]{}<>]{0,100}$/;
export const ADDITIONAL_INFO_REG_EXP = /^[^\\=´'<>]{0,5000}$/; // No dangerous signs allowed
export const ZIP_GERMANY_REG_EXP = /^\d{5}$/; // 5 Ziffern allowed
export const ZIP_GERMANY_SHORT_REG_EXP = /^\d{3}$/; // 3-stellige Nummer
export const ZIP_INTERNATIONAL_REG_EXP = /(?=^[\w\- ]{3,50}$)(?=.*\d)/;
export const NAME_REG_EXP = /^[^@\\*?$|=´'"[\]{}<>0-9]{0,100}$/; // from https://wiki.gematik.de/x/JRlpGw
export const NUMBER_OF_BEDS = /^\d{0,6}$/;

export const REQUIRED_FIELD = 'Pflichtfeld';
export const MINIMUM_LENGTH_NOT_REACHED = 'Minimallänge nicht erreicht';
export const BSNR_ERROR_MSG = 'Bitte geben Sie Ihre 9-stellige Betriebsstättennummer (BSNR) ein';
export const DATE_FORMAT_ERROR_MSG = 'Kein gültiges Datum (Beispiele: 05.11.1998)';
export const DATE_NOT_EXIST = 'Das Datum existiert nicht!';
export const PARTIAL_DATE_FORMAT_ERROR_MSG = 'Kein gültiges Datum (Beispiele: 2022, 08.1978, 05.11.1998)';
export const DATE_IN_FUTURE_ERROR_MSG = 'Das Datum darf nicht in der Zukunft liegen';
export const EMAIL_ERROR_MSG = 'Keine gültige E-Mail (Beispiel: meine.Email@email.de)';
export const BLANK_ERROR_MSG = 'Es muss mindestens ein Zeichen eingegeben werden';
export const HOUSE_NBR_ERROR_MSG = 'Keine gültige Hausnummer';
export const END_DATE_LATER_THAN_START_DATE_ERROR_MSG = 'Das Startdatum darf nicht nach dem Enddatum liegen';
export const PHONE_ERROR_MSG = 'Die Telefonnummer muss mit 0 oder + beginnen, gefolgt von mindestens 6 Ziffern.';
export const TEXT_ERROR_MSG = 'Ihre Eingabe enthält unzulässige Sonderzeichen';
export const ZIP_GERMANY_ERROR_MSG = 'Die Postleitzahl muss aus 5 Ziffern bestehen';
export const ZIP_GERMANY_SHORT_ERROR_MSG = 'Die Postleitzahl muss aus 3 Ziffern bestehen';
export const ZIP_INTERNATIONAL_ERROR_MSG = 'Die Postleitzahl muss aus mindestens 3 Zeichen und einer Ziffer bestehen';
export const NUMBER_OF_BEDS_ERROR_MSG = 'Bitte geben Sie eine positive Zahl ein.';
export const VALUE_DEFAULT_PLACEHOLDER = 'Bitte eingeben';
export const VALUE_DEFUALT_SELECT_PLACEHOLDER = 'Bitte auswählen';

export const GERMAN_LANGUAGE_SELECTORS = ['de', 'de-de', 'de-at', 'de-ch'];

// FUNCTIONS:...............................

/***
 * returns current date as Date
 *
 * @param stringFormat
 */
export function newDate(stringFormat?: string): string {
  return format(new Date(), stringFormat ? stringFormat : DATE_FORMAT);
}

/***
 * to convert string to Luxon date
 *
 * @param date
 * @param format
 */
export function stringToDateFromLuxon(date: string, format?: string): Date {
  format = format ?? UI_LUXON_DATE_FORMAT;
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

const escapeRegExp = (string: string) => {
  //we have options with () and []
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function filterDisplayValues(term: string, data: string[]): string[] {
  const escapedTerm = escapeRegExp(term);
  const regex = new RegExp(escapedTerm, 'i');
  return data.filter(text => regex.test(text));
}

export function mapCodeDisplaysToOptionList(codeDisplays: CodeDisplay[]): selectOption[] {
  return codeDisplays.map(value => {
    return { value: value.code, label: getDesignationValueIfAvailable(value) };
  });
}

export function getDesignationValueIfAvailable(codeDisplay?: CodeDisplay): string | undefined {
  const germanDisplayValue: Designation[] = codeDisplay?.designations?.filter(d => GERMAN_LANGUAGE_SELECTORS.includes(d.language?.toLowerCase()));
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

// 'None' is hardcoded and not in the enum because it's only needed for the frontend
export const ExtendedSalutationEnum = {
  ...PractitionerInfo.SalutationEnum,
  None: 'None' as ExtendedSalutationType,
};

export type ExtendedSalutationType = PractitionerInfo.SalutationEnum | 'None';

export const parseGender = (value: string) => getEnumKeyByValue(Gender, value);
export const parseSalutation = (value: string) => getEnumKeyByValue(ExtendedSalutationEnum, value);

// temporary handling for @deprecated gender value OTHER. Stays for now for backwards compatibility
function handleDeprecatedOther(upperValue: string) {
  if (upperValue === 'OTHER') {
    upperValue = Gender.Diverse;
  }
  return upperValue;
}

/**
 * Generic function to get the key of an enum by its value (case-insensitive, value will be uppercased).
 * Throws an error if the value is not found.
 */
export function getEnumKeyByValue<T extends Record<string, string>>(enumObj: T, value: string): string {
  value = handleDeprecatedOther(value);
  const key = Object.keys(enumObj).find(key => enumObj[key as keyof typeof enumObj] === value);
  const result = enumObj[key];
  if (result !== undefined) {
    return result;
  }
  throw new Error(`Unknown value '${value}'`);
}
