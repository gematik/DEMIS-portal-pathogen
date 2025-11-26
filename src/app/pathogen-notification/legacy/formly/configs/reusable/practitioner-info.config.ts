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
import { ExtendedSalutationEnum } from '../../../common-utils';
import { formlyInputField, formlyRow, FormlyConstants } from '@gematik/demis-portal-core-library';

export const practitionerInfoFormConfigFields: () => FormlyFieldConfig[] = () => [
  formlyRow(
    [
      {
        id: 'salutation',
        type: 'select',
        key: 'salutation',
        className: FormlyConstants.COLMD5,
        props: {
          label: 'Anrede',
          options: [
            { value: ExtendedSalutationEnum.Mrs, label: 'Frau' },
            { value: ExtendedSalutationEnum.Mr, label: 'Herr' },
            // 'None' is hardcoded and not in the enum because it's only needed for the frontend
            { value: ExtendedSalutationEnum.None, label: 'Keine Anrede' },
          ],
        },
      },
      formlyInputField({
        key: 'prefix',
        className: FormlyConstants.COLMD5,
        props: {
          label: 'Titel',
        },
      }),
      formlyInputField({
        key: 'firstname',
        className: FormlyConstants.COLMD5,
        props: {
          label: 'Vorname',
          required: true,
        },
        validators: ['nameValidator'],
      }),
      formlyInputField({
        key: 'lastname',
        className: FormlyConstants.COLMD5,
        props: {
          label: 'Nachname',
          required: true,
        },

        validators: ['nameValidator'],
      }),
    ],
    'contact'
  ),
];
