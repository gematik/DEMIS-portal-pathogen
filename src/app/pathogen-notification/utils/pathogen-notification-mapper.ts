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

import { CodeDisplay, NotificationLaboratoryCategory, SpecimenDTO } from '../../../api/notification';
import { selectNotificationCategoryFields } from '../formly/configs/pathogen/select-notification-category.config';
import { formatCodeDisplayToDisplay, getDesignationValueIfAvailable, mapCodeDisplaysToOptionList } from '../legacy/common-utils';
import { environment } from '../../../environments/environment';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { NotificationType } from '../common/routing-helper';
import { notifiedPersonAnonymousConfigFields, notifiedPersonNotByNameConfigFields } from '@gematik/demis-portal-core-library';
import { GENDER_OPTION_LIST } from '../legacy/formly-options-lists';
import { NotifiedPersonDisclaimer } from './disclaimer-texts';
import { notifiedPersonFormConfigFields } from '../legacy/formly/configs/reusable/notified-person.config';

export function initializeNotifiedPersonFields(notificationType: NotificationType, countryCodeDisplays: CodeDisplay[]): FormlyFieldConfig[] {
  switch (notificationType) {
    case NotificationType.FollowUpNotification7_1:
      return notifiedPersonAnonymousConfigFields(
        mapCodeDisplaysToOptionList(countryCodeDisplays),
        GENDER_OPTION_LIST,
        NotifiedPersonDisclaimer.FOLLOW_UP_DISCLAIMER
      );
    case NotificationType.FollowUpNotification7_3:
      return notifiedPersonAnonymousConfigFields(
        mapCodeDisplaysToOptionList(countryCodeDisplays),
        GENDER_OPTION_LIST,
        NotifiedPersonDisclaimer.FOLLOW_UP_NONNOMINAL_DISCLAIMER
      );
    case NotificationType.AnonymousNotification7_3:
      return notifiedPersonAnonymousConfigFields(
        mapCodeDisplaysToOptionList(countryCodeDisplays),
        GENDER_OPTION_LIST,
        NotifiedPersonDisclaimer.ANONYMOUS_DISCLAIMER
      );
    case NotificationType.NonNominalNotification7_3:
      return notifiedPersonNotByNameConfigFields(
        mapCodeDisplaysToOptionList(countryCodeDisplays),
        GENDER_OPTION_LIST,
        NotifiedPersonDisclaimer.NON_NOMINAL_DISCLAIMER
      );
    default:
      return notifiedPersonFormConfigFields(countryCodeDisplays);
  }
}

export const isNonNominalNotificationEnabled = () => environment.featureFlags?.FEATURE_FLAG_NON_NOMINAL_NOTIFICATION;
export const isAnonymousNotificationEnabled = () => environment.featureFlags?.FEATURE_FLAG_ANONYMOUS_NOTIFICATION;
export const isFollowUpNonNominalEnabled = () => environment.featureFlags?.FEATURE_FLAG_FOLLOW_UP_7_3 && isNonNominalNotificationEnabled();
export const isCoreSidenavEnabled = () => environment.featureFlags?.FEATURE_FLAG_CORE_SIDENAV;

export const isNonNominalNotification = (notificationType: NotificationType) => {
  return (
    notificationType === NotificationType.NonNominalNotification7_3 ||
    notificationType === NotificationType.AnonymousNotification7_3 ||
    notificationType === NotificationType.FollowUpNotification7_3
  );
};

export const isAnonymousPersonNotification = (notificationType: NotificationType) =>
  notificationType === NotificationType.FollowUpNotification7_1 ||
  notificationType === NotificationType.AnonymousNotification7_3 ||
  notificationType === NotificationType.FollowUpNotification7_3;

export const isFollowUpNotification = (notificationType: NotificationType) =>
  notificationType === NotificationType.FollowUpNotification7_1 || notificationType === NotificationType.FollowUpNotification7_3;

export const initializeSelectPathogenFields = (
  federalStateCodeDisplays: CodeDisplay[],
  pathogenCodeDisplays: CodeDisplay[],
  notificationType: NotificationType,
  selectPathogen?: (pathogen: CodeDisplay) => void
) => {
  return selectNotificationCategoryFields(federalStateCodeDisplays, pathogenCodeDisplays.map(formatCodeDisplayToDisplay), [], notificationType, selectPathogen);
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
            label: 'Meldende Person',
            anchor: 'notified-facility-form',
          },
          fieldGroup: notifierFacilityFields,
        },
        {
          key: 'submittingFacility',
          props: {
            label: 'Einsendende Person',
            anchor: 'submitting-facility-form',
          },
          fieldGroup: submitterFacilityFields,
        },
        {
          key: 'notifiedPerson',
          props: {
            label: 'Betroffene Person',
            anchor: 'notified-person-form',
          },
          fieldGroup: notifiedPersonFields,
        },
        {
          key: 'notificationCategory',
          props: {
            label: 'Meldetatbestand',
            anchor: 'select-pathogen-form',
          },
          fieldGroup: selectPathogenFields,
        },
        {
          key: 'pathogenDTO',
          props: {
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
  if (pathogenDTOGroup) {
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

const emptySpecimenList: any[] = [
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

  const emptySpecimenList: SpecimenDTO[] = [
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
    notificationIdReference: undefined,
  };
  model.pathogenForm.pathogenDTO = { specimenList: emptySpecimenList };
  model.pathogenForm.notificationCategory = emptyNotificationCategory;
  return model;
}
