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
import { of } from 'rxjs';
import { isoToGermanFormat } from '../../../legacy/common-utils';

import { RESISTANCE_GENE_RESULT_OPTION_LIST, RESISTANCE_RESULT_OPTION_LIST, RESULT_OPTION_LIST } from '../../../legacy/formly-options-lists';
import { EXTRACTION_START_ERROR_MSG } from '../../../common/pathogen-formly-validation-module';
import { NotificationType } from '../../../common/routing-helper';
import { FormlyConstants, formlyRow } from '@gematik/demis-portal-core-library';
import { PathogenFormInfos } from '../../../utils/disclaimer-texts';
import { isFilterablePathogenEnabled, isFollowUpNotification } from '../../../utils/pathogen-notification-mapper';
import { formlyRequiredFieldsHint } from '../../../legacy/formly/configs/reusable/commons';
import { CodeDisplay } from '../../../../../api/notification';

export const pathogenSpecimenFields = (
  notificationType: NotificationType,
  materialOptions: DiagnosticOptions,
  methodOptions: DiagnosticOptions,
  resistanceGeneOptions?: DiagnosticOptions,
  resistanceOptions?: DiagnosticOptions,
  analytOptions?: CodeDisplay[],
  pathogenHeader?: string,
  pathogenSubheader?: string
): FormlyFieldConfig[] => {
  return [
    {
      className: FormlyConstants.LAYOUT_HEADER,
      template: PathogenFormInfos.insertAllKnownInfosToFulfillReportingObligation + `<h2>${pathogenHeader}</h2><h3>${pathogenSubheader}</h3>`,
      key: 'diagnosticInfoWrapper',
    },
    formlyRequiredFieldsHint(),
    {
      id: 'favoriteAddPathogen',
      key: 'favoriteAddPathogen',
      fieldGroup: [
        {
          key: 'favoritePathogen',
          type: 'demis-favorites-add-list',
          props: { notificationType },
          expressions: { hide: () => isFollowUpNotification(notificationType) },
        },
      ],
    },
    {
      key: 'specimenList',
      id: 'specimenList',
      type: 'repeat',
      props: {
        addText: 'Weitere Probe hinzufügen',
        keepLastItem: true,
        isDiagnostic: true,
        id: 'addSpecimen',
      },
      defaultValue: [{}],
      fieldArray: {
        fieldGroupClassName: 'd-flex flex-column',
        fieldGroup: [
          {
            id: 'specimenDTO',
            key: 'specimenDTO',
            wrappers: ['expansion-panel'],
            props: {
              label: 'Probe',
              isDiagnostic: true,
              isClosed: false,
              isSingle: false,
            },
            expressions: {
              'props.label': (field: FormlyFieldConfig) => {
                let receivedDatePart: string;
                const receivedDateValue = field.model?.receivedDate;
                if (receivedDateValue) {
                  const dateString = typeof receivedDateValue === 'string' ? receivedDateValue : receivedDateValue.toString();
                  receivedDatePart = ` vom ${isoToGermanFormat(dateString)}`;
                } else receivedDatePart = '';

                // TODO can be simplified to field.model?.material?.display with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
                const material = field.model?.material?.display ?? field.model?.material;
                const materialPart = material ? ` aus ${material}` : '';
                return receivedDatePart || materialPart ? 'Diagnostik' + materialPart + receivedDatePart : 'Probe';
              },
              'props.isSingle': (field: FormlyFieldConfig) => {
                return field.parent?.parent?.model?.length == 1;
              },
            },
            fieldGroup: [
              formlyRow([
                {
                  id: 'extractionDate',
                  key: 'extractionDate',
                  className: FormlyConstants.COLMD6,
                  type: 'datepicker',
                  props: {
                    label: 'Entnahmedatum',
                    allowedPrecisions: ['day'],
                    maxDate: new Date(),
                  },
                },
                {
                  id: 'receivedDate',
                  key: 'receivedDate',
                  className: FormlyConstants.COLMD6,
                  type: 'datepicker',
                  props: {
                    label: 'Eingangsdatum',
                    required: true,
                    allowedPrecisions: ['day'],
                    maxDate: new Date(),
                  },
                  expressions: {
                    'props.minDate': (field: FormlyFieldConfig) => field.form?.get('extractionDate')?.value ?? null,
                  },
                  validation: {
                    messages: {
                      minDate: EXTRACTION_START_ERROR_MSG,
                    },
                  },
                },
              ]),
              formlyRow([
                // TODO remove legacy autocomplete with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
                isFilterablePathogenEnabled()
                  ? {
                      id: 'material',
                      key: 'material',
                      className: FormlyConstants.COLMD12,
                      type: 'filterable-select',
                      props: {
                        label: 'Material',
                        required: true,
                        options: materialOptions as CodeDisplay[],
                        optionValueKey: 'code',
                        optionLabelKey: 'display',
                        clearable: true,
                      },
                    }
                  : {
                      id: 'material',
                      key: 'material',
                      className: FormlyConstants.COLMD12,
                      type: 'autocomplete',
                      props: {
                        label: 'Material',
                        required: true,
                        filter: (term: string) => applyFilter(term, materialOptions as string[]),
                      },
                      asyncValidators: {
                        validation: ['optionMatches'],
                      },
                    },
              ]),
              {
                className: FormlyConstants.LAYOUT_HEADER,
                template: '<h2>Diagnostik</h2>',
              },

              {
                className: '',
                template: '<p/>',
              },
              {
                id: 'methodPathogenList',
                key: 'methodPathogenList',
                type: 'repeat',
                className: 'methodPathogen-repeat-section',
                props: {
                  addText: 'Weitere Diagnostik mit derselben Probe hinzufügen',
                  keepLastItem: true,
                  additionalHeader: 'Diagnostik',
                  largeWidth: FormlyConstants.COLMD11,
                  id: 'methodPathogenList',
                },
                defaultValue: [{}],
                fieldArray: {
                  fieldGroupClassName: FormlyConstants.ROW,
                  fieldGroup: [
                    // TODO remove legacy autocomplete with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
                    isFilterablePathogenEnabled()
                      ? {
                          id: 'method',
                          key: 'method',
                          className: FormlyConstants.COLMD12 + ' method',
                          type: 'filterable-select',
                          props: {
                            label: 'Methode',
                            required: true,
                            options: methodOptions as CodeDisplay[],
                            optionValueKey: 'code',
                            optionLabelKey: 'display',
                            clearable: true,
                          },
                        }
                      : {
                          id: 'method',
                          key: 'method',
                          className: FormlyConstants.COLMD12 + ' method',
                          type: 'autocomplete',
                          props: {
                            label: 'Methode',
                            required: true,
                            filter: (term: string) => applyFilter(term, methodOptions as string[]),
                          },
                          asyncValidators: {
                            validation: ['optionMatches'],
                          },
                        },
                    {
                      id: 'analyt',
                      key: 'analyt',
                      type: 'filterable-select',
                      className: FormlyConstants.COLMD12 + ' analyt',
                      props: {
                        label: 'Analyt',
                        placeholder: 'Bitte auswählen',
                        optionValueKey: 'code',
                        optionLabelKey: 'display',
                        options: analytOptions,
                        clearable: true,
                        hintStart: 'Angabe des Analyten notwendig, wenn Angabe für ausgewähltes Testverfahren zutrifft',
                      },

                      expressions: { hide: () => analytOptions?.length === 0 },
                    },
                    {
                      id: 'result',
                      key: 'result',
                      className: `${FormlyConstants.COLMD12_INLINE} test-result`,
                      type: 'radio',
                      props: {
                        required: true,
                        label: 'Ergebnis',
                        options: RESULT_OPTION_LIST,
                      },
                    },
                  ],
                },
              },
              {
                id: 'resistanceList',
                key: 'resistanceList',
                type: 'repeat',
                props: {
                  addText: 'Antibiotika-Resistenz hinzufügen',
                  additionalHeader: 'Antibiotika-Resistenz',
                  id: 'resistanceList',
                },
                className: 'resistance-repeat-section',
                expressions: { hide: () => resistanceOptions?.length === 0 },
                fieldArray: {
                  fieldGroupClassName: FormlyConstants.ROW,
                  fieldGroup: [
                    // TODO remove legacy autocomplete with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
                    isFilterablePathogenEnabled()
                      ? {
                          key: 'resistance',
                          className: FormlyConstants.COLMD12 + ' resistance',
                          type: 'filterable-select',
                          props: {
                            label: 'Antibiotika-Resistenz',
                            required: true,
                            largeWidth: FormlyConstants.COLMD11,
                            options: (resistanceOptions ?? []) as CodeDisplay[],
                            optionValueKey: 'code',
                            optionLabelKey: 'display',
                            clearable: true,
                          },
                        }
                      : {
                          key: 'resistance',
                          className: FormlyConstants.COLMD12 + ' resistance',
                          type: 'autocomplete',
                          props: {
                            label: 'Antibiotika-Resistenz',
                            required: true,
                            largeWidth: FormlyConstants.COLMD11,
                            filter: (term: string) => applyFilter(term, (resistanceOptions ?? []) as string[]),
                          },
                          asyncValidators: {
                            validation: ['optionMatches'],
                          },
                        },
                    {
                      key: 'resistanceResult',
                      className: FormlyConstants.COLMD12_INLINE + ' resistanceResult',
                      type: 'radio',
                      props: {
                        required: true,
                        label: 'Status',
                        options: RESISTANCE_RESULT_OPTION_LIST,
                      },
                    },
                  ],
                },
              },
              {
                id: 'resistanceGeneList',
                key: 'resistanceGeneList',
                type: 'repeat',
                className: 'resistanceGeneList-repeat-section',
                props: {
                  addText: 'Nachweis einer Resistenzdeterminante hinzufügen',
                  additionalHeader: 'Resistenzdeterminante',
                  id: 'resistanceGeneList',
                },
                expressions: { hide: () => resistanceGeneOptions?.length === 0 },
                fieldArray: {
                  fieldGroupClassName: FormlyConstants.ROW,
                  fieldGroup: [
                    // TODO remove legacy autocomplete with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
                    isFilterablePathogenEnabled()
                      ? {
                          key: 'resistanceGene',
                          className: FormlyConstants.COLMD12 + ' resistanceGene',
                          type: 'filterable-select',
                          props: {
                            label: 'Resitenzdeterminate',
                            required: true,
                            largeWidth: FormlyConstants.COLMD11,
                            options: (resistanceGeneOptions ?? []) as CodeDisplay[],
                            optionValueKey: 'code',
                            optionLabelKey: 'display',
                            clearable: true,
                          },
                        }
                      : {
                          key: 'resistanceGene',
                          className: FormlyConstants.COLMD12 + ' resistanceGene',
                          type: 'autocomplete',
                          props: {
                            label: 'Resitenzdeterminate',
                            required: true,
                            largeWidth: FormlyConstants.COLMD11,
                            filter: (term: string) => applyFilter(term, (resistanceGeneOptions ?? []) as string[]),
                          },
                          asyncValidators: {
                            validation: ['optionMatches'],
                          },
                        },
                    {
                      key: 'resistanceGeneResult',
                      className: FormlyConstants.COLMD12_INLINE + ' resistanceGeneResult',
                      type: 'radio',
                      props: {
                        required: true,
                        label: 'Status',
                        options: RESISTANCE_GENE_RESULT_OPTION_LIST,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  ];
};

const escapeRegExp = (string: string) => {
  //we have options with () and []
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const filterDisplayValues = (term: string, data: string[]) => {
  const escapedTerm = escapeRegExp(term);
  const regex = new RegExp(escapedTerm, 'i');
  return data.filter(text => regex.test(text));
};

export const applyFilter = (term: string, data: string[]) => of(term ? filterDisplayValues(term, data) : data.slice());

// TODO can be narrowed to CodeDisplay[] with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
export type DiagnosticOptions = string[] | CodeDisplay[];
