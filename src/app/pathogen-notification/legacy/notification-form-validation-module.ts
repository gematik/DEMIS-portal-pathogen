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

import { AbstractControl, ValidationErrors } from '@angular/forms';
import { FieldTypeConfig, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';

import { FieldType } from '@ngx-formly/material';
import { isArray } from 'lodash-es';
import { DateTime } from 'luxon';
import { map } from 'rxjs/operators';
import {
  ADDITIONAL_INFO_REG_EXP,
  BLANK_ERROR_MSG,
  BSNR_ERROR_MSG,
  BSNR_REG_EXP,
  DATE_FORMAT_DD_MM_YYYY_REG_EXP,
  DATE_FORMAT_ERROR_MSG,
  DATE_FORMAT_PARTIAL_EXP,
  DATE_IN_FUTURE_ERROR_MSG,
  DATE_NOT_EXIST,
  EMAIL_ERROR_MSG,
  EMAIL_REG_EXP,
  END_DATE_LATER_THAN_START_DATE_ERROR_MSG,
  HOUSE_NBR_ERROR_MSG,
  HOUSE_NBR_REG_EXP,
  MINIMUM_LENGTH_NOT_REACHED,
  NAME_REG_EXP,
  NUMBER_OF_BEDS,
  NUMBER_OF_BEDS_ERROR_MSG,
  PARTIAL_DATE_FORMAT_ERROR_MSG,
  PHONE_ERROR_MSG,
  PHONE_REG_EXP,
  REQUIRED_FIELD,
  STREET_REG_EXP,
  stringToDateFromLuxon,
  TEXT_ERROR_MSG,
  TEXT_REG_EXP,
  UI_LUXON_DATE_FORMAT,
  ZIP_GERMANY_ERROR_MSG,
  ZIP_GERMANY_REG_EXP,
  ZIP_GERMANY_SHORT_ERROR_MSG,
  ZIP_GERMANY_SHORT_REG_EXP,
  ZIP_INTERNATIONAL_ERROR_MSG,
  ZIP_INTERNATIONAL_REG_EXP,
} from './common-utils';

export const NotificationFormValidationModule = FormlyModule.forRoot({
  extras: { checkExpressionOn: 'modelChange' },
  validators: [
    { name: 'bsNrValidator', validation: bsNrValidation },
    { name: 'dateInputValidator', validation: dateInputValidation },
    {
      name: 'partialDateInputValidation',
      validation: partialDateInputValidation,
    },
    { name: 'germanZipValidator', validation: germanZipValidation },
    { name: 'germanShortZipValidator', validation: germanShortZipValidation },
    { name: 'houseNumberValidator', validation: houseNumberValidation },
    {
      name: 'internationalZipValidator',
      validation: internationalZipValidation,
    },
    { name: 'textValidator', validation: textValidation },
    { name: 'streetValidator', validation: streetValidation },
    {
      name: 'phoneValidator',
      validation: phoneValidation,
      options: { required: true },
    },
    {
      name: 'emailValidator',
      validation: emailValidation,
      options: { required: true },
    },

    { name: 'nameValidator', validation: nameValidation },
    {
      name: 'additionalInfoTextValidator',
      validation: additionalInfoTextValidation,
    },
    { name: 'numberOfBedsValidator', validation: numberOfBedsValidation },
    { name: 'nonBlankValidator', validation: nonBlankValidator },
    { name: 'optionMatches', validation: optionMatchesValidation },
  ],
  validationMessages: [
    { name: 'minLength', message: MINIMUM_LENGTH_NOT_REACHED },
    { name: 'required', message: REQUIRED_FIELD },
    { name: 'optionMismatch', message: 'Keine Übereinstimmung gefunden' },
    { name: 'optionIncomplete', message: 'Unvollständige Eingabe' },
  ],
});

//********** FUNKTIONEN **************

// Exportable:...

export function validateBSNR(bsNummer: string): any {
  return !!bsNummer ? (matchesRegExp(BSNR_REG_EXP, bsNummer) ? null : setValidationMessage(BSNR_ERROR_MSG)) : null;
}

function dateExist(date: string): boolean {
  return !!DateTime.fromFormat(date, UI_LUXON_DATE_FORMAT).toISODate();
}

export function validateDateInput(date: string): any {
  return !!date
    ? matchesRegExp(DATE_FORMAT_DD_MM_YYYY_REG_EXP, date) // check for the format: dd.mm.yyyy
      ? dateExist(date) // check for not-existing dates like: '31.06.2022'
        ? isEmptyOrInFutureDate(DateTime.fromFormat(date, UI_LUXON_DATE_FORMAT).toJSDate())
          ? setValidationMessage(DATE_IN_FUTURE_ERROR_MSG)
          : null
        : setValidationMessage(DATE_NOT_EXIST)
      : setValidationMessage(DATE_FORMAT_ERROR_MSG)
    : null;
}

export function validatePartialDateInput(date: string): any {
  if (matchesRegExp(DATE_FORMAT_DD_MM_YYYY_REG_EXP, date)) {
    // check for the format: dd.mm.yyyy
    return validateDateInput(date);
  } else {
    return !!date
      ? matchesRegExp(DATE_FORMAT_PARTIAL_EXP, date) // check for the format: yyyy, mm.yyyy, dd.mm.yyyy, m.yyyy, d.m.yyyy
        ? !partialDateNotInFuture(date)
          ? setValidationMessage(DATE_IN_FUTURE_ERROR_MSG)
          : null
        : setValidationMessage(PARTIAL_DATE_FORMAT_ERROR_MSG)
      : null;
  }
}

export function isEmptyOrInFutureDate(date: Date): boolean {
  // !date means that it is not a required field therefore it is also valid if it is not given.
  // but if given, then it should be valid
  return !date || isFutureDate(date);
}

export function isFutureDate(date: Date): boolean {
  let today = DateTime.local();
  let givenDate = DateTime.fromJSDate(date);
  return givenDate.startOf('day') > today.startOf('day');
}

export function startDateValidator(startDate: string, endDate: string, errorMsg?: string): any {
  const startDateNotValid: any = validateDateInput(startDate);
  return !startDateNotValid
    ? !!endDate && !validateDateInput(endDate)
      ? !isEndDateLaterThanStartDate(startDate, endDate)
        ? setValidationMessage(errorMsg ?? END_DATE_LATER_THAN_START_DATE_ERROR_MSG)
        : null
      : null
    : startDateNotValid;
}

export function endDateValidator(startDate: string, endDate: string, errorMsg?: string): any {
  const endDateNotValid: any = validateDateInput(endDate);
  return !endDateNotValid
    ? !!startDate && !validateDateInput(startDate)
      ? !isEndDateLaterThanStartDate(startDate, endDate)
        ? setValidationMessage(errorMsg ?? END_DATE_LATER_THAN_START_DATE_ERROR_MSG)
        : null
      : null
    : endDateNotValid;
}

export function isEndDateLaterThanStartDate(startDate: string, endDate: string): boolean {
  return stringToDateFromLuxon(startDate) <= stringToDateFromLuxon(endDate);
}

export function validateGermanZip(zip: string): any {
  return !!zip ? (matchesRegExp(ZIP_GERMANY_REG_EXP, zip) ? null : setValidationMessage(ZIP_GERMANY_ERROR_MSG)) : null;
}

export function validateGermanShortZip(zip: string): any {
  return zip ? (matchesRegExp(ZIP_GERMANY_SHORT_REG_EXP, zip) ? null : setValidationMessage(ZIP_GERMANY_SHORT_ERROR_MSG)) : null;
}

export function termValidation(term: string): any {
  // following signs not accepted: @ \ * ? $ | = ´ ' " [ ] { } < >
  return !!term ? (matchesRegExp(TEXT_REG_EXP, term) ? null : setValidationMessage(TEXT_ERROR_MSG)) : null;
}

export function validateStreet(term: string): any {
  // following signs not accepted: @ \ * ? $ | = " [ ] { } < >
  return !!term ? (matchesRegExp(STREET_REG_EXP, term) ? null : setValidationMessage(TEXT_ERROR_MSG)) : null;
}

export function validateName(term: string): any {
  // following signs not accepted: @ \ * ? $ | = ´ ' " [ ] { } < > 0-9
  if (!term) return null;
  return validateNotBlank(term) || (matchesRegExp(NAME_REG_EXP, term) ? null : setValidationMessage(TEXT_ERROR_MSG));
}

export function checkAdditionalInfoText(term: string): any {
  // following signs not accepted: \ = ´ ' < >
  return !!term ? (matchesRegExp(ADDITIONAL_INFO_REG_EXP, term) ? null : setValidationMessage(TEXT_ERROR_MSG)) : null;
}

export function validateHouseNumber(hausNumber: string): any {
  return !!hausNumber ? (matchesRegExp(HOUSE_NBR_REG_EXP, hausNumber) ? null : setValidationMessage(HOUSE_NBR_ERROR_MSG)) : null;
}

export function validateInternationalZip(zip: string): any {
  return !!zip ? (matchesRegExp(ZIP_INTERNATIONAL_REG_EXP, zip) ? null : setValidationMessage(ZIP_INTERNATIONAL_ERROR_MSG)) : null;
}

export function validatePhoneNo(phoneNumber: string, required: boolean = true): boolean {
  if (required || phoneNumber) {
    return validatePhoneNoRegex(phoneNumber);
  } else {
    return null;
  }
}

function validatePhoneNoRegex(phoneNumber: string): boolean {
  return matchesRegExp(PHONE_REG_EXP, isArray(phoneNumber) ? (phoneNumber[0].phoneNo as string) : phoneNumber) ? true : setValidationMessage(PHONE_ERROR_MSG);
}

export function validateNotBlank(s: string): any {
  if (!s) return null;
  return matchesRegExp(/\S/, s) ? null : setValidationMessage(BLANK_ERROR_MSG);
}

export function validateEmail(email: string, required: boolean = true): boolean {
  if (required || email) {
    return validateEmailRegex(email);
  } else {
    return null;
  }
}

function validateEmailRegex(email: string): boolean {
  return matchesRegExp(EMAIL_REG_EXP, isArray(email) ? email[0].email : email) ? true : setValidationMessage(EMAIL_ERROR_MSG);
}

export function checkNumberOfBeds(noOfBeds: string): any {
  return !!noOfBeds ? (matchesRegExp(NUMBER_OF_BEDS, noOfBeds) ? null : setValidationMessage(NUMBER_OF_BEDS_ERROR_MSG)) : null;
}

export function matchesRegExp(regExp: RegExp, value: string): boolean {
  return regExp.test(value);
}

export function setValidationMessage(valMessage: string): any {
  return { fieldMatch: { message: valMessage } };
}

// Private:...

function bsNrValidation(control: AbstractControl): any {
  return !!control?.parent?.value?.existsBsnr ? validateBSNR(control.value) : null;
}

function partialDateNotInFuture(date: string): boolean {
  const splitDate: Array<string> = date.split('.');
  const now: Date = new Date();

  switch (splitDate.length) {
    case 1:
      return +splitDate[0] <= now.getFullYear(); // length = 1 when date = yyyy
    case 2:
      return new Date(+splitDate[1], +splitDate[0] - 1) <= now; // -1 as month is monthIndex
    case 3:
      return new Date(+splitDate[2], +splitDate[1] - 1, +splitDate[0]) <= now;
    default:
      return false;
  }
}

/***
 * For the validation of dates of type: Input (String)
 *
 * @param control
 */
function dateInputValidation(control: AbstractControl): any {
  return validateDateInput(control.value);
}

function partialDateInputValidation(control: AbstractControl): any {
  return validatePartialDateInput(control.value);
}

function germanZipValidation(control: AbstractControl): any {
  return validateGermanZip(control.value);
}

function germanShortZipValidation(control: AbstractControl): any {
  return validateGermanShortZip(control.value);
}

function textValidation(control: AbstractControl): any {
  return termValidation(control.value);
}

function streetValidation(control: AbstractControl): any {
  return validateStreet(control.value);
}

function nameValidation(control: AbstractControl): any {
  return validateName(control.value);
}

function houseNumberValidation(control: AbstractControl): any {
  return validateHouseNumber(control.value);
}

function internationalZipValidation(control: AbstractControl): any {
  return validateInternationalZip(control.value);
}

function phoneValidation(control: AbstractControl, field: FormlyFieldConfig, options): any {
  return validatePhoneNo(control.value, options.required);
}

function emailValidation(control: AbstractControl, field: FormlyFieldConfig, options): any {
  return validateEmail(control.value, options.required);
}

function additionalInfoTextValidation(control: AbstractControl): any {
  return checkAdditionalInfoText(control.value);
}

function numberOfBedsValidation(control: AbstractControl): any {
  return checkNumberOfBeds(control.value);
}

function nonBlankValidator(control: AbstractControl): any {
  return validateNotBlank(control.value);
}

export async function optionMatchesValidation(control: AbstractControl, field: FieldType<FieldTypeConfig>): Promise<ValidationErrors> {
  return (
    field.props
      //@ts-ignore
      .filter(control.value)
      .pipe(
        map((options: any[]) => {
          if (!control.value) {
            return null;
          }
          if (options.length === 0) {
            return { optionMismatch: true };
          }
          if (options.indexOf(control.value) >= 0) {
            return null;
          }
          return { optionIncomplete: true };
        })
      )
      .toPromise()
  );
}
