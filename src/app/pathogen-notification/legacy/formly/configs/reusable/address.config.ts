/*
 Copyright (c) 2025 gematik GmbH
 Licensed under the EUPL, Version 1.2 or - as soon they will be approved by
 the European Commission - subsequent versions of the EUPL (the "Licence");
 You may not use this work except in compliance with the Licence.
    You may obtain a copy of the Licence at:
    https://joinup.ec.europa.eu/software/page/eupl
        Unless required by applicable law or agreed to in writing, software
 distributed under the Licence is distributed on an "AS IS" basis,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the Licence for the specific language governing permissions and
 limitations under the Licence.
 */

import { FormlyFieldConfig } from '@ngx-formly/core';
import { AddressType, CodeDisplay } from '../../../../../../api/notification';
import {
  GERMANY_COUNTRY_CODE,
  getDesignationValueIfAvailable,
  ZIP_GERMANY_MAX_LENGTH,
  ZIP_GERMANY_MIN_LENGTH,
  ZIP_INTERNATIONAL_MAX_LENGTH,
  ZIP_INTERNATIONAL_MIN_LENGTH,
} from '../../../common-utils';

import { FormlyConstants } from '../formly-constants';
import { formlyInputField, formlyRow } from './commons';
import { CURRENT_ADDRESS_ID } from './notified-person.config';

export const addressFormConfigFields = (
  countryCodeDisplays: CodeDisplay[],
  required: boolean,
  allowInternationalZip: boolean,
  idPrefix: string = '',
  countryDisabled: boolean = false
) => [
  {
    id: 'currentAddressInstitutionName',
    key: 'additionalInfo',
    className: FormlyConstants.COLMD11,
    type: 'input',
    props: {
      required: true,
    },
    expressions: {
      hide: (ffc: FormlyFieldConfig) =>
        idPrefix != CURRENT_ADDRESS_ID ||
        !getCurrentAddressType(ffc) ||
        getCurrentAddressType(ffc) === AddressType.PrimaryAsCurrent ||
        getCurrentAddressType(ffc) === AddressType.Current,
      'props.label': (ffc: FormlyFieldConfig) =>
        getCurrentAddressType(ffc) === AddressType.SubmittingFacility ? 'Name der Einrichtung' : 'Name der Einrichtung / Unterkunft',
      'props.disabled': (ffc: FormlyFieldConfig) => getCurrentAddressType(ffc) === AddressType.SubmittingFacility,
    },
    validators: {
      validation: ['nonBlankValidator', 'textValidator'],
    },
  },
  formlyInputField({
    id: `${idPrefix}street`,
    key: `street`,
    className: FormlyConstants.COLMD8,
    props: {
      label: 'Straße',
      required: required,
    },
    validators: ['streetValidator', 'nonBlankValidator'],
  }),
  formlyInputField({
    id: `${idPrefix}houseNumber`,
    key: 'houseNumber',
    className: FormlyConstants.COLMD3,
    props: {
      maxLength: 10,
      label: 'Hausnummer',
      required: required,
    },
    validators: ['houseNumberValidator'],
  }),
  formlyInputField({
    id: `${idPrefix}zip`,
    key: 'zip',
    className: FormlyConstants.COLMD3,
    props: {
      maxLength: allowInternationalZip ? ZIP_INTERNATIONAL_MAX_LENGTH : ZIP_GERMANY_MAX_LENGTH,
      minLength: allowInternationalZip ? ZIP_INTERNATIONAL_MIN_LENGTH : ZIP_GERMANY_MIN_LENGTH,
      label: 'Postleitzahl',
      required: true,
    },
    validators: [allowInternationalZip ? 'internationalZipValidator' : 'germanZipValidator'],
  }),
  formlyInputField({
    id: `${idPrefix}city`,
    key: 'city',
    className: FormlyConstants.COLMD8,
    props: {
      label: 'Stadt',
      required: required,
    },
  }),
  {
    id: `${idPrefix}country`,
    key: 'country',
    className: FormlyConstants.COLMD11,
    type: 'select',
    defaultValue: GERMANY_COUNTRY_CODE,
    props: {
      label: 'Land',
      required: true,
      disabled: countryDisabled,
      options: countryCodeDisplays.map(value => {
        return { value: value.code, label: getDesignationValueIfAvailable(value) };
      }),
    },
  },
];

export const addressFormPanelConfigFields = (countryCodeDisplays: CodeDisplay[], required: boolean, idPrefix: string, addressType: AddressType) =>
  [
    formlyRow([
      formlyInputField({
        id: `${idPrefix}street`,
        key: 'street',
        className: 'col-md-8',
        props: {
          label: 'Straße',
          required: required,
        },
        validators: ['streetValidator', 'nonBlankValidator'],
      }),
      formlyInputField({
        id: `${idPrefix}houseNumber`,
        key: 'houseNumber',
        className: FormlyConstants.COLMD3,
        props: {
          maxLength: 10,
          label: 'Hausnummer',
          required: required,
        },
        validators: ['houseNumberValidator'],
      }),
    ]),
    formlyRow([
      formlyInputField({
        id: `${idPrefix}zip`,
        key: 'zip',
        className: FormlyConstants.COLMD3,
        props: {
          minLength: ZIP_INTERNATIONAL_MIN_LENGTH,
          maxLength: ZIP_INTERNATIONAL_MAX_LENGTH,
          label: 'Postleitzahl',
          required: required,
        },
        validators: ['internationalZipValidator'],
      }),
      formlyInputField({
        id: `${idPrefix}city`,
        key: 'city',
        className: 'col-md-8',
        props: {
          label: 'Stadt',
          required: required,
        },
      }),
      {
        key: 'addressType',
        defaultValue: addressType,
      },
    ]),
    formlyRow(
      [
        {
          id: `${idPrefix}country`,
          key: 'country',
          className: 'col-md-11',
          type: 'select',
          defaultValue: GERMANY_COUNTRY_CODE,
          props: {
            label: 'Land',
            required: required,
            disabled: required,
            options: countryCodeDisplays.map(value => {
              return { value: value.code, label: getDesignationValueIfAvailable(value) };
            }),
          },
        },
      ],
      undefined,
      'row margin-right-exp-label-correction'
    ),
  ] as FormlyFieldConfig[];

export const getCurrentAddressType = (ffc: FormlyFieldConfig) => {
  return ffc.parent.parent.fieldGroup.find(f => f.key === 'currentAddressType')?.formControl?.value;
};
