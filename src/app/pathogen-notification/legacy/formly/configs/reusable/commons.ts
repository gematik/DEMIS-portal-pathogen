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
import { tap } from 'rxjs/operators';
import { AddressType } from '../../../../../../api/notification';

const condition = (field: FormlyFieldConfig, isNotifier: boolean) => {
  if (isNotifier) {
    return (
      field.parent.parent.model.submittingFacility.copyAddressCheckBox &&
      field.parent.parent.model.notifiedPerson.currentAddressType === AddressType.SubmittingFacility
    );
  } else {
    return field.parent.parent.model.notifiedPerson.currentAddressType === AddressType.SubmittingFacility;
  }
};

export function updateCurrentAddressAfterChangeWhenSubmittingFacilityIsEnabled(field: FormlyFieldConfig, isNotifier: boolean) {
  return field.options.fieldChanges.pipe(
    tap(() => {
      if (!!field.parent.parent.model.notifiedPerson?.currentAddressType && condition(field, isNotifier)) {
        const sourceModel = { ...field.model, additionalInfo: field.parent.model.facilityInfo?.institutionName }; // address object
        const targetField = getCurrentAddress(field.parent.parent.fieldGroup);
        targetField?.formControl?.patchValue(sourceModel);
      }
    })
  );
}

export function updateCurrentAddressInstitutionNameAfterChangeWhenSubmittingFacilityIsEnabled(field: FormlyFieldConfig) {
  const root = field.parent.parent.parent.parent;
  if (root.model.notifiedPerson?.currentAddressType === AddressType.SubmittingFacility) {
    const sourceModel = field.model.institutionName;
    const targetField = getCurrentAddress(root.fieldGroup).fieldGroup.find(field => field.id === 'currentAddressInstitutionName');
    targetField.formControl.patchValue(sourceModel);
  }
}

export function notifierFacilitySourceIsInvalid(sourceFacility: any, field: FormlyFieldConfig): boolean {
  return (
    !allPropsDefined(sourceFacility.address) ||
    !sourceFacility.facilityInfo.institutionName ||
    !sourceFacility.contact.firstname ||
    !sourceFacility.contact.lastname ||
    sourceFacility.contacts.phoneNumbers.some(phoneNumber => !phoneNumber.value) ||
    sourceFacility.contacts.emailAddresses.some(emailAddress => !emailAddress.value) ||
    field.parent.parent.fieldGroup.find(field => field.key === 'notifierFacility').formControl.invalid
  );
}

function allPropsDefined<T extends object>(obj: T): obj is { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.values(obj).every(v => v !== undefined && v !== '');
}

export function getCurrentAddress(fieldGroup: FormlyFieldConfig[]) {
  return fieldGroup.find(field => field.key === 'notifiedPerson').fieldGroup[6].fieldGroup.find(field => field.key === 'currentAddress');
}

export function copyAddress(sourceFacility: any, target: FormlyFieldConfig) {
  target.fieldGroup
    .find(field => field.key === 'contacts')
    .fieldGroup.find(field => field.key === 'phoneNumbers')
    .props.setFieldCount(sourceFacility.contacts.phoneNumbers.length);
  target.fieldGroup
    .find(field => field.key === 'contacts')
    .fieldGroup.find(field => field.key === 'emailAddresses')
    .props.setFieldCount(sourceFacility.contacts.emailAddresses.length);
  target.formControl.patchValue(sourceFacility);
  target.formControl.disable();
  const departmentName = target.fieldGroup.find(field => field.key === 'facilityInfo').fieldGroup[1].fieldGroup[0];
  departmentName.formControl.enable();
  departmentName.focus = true;
}
