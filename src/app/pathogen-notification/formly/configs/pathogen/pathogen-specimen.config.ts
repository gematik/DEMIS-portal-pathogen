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

import { FormControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { of } from 'rxjs';
import { isoToGermanFormat, UI_DATE_FORMAT_GER } from '../../../legacy/common-utils';

import { PathogenFormInfos } from 'src/app/pathogen-notification/utils/disclaimer-texts';
import { RESISTANCE_GENE_RESULT_OPTION_LIST, RESISTANCE_RESULT_OPTION_LIST, RESULT_OPTION_LIST } from '../../../legacy/formly-options-lists';
import { FormlyConstants } from '../../../legacy/formly/configs/formly-constants';
import { formlyRow } from '../../../legacy/formly/configs/reusable/commons';
import { environment } from '../../../../../environments/environment';
import { EXTRACTION_START_ERROR_MSG } from '../../../common/pathogen-formly-validation-module';

export const pathogenSpecimenFields = (
  materialDisplays: string[],
  methodDisplays: string[],
  resistanceGeneDisplays?: string[],
  resistanceDisplays?: string[],
  analytDisplays?: string[],
  pathogenHeader?: string,
  pathogenSubheader?: string
): FormlyFieldConfig[] => {
  return [
    {
      className: FormlyConstants.LAYOUT_HEADER,
      template: PathogenFormInfos.insertAllKnownInfosToFulfillReportingObligation + `<h2>${pathogenHeader}</h2><h3>${pathogenSubheader}</h3>`,
      key: 'diagnosticInfoWrapper',
    },
    {
      id: 'favoriteAddPathogen',
      key: 'favoriteAddPathogen',
      fieldGroup: [
        {
          key: 'favoritePathogen',
          type: 'demis-favorites-add-list',
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
                if (environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER) {
                  receivedDatePart = field.model?.receivedDate ? ` vom ${isoToGermanFormat(field.model.receivedDate)}` : '';
                } else {
                  receivedDatePart = field.model?.receivedDate ? ` vom ${field.model.receivedDate}` : '';
                }
                const materialPart = field.model?.material ? ` aus ${field.model.material}` : '';
                return receivedDatePart || materialPart ? 'Diagnostik' + materialPart + receivedDatePart : 'Probe';
              },
              'props.isSingle': (field: FormlyFieldConfig) => {
                return field.parent?.parent?.model?.length == 1;
              },
            },
            fieldGroup: [
              formlyRow([
                environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER
                  ? {
                      id: 'extractionDate',
                      key: 'extractionDate',
                      className: FormlyConstants.COLMD6,
                      type: 'datepicker',
                      wrappers: [],
                      props: {
                        label: 'Entnahmedatum',
                        allowedPrecisions: ['day'],
                        maxDate: new Date(),
                      },
                    }
                  : {
                      id: 'extractionDate',
                      key: 'extractionDate',
                      type: 'input',
                      className: FormlyConstants.COLMD6,
                      props: {
                        label: 'Entnahmedatum',
                        required: false,
                        maxLength: 10,
                        placeholder: UI_DATE_FORMAT_GER,
                        change: (field: FormlyFieldConfig) => {
                          const parentFormControl = field?.parent?.formControl as FormControl;
                          triggerReceivedDateValidation(parentFormControl);
                        },
                      },
                      validators: {
                        validation: ['dateInputValidator'],
                      },
                    },
                environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER
                  ? {
                      id: 'receivedDate',
                      key: 'receivedDate',
                      className: FormlyConstants.COLMD6,
                      type: 'datepicker',
                      wrappers: [],
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
                    }
                  : {
                      id: 'receivedDate',
                      key: 'receivedDate',
                      type: 'input',
                      className: FormlyConstants.COLMD6,
                      props: {
                        label: 'Eingangsdatum',
                        required: true,
                        maxLength: 10,
                        placeholder: UI_DATE_FORMAT_GER,
                      },
                      validators: {
                        validation: ['dateInputValidator', 'receivedDateStartDateValidator'],
                      },
                    },
              ]),
              formlyRow([
                {
                  id: 'material',
                  key: 'material',
                  type: 'autocomplete',
                  className: FormlyConstants.COLMD12,
                  props: {
                    label: 'Material',
                    filter: (term: string) => applyFilter(term, materialDisplays),
                    required: true,
                    attributes: { 'data-cy': 'material' },
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
                    {
                      id: 'method',
                      key: 'method',
                      type: 'autocomplete',
                      className: FormlyConstants.COLMD11 + ' method',
                      props: {
                        label: 'Methode',
                        filter: (term: string) => applyFilter(term, methodDisplays),
                        required: true,
                        attributes: { 'data-cy': 'method' },
                      },
                      asyncValidators: {
                        validation: ['optionMatches'],
                      },
                    },
                    {
                      id: 'analyt',
                      key: 'analyt',
                      type: 'autocomplete',
                      className: FormlyConstants.COLMD11 + ' analyt',
                      props: {
                        label: 'Analyt',
                        filter: (term: string) => applyFilter(term, analytDisplays),
                        attributes: { 'data-cy': 'analyt' },
                      },
                      asyncValidators: {
                        validation: ['optionMatches'],
                      },
                      expressions: { hide: () => analytDisplays?.length === 0 },
                    },
                    {
                      id: 'result',
                      key: 'result',
                      className: `${FormlyConstants.COLMD11_INLINE} test-result`,
                      type: 'radio',
                      props: {
                        required: true,
                        label: 'Ergebnis',
                        options: RESULT_OPTION_LIST,
                        attributes: { 'data-cy': 'result' },
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
                expressions: { hide: () => resistanceDisplays?.length === 0 },
                fieldArray: {
                  fieldGroupClassName: FormlyConstants.ROW,
                  fieldGroup: [
                    {
                      key: 'resistance',
                      type: 'autocomplete',
                      className: FormlyConstants.COLMD11 + ' resistance',
                      props: {
                        label: 'Antibiotika-Resistenz',
                        filter: (term: string) => applyFilter(term, resistanceDisplays),
                        required: true,
                        largeWidth: FormlyConstants.COLMD11,
                      },
                      asyncValidators: {
                        validation: ['optionMatches'],
                      },
                    },
                    {
                      key: 'resistanceResult',
                      className: FormlyConstants.COLMD11_INLINE + ' resistanceResult',
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
                expressions: { hide: () => resistanceGeneDisplays?.length === 0 },
                fieldArray: {
                  fieldGroupClassName: FormlyConstants.ROW,
                  fieldGroup: [
                    {
                      key: 'resistanceGene',
                      type: 'autocomplete',
                      className: FormlyConstants.COLMD11 + ' resistanceGene',
                      props: {
                        label: 'Resitenzdeterminate',
                        filter: (term: string) => applyFilter(term, resistanceGeneDisplays),
                        required: true,
                        largeWidth: FormlyConstants.COLMD11,
                      },
                      asyncValidators: {
                        validation: ['optionMatches'],
                      },
                    },
                    {
                      key: 'resistanceGeneResult',
                      className: FormlyConstants.COLMD11_INLINE + ' resistanceGeneResult',
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

const triggerReceivedDateValidation = (parentFormControl?: FormControl) => {
  if (parentFormControl?.value?.receivedDate) {
    parentFormControl?.patchValue({
      receivedDate: parentFormControl?.value?.receivedDate,
    });
  }
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
