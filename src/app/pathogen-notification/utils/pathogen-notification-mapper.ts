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

import { CodeDisplay, NotificationLaboratoryCategory, SpecimenDTO } from '../../../api/notification';
import { selectNotificationCategoryFields } from '../formly/configs/pathogen/select-notification-category.config';
import { formatCodeDisplayToDisplay, getDesignationValueIfAvailable } from '../legacy/common-utils';
import { environment } from '../../../environments/environment';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

export const isNewCheckboxForCopyAddressEnabled = () => environment.featureFlags?.FEATURE_FLAG_COPY_CHECKBOX_FOR_NOTIFIER_DATA;

export const initializeSelectPathogenFields = (federalStateCodeDisplays: CodeDisplay[], pathogenCodeDisplays: CodeDisplay[]) => {
  return selectNotificationCategoryFields(federalStateCodeDisplays, pathogenCodeDisplays.map(formatCodeDisplayToDisplay), []);
};

export const initializeDiagnosticFields = (selectedFederalStateCode: string, model: any) => {
  model.pathogenForm.notificationCategory = {
    federalStateCodeDisplay: selectedFederalStateCode,
    pathogenDisplay: '',
  };
  return model;
};

export const updatePathogenForm = (
  form: FormGroup,
  notifierFacilityFields: FormlyFieldConfig[],
  submitterFacilityFields: FormlyFieldConfig[],
  notifiedPersonFields: FormlyFieldConfig[],
  selectPathogenFields: FormlyFieldConfig[],
  diagnosticFormFields: FormlyFieldConfig[]
) => {
  removeTemporaryValidationWrapperField(form);
  return [
    {
      key: 'pathogenForm',
      type: 'demis-formly-tab-navigation',
      fieldGroup: [
        {
          key: 'notifierFacility',
          props: {
            title: 'Erregernachweis melden - Meldende Person',
            label: 'Meldende Person',
            anchor: 'notified-facility-form',
          },
          fieldGroup: notifierFacilityFields,
        },
        {
          key: 'submittingFacility',
          props: {
            title: 'Erregernachweis melden - Einsendende Person',
            label: 'Einsendende Person',
            anchor: 'submitting-facility-form',
          },
          fieldGroup: submitterFacilityFields,
        },
        {
          key: 'notifiedPerson',
          props: {
            title: 'Erregernachweis melden - Betroffene Person',
            label: 'Betroffene Person',
            anchor: 'notified-person-form',
          },
          fieldGroup: notifiedPersonFields,
        },
        {
          key: 'notificationCategory',
          props: {
            title: 'Erregernachweis melden - Meldetatbestand',
            label: 'Meldetatbestand',
            anchor: 'select-pathogen-form',
          },
          fieldGroup: selectPathogenFields,
        },
        {
          key: 'pathogenDTO',
          props: {
            title: 'Erregernachweis melden - Diagnostik',
            label: 'Diagnostik',
            anchor: 'diagnostic-form',
          },
          fieldGroup: diagnosticFormFields,
        },
      ],
    },
  ];
};

const removeTemporaryValidationWrapperField = (form: any) => {
  const pathogenDTOGroup = form.get('pathogenForm.pathogenDTO') as unknown as FormGroup;
  if (!!pathogenDTOGroup) {
    pathogenDTOGroup.removeControl('temporaryValidationWrapper');
  }
  return pathogenDTOGroup;
};

export const clearDiagnosticForClipboard = (selectedPathogenCodeDisplay: CodeDisplay, federalStateCode: string, model: any) => {
  model.pathogenForm.notificationCategory = {
    federalStateCodeDisplay: federalStateCode || 'DE-BW',
    pathogenDisplay: getDesignationValueIfAvailable(selectedPathogenCodeDisplay),
  };
  model.pathogenForm.pathogenDTO = {
    codeDisplay: selectedPathogenCodeDisplay,
    specimenList: emptySpecimenList,
  };
  return model;
};

const emptySpecimenList: Array<any> = [
  {
    specimenDTO: {
      extractionDate: undefined,
      receivedDate: undefined,
      material: undefined,
      methodPathogenList: [
        {
          method: undefined,
          analyt: undefined,
          result: undefined,
        },
      ],
      resistanceList: undefined,
      resistanceGeneList: undefined,
    },
  },
];

export function getResetModel(model: any) {
  const methodPathogenListLength = model?.pathogenForm?.pathogenDTO?.specimenList[0]?.methodPathogenList?.length || 0;
  const methodPathogenList =
    methodPathogenListLength === 0
      ? undefined
      : Array.from({ length: methodPathogenListLength }, () => ({
          method: undefined,
          analyt: undefined,
          result: undefined,
        }));

  const emptySpecimenList: Array<SpecimenDTO> = [
    {
      extractionDate: undefined,
      receivedDate: undefined,
      material: undefined,
      methodPathogenList: methodPathogenList,
      resistanceList: undefined,
      resistanceGeneList: undefined,
    },
  ];

  const emptyNotificationCategory: NotificationLaboratoryCategory = {
    pathogen: undefined,
    reportStatus: undefined,
    interpretation: undefined,
    initialNotificationId: undefined,
    laboratoryOrderId: undefined,
  };
  model.pathogenForm.pathogenDTO = { specimenList: emptySpecimenList };
  model.pathogenForm.notificationCategory = emptyNotificationCategory;
  return model;
}
