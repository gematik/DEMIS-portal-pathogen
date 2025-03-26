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
import { contactsFormConfigFields } from './contacts.config';
import { CodeDisplay } from '../../../../../../api/notification';
import { FormlyConstants } from '../formly-constants';
import {
  copyAddress,
  formlyInputField,
  updateCurrentAddressAfterChangeWhenSubmittingFacilityIsEnabled,
  updateCurrentAddressInstitutionNameAfterChangeWhenSubmittingFacilityIsEnabled,
} from './commons';
import { bsnrFormlyFieldConfig, existsBsnrFormlyFieldConfig } from './bsnr.config';
import { addressFormConfigFields } from './address.config';
import { practitionerInfoFormConfigFields } from './practitioner-info.config';
import { oneTimeCodeConfigField } from './oneTimeCode.config';
import { PathogenFormInfos } from '../../../../utils/disclaimer-texts';
import { tap } from 'rxjs/operators';
import { isNewCheckboxForCopyAddressEnabled } from '../../../../utils/pathogen-notification-mapper';

export const notifierFacilityFormConfigFieldsFull = (countryCodeDisplays: CodeDisplay[], needsContact: boolean = true): FormlyFieldConfig[] => {
  return isNewCheckboxForCopyAddressEnabled()
    ? [
        {
          // recognizes any change in notifierFacility to make sure that the address is copied correctly
          hooks: {
            onInit: field => {
              const root = field.parent.parent.fieldGroup;
              return field.parent.parent.fieldGroup
                .find(field => field.key === 'notifierFacility')
                .options.fieldChanges.pipe(
                  tap(() => {
                    const submittingFacilityModel = field.parent.parent.model.submittingFacility;
                    if (submittingFacilityModel.copyAddressCheckBox) {
                      const notifierFacilityModel = field.parent.model;
                      const targetField = root.find(field => field.key === 'submittingFacility');
                      copyAddress(notifierFacilityModel, targetField);
                      targetField.fieldGroup.find(field => field.key === 'copyAddressCheckBox').formControl.enable();
                    }
                  })
                );
            },
          },
        },
        ...notifierFacilityFormConfigFields(countryCodeDisplays).concat(contactsFormConfigFields(needsContact)),
      ]
    : notifierFacilityFormConfigFields(countryCodeDisplays).concat(contactsFormConfigFields(needsContact));
};

export const notifierFacilityFormConfigFields = (countryCodeDisplays: CodeDisplay[]): FormlyFieldConfig[] => {
  return [
    {
      className: FormlyConstants.LAYOUT_HEADER,
      template: PathogenFormInfos.insertAllKnownInfosToFulfillReportingObligation + PathogenFormInfos.personalDataWillBeStoredInLocalStorage,
      key: 'notifierFacilityInfoWrapper',
    },
    {
      className: '',
      template: '<h2>Einrichtung</h2>',
    },
    {
      fieldGroupClassName: FormlyConstants.ROW,
      key: 'facilityInfo',
      fieldGroup: [
        formlyInputField({
          key: 'institutionName',
          className: FormlyConstants.COLMD11,
          props: {
            label: 'Name der Einrichtung',
            required: true,
            change: field => {
              updateCurrentAddressInstitutionNameAfterChangeWhenSubmittingFacilityIsEnabled(field);
            },
          },
          validators: ['nonBlankValidator', 'textValidator'],
        }),
        existsBsnrFormlyFieldConfig,
        bsnrFormlyFieldConfig,
      ],
    },
    {
      className: '',
      template: '<h2>Adresse</h2>',
    },
    {
      key: 'address',
      fieldGroupClassName: FormlyConstants.ROW,
      fieldGroup: addressFormConfigFields(countryCodeDisplays, true, false, '', true),
      hooks: {
        onInit: field => {
          return updateCurrentAddressAfterChangeWhenSubmittingFacilityIsEnabled(field, true);
        },
      },
    },
    {
      template: '<h2>Ansprechperson (Melder)</h2>',
    },
    ...practitionerInfoFormConfigFields(),
    oneTimeCodeConfigField,
    { template: '<h2>Kontaktmöglichkeiten</h2>' },
  ];
};
