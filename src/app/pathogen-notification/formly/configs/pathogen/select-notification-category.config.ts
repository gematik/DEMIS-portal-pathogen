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
import { CodeDisplay, NotificationLaboratoryCategory } from 'src/api/notification';
import { of } from 'rxjs';
import { FormlyConstants, formlyRow } from '@gematik/demis-portal-core-library';
import { filterDisplayValues, MORE_INFO_MAX_LENGTH } from '../../../legacy/common-utils';
import { REPORT_STATUS_OPTION_LIST } from '../../../legacy/formly-options-lists';
import ReportStatusEnum = NotificationLaboratoryCategory.ReportStatusEnum;
import { NotificationType } from '../../../common/routing-helper';
import { specificReportingObligations } from 'src/app/pathogen-notification/utils/disclaimer-texts';

const is7_3Notification = (federalStateCodeDisplays: CodeDisplay[]) => federalStateCodeDisplays.length === 0;
const isFollowUpNotification = (notificationType: NotificationType) => notificationType === NotificationType.FollowUpNotification7_1;

export const selectNotificationCategoryFields = (
  federalStateCodeDisplays: CodeDisplay[],
  pathogenDisplays: string[],
  subPathogenDisplays: string[],
  notificationType: NotificationType
): FormlyFieldConfig[] => {
  return [
    formlyRow([
      {
        className: FormlyConstants.LAYOUT_HEADER,
        template: specificReportingObligations(notificationType),
        key: 'selectPathogenInfoWrapper',
      },
    ]),
    {
      id: 'favoriteAddPathogen',
      key: 'favoriteAddPathogen',
      fieldGroup: [
        {
          key: 'favoritePathogen',
          type: 'demis-favorites-list',
          expressions: { hide: () => isFollowUpNotification(notificationType) },
        },
      ],
    },
    {
      className: '',
      template: '<h2>Erregerauswahl</h2>',
    },
    formlyRow([
      {
        id: 'federalStateCodeDisplay',
        key: 'federalStateCodeDisplay',
        type: 'select',
        className: FormlyConstants.COLMD10,
        props: {
          label: 'Bundesland des Melders',
          options: federalStateCodeDisplays.map(value => {
            return { value: value.code, label: value.display };
          }),
          required: true,
        },
        expressions: {
          hide: () => is7_3Notification(federalStateCodeDisplays) || isFollowUpNotification(notificationType),
        },
      },
    ]),
    formlyRow([
      {
        id: 'pathogenDisplay',
        key: 'pathogenDisplay',
        type: 'autocomplete',
        className: FormlyConstants.COLMD10,
        props: {
          label: 'Meldepflichtiger Krankheitserreger',
          filter: (term: string) => of(term ? filterDisplayValues(term, pathogenDisplays) : pathogenDisplays.slice()),
          required: true,
        },
        expressions: {
          hide: (field: FormlyFieldConfig) => {
            return !is7_3Notification(federalStateCodeDisplays) && !field.form?.value?.federalStateCodeDisplay && !isFollowUpNotification(notificationType);
          },
          'props.disabled': () => {
            return isFollowUpNotification(notificationType);
          },
        },
        asyncValidators: {
          validation: ['optionMatches'],
        },
      },
    ]),
    formlyRow([
      {
        id: 'pathogen',
        key: 'pathogen',
        type: 'autocomplete',
        className: FormlyConstants.COLMD10,
        props: {
          label: 'Nachgewiesene Erregerspezies',
          filter: (term: string) => applyFilter(term, subPathogenDisplays),
          required: true,
        },
        expressions: {
          'props.disabled': (field: FormlyFieldConfig) => !localModel(field).pathogenDisplay,
        },
        asyncValidators: {
          validation: ['optionMatches'],
        },
      },
    ]),
    {
      className: FormlyConstants.LAYOUT_HEADER,
      template: '<h2>Befund</h2>',
      expressions: {
        className: reportClassName,
      },
    },
    formlyRow([
      {
        id: 'reportStatus',
        key: 'reportStatus',
        className: FormlyConstants.COLMD10_INLINE,
        type: 'radio',
        props: {
          required: true,
          label: 'Status',
          options: REPORT_STATUS_OPTION_LIST,
        },
        expressions: {
          'props.disabled': (field: FormlyFieldConfig) => !localModel(field).pathogen,
        },
      },
    ]),
    formlyRow([
      {
        id: 'interpretation',
        key: 'interpretation',
        type: 'textarea',
        className: FormlyConstants.COLMD10,
        props: {
          label: 'Interpretation des Befundes',
          maxLength: MORE_INFO_MAX_LENGTH,
          rows: 5,
        },
        validators: {
          validation: ['additionalInfoTextValidator', 'nonBlankValidator'],
        },
        expressions: {
          'props.disabled': (field: FormlyFieldConfig) => !localModel(field).pathogen,
        },
      },
    ]),
    formlyRow([
      {
        className: '',
        template:
          '<span>Bitte geben Sie die Meldungs-ID der Initialmeldung an, ' +
          'die Sie korrigieren oder ergänzen möchten oder der vorläufigen Meldung, <br> wenn Sie nun den endgültigen Befund melden. Die Meldungs-ID wird von DEMIS bei jeder Meldung erzeugt und auf der Meldungsquittung als UUID oder als QR-Code angezeigt.</span><br><br>',
        expressions: {
          className: (field: FormlyFieldConfig) => initialNotificationIdClassName(field, notificationType),
        },
      },
      {
        id: 'initialNotificationId',
        key: 'initialNotificationId',
        type: 'input',
        props: {
          label: 'Initiale Meldungs-ID',
          placeholder: 'Meldungs-ID, auf die sich bezogen wird',
        },
        validators: {
          validation: ['textValidator', 'nonBlankValidator'],
        },
        expressions: {
          className: (field: FormlyFieldConfig) => initialNotificationIdClassName(field, notificationType),
          'props.disabled': (field: FormlyFieldConfig) => isFollowUpNotification(notificationType) || !localModel(field).pathogen,
        },
      },
    ]),
    formlyRow([
      {
        id: 'laboratoryOrderId',
        key: 'laboratoryOrderId',
        type: 'input',
        className: FormlyConstants.COLMD10,
        props: {
          label: 'Laboreigene Auftragsnummer',
          maxLength: 50,
        },
        validators: {
          validation: ['textValidator', 'nonBlankValidator'],
        },
        expressions: {
          'props.disabled': (field: FormlyFieldConfig) => !localModel(field).pathogen,
        },
      },
    ]),
  ];
};

export const applyFilter = (term: string, data: string[]) => of(term ? filterDisplayValues(term, data) : data.slice());

// Helper to reliably access the local model (works even if other groups are disabled)
const localModel = (ffc: FormlyFieldConfig) => ffc.parent?.model || {};

const isGrayedOutSelection = (condition: boolean) => {
  const conditionalClass = condition ? 'grayed-out-element' : '';
  return `${conditionalClass} ${FormlyConstants.COLMD10}`.trim();
};

const initialNotificationIdClassName = (ffc: FormlyFieldConfig, notificationType: NotificationType): string => {
  const model = localModel(ffc);
  return isGrayedOutSelection(model.reportStatus !== ReportStatusEnum.Amended || isFollowUpNotification(notificationType));
};

const reportClassName = (ffc: FormlyFieldConfig): string => {
  const model = localModel(ffc);
  return isGrayedOutSelection(!model.pathogen);
};
