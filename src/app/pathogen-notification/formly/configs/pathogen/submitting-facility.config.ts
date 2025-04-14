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
import { FormlyConstants } from '../../../legacy/formly/configs/formly-constants';
import { addressFormConfigFields } from '../../../legacy/formly/configs/reusable/address.config';
import { AddressType, CodeDisplay } from '../../../../../api/notification';
import {
  copyAddress,
  formlyInputField,
  formlyRow,
  notifierFacilitySourceIsInvalid,
  updateCurrentAddressAfterChangeWhenSubmittingFacilityIsEnabled,
  updateCurrentAddressInstitutionNameAfterChangeWhenSubmittingFacilityIsEnabled,
} from '../../../legacy/formly/configs/reusable/commons';
import { TEXT_MAX_LENGTH } from '../../../legacy/common-utils';
import { practitionerInfoFormConfigFields } from '../../../legacy/formly/configs/reusable/practitioner-info.config';
import { contactsFormConfigFields } from '../../../legacy/formly/configs/reusable/contacts.config';
import { ErrorDialogService } from '../../../services/error-dialog.service';
import { isNewCheckboxForCopyAddressEnabled } from '../../../utils/pathogen-notification-mapper';

export const submittingFacilityFields = (countryCodeDisplays: CodeDisplay[], dialogService: ErrorDialogService): FormlyFieldConfig[] => {
  return [
    {
      className: '',
      template: '<h2>Einrichtung</h2>',
    },
    {
      key: 'copyAddressCheckBox',
      id: 'copyAddressCheckBox',
      type: 'checkbox',
      defaultValue: false,
      props: {
        indeterminate: false,
        label: 'Einrichtung und Ansprechperson aus Formularbereich "Meldende Person" übernehmen',
        required: false,
        change: field => {
          const root = field.parent.parent;
          const notifierFacilitySource = root.model.notifierFacility;
          if (field.model.copyAddressCheckBox) {
            if (notifierFacilitySourceIsInvalid(notifierFacilitySource, field)) {
              field.formControl.setValue(false);
              dialogService.openErrorDialogAndClose('Fehler bei der Auswahl', 'Bitte geben Sie die Daten für die Meldende Person zunächst vollständig an.');
            } else {
              copyAddress(notifierFacilitySource, field.parent);
              field.parent.fieldGroup.find(field => field.key === 'facilityInfo').fieldGroup[1].fieldGroup[0].formControl.enable();
              field.formControl.enable();
            }
          } else {
            resetAllFields(field, root);
          }
        },
      },
      expressions: {
        hide: () => !isNewCheckboxForCopyAddressEnabled(),
      },
    },
    {
      id: 'facilityInfo',
      key: 'facilityInfo',
      fieldGroup: [
        formlyRow([
          formlyInputField({
            key: 'institutionName',
            className: FormlyConstants.COLMD11,
            props: {
              label: 'Name der Einrichtung',
              maxLength: TEXT_MAX_LENGTH,
              required: true,
              change: field => {
                updateCurrentAddressInstitutionNameAfterChangeWhenSubmittingFacilityIsEnabled(field);
              },
            },
          }),
        ]),
        formlyRow([
          formlyInputField({
            key: 'departmentName',
            className: FormlyConstants.COLMD11,
            props: {
              label: 'Stationsname (bei Krankenhäusern)',
              maxLength: TEXT_MAX_LENGTH,
              required: false,
            },
          }),
        ]),
      ],
    },
    {
      className: '',
      template: '<h2>Adresse</h2>',
    },
    {
      key: 'address',
      fieldGroupClassName: FormlyConstants.ROW,
      fieldGroup: addressFormConfigFields(countryCodeDisplays, true, true),
      // recognizes any change in submitting Facility address  to make sure that the address is copied correctly
      hooks: {
        onInit: field => {
          return updateCurrentAddressAfterChangeWhenSubmittingFacilityIsEnabled(field, false);
        },
      },
    },
    {
      className: '',
      template: '<h2>Ansprechperson (Einsender) </h2>',
    },
    ...practitionerInfoFormConfigFields(),
    { template: '<h2>Kontaktmöglichkeiten</h2>' },
    ...contactsFormConfigFields(true),
  ];
};

function getCurrentAddressType(fieldGroup: FormlyFieldConfig[]) {
  return fieldGroup.find(field => field.key === 'notifiedPerson').fieldGroup[6].fieldGroup.find(field => field.key === 'currentAddressType');
}

function resetAllFields(field: FormlyFieldConfig, root: FormlyFieldConfig) {
  const submittingFacility = field.parent;
  const submittingFacilityFieldGroups = submittingFacility.fieldGroup;
  const phoneNumbersFieldProps = submittingFacilityFieldGroups
    .find(field => field.key === 'contacts')
    .fieldGroup.find(field => field.key === 'phoneNumbers').props;
  const emailAddressesFieldProps = submittingFacilityFieldGroups
    .find(field => field.key === 'contacts')
    .fieldGroup.find(field => field.key === 'emailAddresses').props;
  // DEMIS-2674: Manual field reset because standard reset() fails after clipboard/hexhex input
  submittingFacilityFieldGroups.find(field => field.key === 'facilityInfo').fieldGroup[0].fieldGroup[0].formControl.reset(null);
  const submittingFacilityAddressField = submittingFacilityFieldGroups.find(field => field.key === 'address');
  submittingFacilityAddressField.formControl.reset(null);
  submittingFacilityAddressField.fieldGroup.find(field => field.key === 'country').formControl.setValue('DE');

  submittingFacilityFieldGroups.find(field => field.key === 'contact').formControl.reset(null);

  emailAddressesFieldProps.setFieldCount(1, true);
  phoneNumbersFieldProps.setFieldCount(1, true);

  field.parent.formControl.enable();
  if (root.model.notifiedPerson.currentAddressType === AddressType.SubmittingFacility) {
    getCurrentAddressType(root.fieldGroup).formControl.reset();
  }
}
