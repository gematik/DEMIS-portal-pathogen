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

import { FormlyFieldConfig } from '@ngx-formly/core';
import { ContactPointInfo } from '../../../../../../api/notification';
import { EMAIL_MAX_LENGTH, PHONE_MAX_LENGTH } from '../../../common-utils';
import { FormlyConstants } from '../formly-constants';
import ContactTypeEnum = ContactPointInfo.ContactTypeEnum;
import UsageEnum = ContactPointInfo.UsageEnum;

export const contactsFormConfigFields: (needsContact: boolean, hospitalizationPerson?: boolean) => FormlyFieldConfig[] = (
  needsContact,
  hospitalizationPerson = false
) => [
  {
    className: FormlyConstants.LAYOUT_HEADER,
    template: '<h2>Kontaktmöglichkeiten</h2>',
    expressions: { hide: () => !hospitalizationPerson },
  },
  {
    className: FormlyConstants.LAYOUT_HEADER,
    template: `<p>Bitte geben Sie mindestens eine Kontaktmöglichkeit an.</p>`,
    expressions: { hide: () => !needsContact },
  },
  {
    key: 'contacts',
    fieldGroup: [
      {
        key: 'phoneNumbers',
        id: 'phoneNumbers',
        type: 'repeat',
        wrappers: ['validation'],
        props: {
          addText: 'Telefonnummer hinzufügen',
          keepLastItem: needsContact,
          isContact: true,
          id: 'phoneNumbers',
        },
        defaultValue: needsContact ? [{}] : undefined,
        fieldArray: {
          fieldGroupClassName: 'd-flex flex-column',
          fieldGroup: [
            {
              key: 'contactType',
              defaultValue: ContactTypeEnum.Phone,
            },
            {
              key: 'usage',
              defaultValue: needsContact ? UsageEnum.Work : undefined,
            },
            {
              className: 'flex-grow-1',
              type: 'input',
              id: 'phoneNo', // keep for Tests
              key: 'value',
              defaultValue: '',
              props: {
                label: 'Telefonnummer',
                maxLength: PHONE_MAX_LENGTH,
                required: true,
                attributes: { 'data-cy': 'phoneNo' },
                id: 'phoneNo',
              },
              validators: {
                validation: ['phoneValidator'],
              },
            },
          ],
        },
      },
      {
        id: 'emailAddresses',
        key: 'emailAddresses',
        type: 'repeat',
        wrappers: ['validation'],
        props: {
          addText: 'Email-Adresse hinzufügen',
          keepLastItem: needsContact,
          isContact: true,
          id: 'emailAddresses',
        },
        defaultValue: needsContact ? [{}] : undefined,
        fieldArray: {
          fieldGroupClassName: 'd-flex flex-column',
          fieldGroup: [
            {
              key: 'contactType',
              defaultValue: ContactTypeEnum.Email,
            },
            {
              className: 'flex-grow-1',
              type: 'input',
              id: 'email', // keep for Tests
              key: 'value',
              defaultValue: '',
              props: {
                label: 'Email-Adresse',
                required: true,
                maxLength: EMAIL_MAX_LENGTH,
                attributes: { 'data-cy': 'email' },
              },
              validators: {
                validation: ['emailValidator'],
              },
            },
          ],
        },
      },
    ],
  },
];
