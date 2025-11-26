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
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { FormlyFieldConfig } from '@ngx-formly/core';
import { TEXT_MAX_LENGTH, UI_DATE_FORMAT_GER } from '../../../common-utils';
import { GENDER_OPTION_LIST } from '../../../formly-options-lists';
import { PathogenFormInfos } from '../../../../utils/disclaimer-texts';
import { environment } from '../../../../../../environments/environment';
import { formlyInputField, formlyRow, FormlyConstants } from '@gematik/demis-portal-core-library';

const INFO_KEY = 'info';

export const getNotifiedPersonInfo = (): FormlyFieldConfig[] => [
  {
    className: FormlyConstants.LAYOUT_HEADER,
    template: PathogenFormInfos.insertAllKnownInfosToFulfillReportingObligation,
    key: 'notifiedPersonInfoWrapper',
  },
  {
    className: '',
    template: '<h2>Allgemein</h2>',
  },
  formlyRow(
    [
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
    ],
    INFO_KEY
  ),
  formlyRow(
    [
      formlyInputField({
        key: 'firstname',
        className: FormlyConstants.COLMD5,
        props: {
          label: 'Vorname',
          maxLength: TEXT_MAX_LENGTH,
          required: true,
        },
        validators: ['nameValidator'],
      }),
      formlyInputField({
        key: 'lastname',
        className: FormlyConstants.COLMD5,
        props: {
          label: 'Nachname',
          maxLength: TEXT_MAX_LENGTH,
          required: true,
        },
        validators: ['nameValidator'],
      }),
    ],
    INFO_KEY
  ),
  formlyRow(
    [
      {
        id: 'birthDate',
        key: 'birthDate',
        className: FormlyConstants.COLMD5,
        type: 'datepicker',
        wrappers: [],
        props: {
          label: 'Geburtsdatum',
          allowedPrecisions: ['day'],
          required: false,
          minDate: new Date('1870-01-01'),
          maxDate: new Date(),
          multiYear: true,
        },
      },
    ],
    INFO_KEY
  ),
];
