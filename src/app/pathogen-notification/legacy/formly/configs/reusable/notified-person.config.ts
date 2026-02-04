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

import { FormlyFieldConfig } from '@ngx-formly/core';
import { AddressType, CodeDisplay } from '../../../../../../api/notification';
import { FormlyConstants, formlyRow } from '@gematik/demis-portal-core-library';
import { addressFormConfigFields } from './address.config';
import { contactsFormConfigFields } from './contacts.config';
import { CURRENT_ADDRESS_TYPE_OPTION_LIST, RESIDENCE_ADDRESS_TYPE_OPTION_LIST } from '../../../formly-options-lists';
import { getNotifiedPersonInfo } from './notified-person-info.config';

export const RESIDENCE_ADDRESS_ID = 'residence-address-';
export const CURRENT_ADDRESS_ID = 'current-address-';

export const notifiedPersonFormConfigFields = (countryCodeDisplays: CodeDisplay[]): FormlyFieldConfig[] => {
  return [
    ...getNotifiedPersonInfo(),
    formlyRow([
      {
        className: '',
        template: '<h2>Wohnsitz</h2>',
      },
      {
        className: FormlyConstants.COLMD11,
        template:
          '<p>Die Hauptwohnung bezeichnet den Ort, an dem die betroffene Person gemeldet ist. Der gewöhnliche Aufenthaltsort bezeichnet den Ort, ' +
          'an dem die betroffene Person sich dauerhaft aufhält und ist anzugeben, wenn es sich nicht um die Hauptwohnung handelt.</p>',
      },
      {
        id: 'residenceAddressType',
        key: 'residenceAddressType',
        className: FormlyConstants.COLMD8,
        type: 'radio',
        defaultValue: AddressType.Primary,
        props: {
          required: true,
          options: RESIDENCE_ADDRESS_TYPE_OPTION_LIST,
        },
      },
      {
        key: 'residenceAddress',
        id: 'residenceAddress',
        fieldGroupClassName: FormlyConstants.ROW,
        fieldGroup: addressFormConfigFields(countryCodeDisplays, false, true, RESIDENCE_ADDRESS_ID),
      },
    ]),
    formlyRow([
      {
        className: '',
        template: '<h2>Derzeitiger Aufenthaltsort *</h2>',
      },
      {
        className: FormlyConstants.COLMD11,
        template:
          '<p>Der derzeitige Aufenthaltsort bezeichnet den Ort, an dem sich die betroffene Person zum Zeitpunkt der Meldung aktuell aufhält. ' +
          'Angaben zum derzeitigen Aufenthaltsort sind immer notwendig, wenn sich diese von Angaben zum gewöhnlichen Aufenthaltsort bzw. zur Hauptwohnung der betroffenen Person unterscheiden, ' +
          'z.B. bei einem stationären Aufenthalt im Krankenhaus (ambulante Krankenhausaufenthalte und Arztpraxen fallen nicht darunter). ' +
          'Handelt es sich beim derzeitigen Aufenthaltsort um die Einsender-Einrichtung, kann diese hier übernommen werden.</p>',
      },
      {
        id: 'currentAddressType',
        key: 'currentAddressType',
        className: FormlyConstants.COLMD11,
        type: 'radio',
        props: {
          required: true,
          options: CURRENT_ADDRESS_TYPE_OPTION_LIST,
        },
      },
      {
        key: 'currentAddress',
        fieldGroupClassName: FormlyConstants.ROW,
        fieldGroup: addressFormConfigFields(countryCodeDisplays, false, true, CURRENT_ADDRESS_ID, false),
        expressions: {
          hide: (ffc: FormlyFieldConfig) => !ffc.form?.value?.currentAddressType || ffc.form?.value?.currentAddressType === AddressType.PrimaryAsCurrent,
          'props.disabled': (ffc: FormlyFieldConfig) => ffc.form?.value?.currentAddressType === AddressType.SubmittingFacility,
        },
      },
    ]),
    {
      className: '',
      template: '<h2>Kontaktmöglichkeiten der betroffenen Person</h2>',
    },
    ...contactsFormConfigFields(false),
  ];
};
