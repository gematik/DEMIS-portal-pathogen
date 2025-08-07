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

import { CodeDisplay } from '../../../../../api/notification';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyConstants } from '../../../legacy/formly/configs/formly-constants';
import { PathogenFormInfos } from '../../../utils/disclaimer-texts';
import { formlyInputField, formlyRow } from '../../../legacy/formly/configs/reusable/commons';
import { GENDER_OPTION_LIST } from '../../../legacy/formly-options-lists';
import { environment } from '../../../../../environments/environment';
import { GERMANY_COUNTRY_CODE, getDesignationValueIfAvailable, UI_DATE_FORMAT_GER } from '../../../legacy/common-utils';

export const notifiedPersonAnonymousConfigFields = (countryCodeDisplays: CodeDisplay[]): FormlyFieldConfig[] => {
  return [
    formlyRow(
      [
        {
          className: FormlyConstants.COLMD10,
          template: PathogenFormInfos.insertAllKnownInfosToFulfillReportingObligation,
          key: 'notifiedPersonInfoWrapper',
        },
        {
          className: '',
          template: '<h2>Allgemein</h2>',
        },
        {
          id: 'gender',
          key: 'gender',
          type: 'select',
          className: FormlyConstants.COLMD5,
          props: {
            label: 'Geschlecht',
            options: GENDER_OPTION_LIST,
            required: true,
          },
        },
        environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER
          ? {
              id: 'birthDate',
              key: 'birthDate',
              className: FormlyConstants.COLMD5,
              type: 'datepicker',
              wrappers: [],
              props: {
                label: 'Geburtsdatum',
                allowedPrecisions: ['month', 'year'],
                required: false,
                minDate: new Date('1870-01-01'),
                maxDate: new Date(),
                multiYear: true,
              },
            }
          : formlyInputField({
              key: 'birthDate',
              className: FormlyConstants.COLMD5,
              props: {
                placeholder: UI_DATE_FORMAT_GER,
                maxLength: 10,
                label: 'Geburtsdatum',
                required: false,
              },
              validators: ['dateInputValidator'],
            }),
      ],
      'info'
    ),
    formlyRow(
      [
        {
          className: '',
          template: '<h2>Wohnsitz</h2>',
        },
        {
          id: 'residence-address-country',
          key: 'country',
          className: FormlyConstants.COLMD10,
          type: 'select',
          defaultValue: GERMANY_COUNTRY_CODE,
          props: {
            label: 'Land',
            options: countryCodeDisplays.map(value => {
              return { value: value.code, label: getDesignationValueIfAvailable(value) };
            }),
          },
        },

        {
          className: '',
          template: '<h3>Erste drei Ziffern der Postleitzahl (Deutschland) der untersuchten Person</h3>',
        },
        formlyInputField({
          id: 'residence-address-zip',
          key: 'zip',
          className: FormlyConstants.COLMD10,
          props: {
            maxLength: 3,
            label: 'Postleitzahl',
          },
          validators: ['germanShortZipValidator'],
        }),
      ],
      'residenceAddress'
    ),
  ];
};
