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
import { TEXT_MAX_LENGTH, UI_DATE_FORMAT_GER } from '../../../common-utils';
import { GENDER_OPTION_LIST } from '../../../formly-options-lists';
import { FormlyConstants } from '../formly-constants';
import { formlyInputField, formlyRow } from './commons';
import { PathogenFormInfos } from '../../../../utils/disclaimer-texts';

const INFO_KEY = 'info';

export const notifiedPersonInfo: FormlyFieldConfig[] = [
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
      formlyInputField({
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
    INFO_KEY
  ),
];
