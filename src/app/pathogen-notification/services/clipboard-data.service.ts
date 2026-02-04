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

import { inject, Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { merge } from 'lodash-es';
import { NGXLogger } from 'ngx-logger';
import { AddressType, CodeDisplay, PathogenData, PathogenTest } from '../../../api/notification';
import { formatCodeDisplayToDisplay, getDesignationValueIfAvailable, parseSalutation } from '../legacy/common-utils';
import { transformPathogenFormToPathogenTest, transformPathogenTestToPathogenForm } from '../utils/data-transformation';
import { PathogenNotificationStorageService } from './pathogen-notification-storage.service';
import { addContact, ANONYMOUS_PERSON_RULES, ClipboardRules, FACILITY_RULES, initialModelForClipboard, NOMINAL_PERSON_RULES } from './core/clipboard-constants';
import { BehaviorSubject } from 'rxjs';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { NotificationType } from '../common/routing-helper';

@Injectable({
  providedIn: 'root',
})
export class ClipboardDataService {
  private pathogenData: PathogenData;
  pathogenCodeDisplays: CodeDisplay[] = [];
  // info for pathogen notification component: calls backend and updates diagnostic data
  pathogenValueIsChanging = new BehaviorSubject<string>('');
  pathogenDataIsChangingFromClipboard = new BehaviorSubject<boolean>(false);
  readonly clipboardData = signal<string[][] | undefined>(undefined);

  public readonly dialog = inject(MatDialog);
  protected readonly logger = inject(NGXLogger);
  private readonly notificationStorageService = inject(PathogenNotificationStorageService);
  private readonly messageDialogService = inject(MessageDialogService);

  SUBMITTING_FACILITY_RULES: ClipboardRules = {
    'S.name': value => ({ submittingFacility: { facilityInfo: { institutionName: value } } }),
    'S.type': value => ({ submittingFacility: { facilityInfo: { departmentName: value } } }),
    'S.street': value => ({
      submittingFacility: { address: { street: value } },
    }),
    'S.houseNumber': value => ({
      submittingFacility: { address: { houseNumber: value } },
    }),
    'S.zip': value => ({ submittingFacility: { address: { zip: value } } }),
    'S.city': value => ({
      submittingFacility: { address: { city: value } },
    }),
    'S.country': value => ({
      submittingFacility: { address: { country: value } },
    }),
    'S.salutation': value => {
      const fromClipboard = parseSalutation(value);
      return { submittingFacility: { contact: { salutation: fromClipboard } } };
    },
    'S.prefix': value => ({ submittingFacility: { contact: { prefix: value } } }),
    'S.given': value => ({
      submittingFacility: { contact: { firstname: value } },
    }),
    'S.family': value => ({
      submittingFacility: { contact: { lastname: value } },
    }),
    'S.phone': (value, model) => ({
      submittingFacility: {
        contacts: addContact('phone', value, model?.submittingFacility?.contacts || []),
      },
    }),
    'S.email': (value, model) => ({
      submittingFacility: {
        contacts: addContact('email', value, model?.submittingFacility?.contacts || []),
      },
    }),
    'S.phone2': (value, model) => ({
      submittingFacility: {
        contacts: addContact('phone', value, model?.submittingFacility?.contacts || []),
      },
    }),
  };

  DIAGNOSTIC_CLIPBOARD_RULES: ClipboardRules = {
    'T.pathogen': value => {
      return { notificationCategory: { pathogen: this.augmentCode(value, 'answerSet') } };
    },
    'T.interpretation': value => ({
      pathogenDTO: { specimenList: [{ specimenDTO: { methodPathogenList: [{ result: value }] } }] },
    }),
    'T.reportStatus': value => ({ notificationCategory: { reportStatus: value } }),
    'T.interpretationText': value => ({ notificationCategory: { interpretation: value } }),
    'T.relatesTo': value => ({ notificationCategory: { initialNotificationId: value } }),
    'T.serviceRequest': value => ({ notificationCategory: { laboratoryOrderId: value } }),
    'T.collectedDate': value => ({ pathogenDTO: { specimenList: [{ specimenDTO: { extractionDate: value } }] } }),
    'T.receivedDate': value => ({ pathogenDTO: { specimenList: [{ specimenDTO: { receivedDate: value } }] } }),
    'T.material': value => ({
      pathogenDTO: { specimenList: [{ specimenDTO: { material: this.augmentCode(value, 'materials') } }] },
    }),
    'T.method': value => ({
      pathogenDTO: { specimenList: [{ specimenDTO: { methodPathogenList: [{ method: this.augmentCode(value, 'methods') }] } }] },
    }),
    'T.analyt': value => ({
      pathogenDTO: {
        specimenList: [
          {
            specimenDTO: {
              methodPathogenList: [{ analyt: this.augmentCode(value, 'substances') }],
            },
          },
        ],
      },
    }),
  };

  private readonly PATHOGEN_CLIPBOARD_RULE: ClipboardRules = {
    'T.notificationCategory': (value, model) => {
      if (value !== model.pathogen) {
        this.pathogenValueIsChanging.next(value);
      } else if (value) {
        initialModelForClipboard(value, this.pathogenCodeDisplays);
      }
    },
  };

  setPathogenData(pathogenData: PathogenData) {
    this.pathogenData = pathogenData;
  }

  setPathogenCodeDisplays(codeDisplays: CodeDisplay[]) {
    this.pathogenCodeDisplays = codeDisplays;
  }

  async transformClipboardDataToModel(fromButtonClick: boolean, model: any, notificationType: NotificationType) {
    const codeDisplay = this.getSelectedPathogenCodeDisplayFromStorage();
    const designationValue = codeDisplay ? getDesignationValueIfAvailable(codeDisplay) : '';
    const pathogenIsSetAndDoesNotChange =
      !!model.pathogenForm.notificationCategory?.pathogenDisplay && model.pathogenForm.notificationCategory?.pathogenDisplay === designationValue;

    const transformedClipboardData = await this.buildClipboardDataModel(
      fromButtonClick,
      pathogenIsSetAndDoesNotChange,
      codeDisplay?.code,
      model.pathogenForm,
      notificationType
    );

    if (fromButtonClick) {
      model = this.setModelWithoutBackendInformation(model, transformedClipboardData, pathogenIsSetAndDoesNotChange);
    } else {
      model = this.setModelWithBackendInformation(model, transformedClipboardData);
    }
    model = this.removeUnusedModelValues(model);
    this.pathogenDataIsChangingFromClipboard.next(false);

    return model;
  }

  private async getClipboardDataWithoutDiagnostic(model: any, notificationType: NotificationType): Promise<any> {
    const transformedClipboardData: string[][] | undefined = this.clipboardData();
    model = this.transformModelForSubmittingFacilityCheckbox(transformedClipboardData, model);
    const resultArr = await this.transformClipboardDataForAddress(model, transformedClipboardData);
    let transformedModel = resultArr[0];
    const transformedClipboardDataForAddress = resultArr[1];
    transformedModel = await this.resetCurrentAddressOnTypeChange(transformedModel, transformedClipboardDataForAddress);

    this.setSignalToFetchPathogenData(true, transformedClipboardData);
    const isFollowUp = notificationType === NotificationType.FollowUpNotification7_1;
    const personRules = isFollowUp ? ANONYMOUS_PERSON_RULES : NOMINAL_PERSON_RULES;
    const pathogenRule = isFollowUp ? {} : this.PATHOGEN_CLIPBOARD_RULE;

    await this.fillModelFromClipBoard(
      transformedModel,
      {
        ...FACILITY_RULES,
        ...this.SUBMITTING_FACILITY_RULES,
        ...personRules,
        ...pathogenRule,
      },
      transformedClipboardDataForAddress
    );
    return transformedModel;
  }

  private transformModelForSubmittingFacilityCheckbox(transformedClipboardData: string[][], model: any): any {
    if (transformedClipboardData.some(([key]) => key.startsWith('S.'))) {
      model.submittingFacility = { copyAddressCheckBox: false };
    }
    return model;
  }

  private checkDiagnosticRules(transformedClipboardData: string[][], notificationType: NotificationType) {
    let notificationRules = [
      'T.collectedDate',
      'T.receivedDate',
      'T.material',
      'T.pathogen',
      'T.method',
      'T.analyt',
      'T.interpretation',
      'T.reportStatus',
      'T.interpretationText',
      'T.serviceRequest',
      'T.relatesTo',
    ];

    if (notificationType === NotificationType.FollowUpNotification7_1) {
      notificationRules = notificationRules.filter(rule => rule !== 'T.relatesTo');
    }

    return notificationRules.some(rule => transformedClipboardData.some(([key]) => key === rule));
  }

  private async buildClipboardDataModel(
    firstCall: boolean,
    pathogenIsSetAndDoesNotChange: boolean,
    code: string,
    pathogenForm: any,
    notificationType: NotificationType
  ): Promise<any> {
    const codeDisplay = this.getSelectedPathogenCodeDisplayFromStorage();
    const currentPathogenTest: PathogenTest = transformPathogenFormToPathogenTest(
      JSON.parse(JSON.stringify(pathogenForm)),
      notificationType,
      codeDisplay,
      this.pathogenData
    );

    let clipboardDataPathogenTest: PathogenTest;
    if (firstCall) {
      clipboardDataPathogenTest = await this.getClipboardDataWithoutDiagnostic(currentPathogenTest, notificationType);
      if (pathogenIsSetAndDoesNotChange || (!!clipboardDataPathogenTest.pathogen && clipboardDataPathogenTest.pathogen === code)) {
        clipboardDataPathogenTest = await this.getClipboardDataWithNotificationCategoryAndDiagnostic(clipboardDataPathogenTest, notificationType);
      }
    } else {
      clipboardDataPathogenTest = await this.getClipboardDataWithNotificationCategoryAndDiagnostic(currentPathogenTest, notificationType);
    }
    return transformPathogenTestToPathogenForm(clipboardDataPathogenTest);
  }

  private async getClipboardDataWithNotificationCategoryAndDiagnostic(model: any, notificationType: NotificationType): Promise<any> {
    const transformedClipboardData = this.clipboardData();
    this.setSignalToFetchPathogenData(false, transformedClipboardData);

    const diagnosticRules = { ...this.DIAGNOSTIC_CLIPBOARD_RULES };
    if (notificationType === NotificationType.FollowUpNotification7_1) {
      delete diagnosticRules['T.relatesTo'];
    }

    if (this.checkDiagnosticRules(transformedClipboardData, notificationType)) {
      await this.fillModelFromClipBoard(model, diagnosticRules, transformedClipboardData);
    }

    return model;
  }

  private async resetCurrentAddressOnTypeChange(model: any, transformedClipboardData: string[][]) {
    for (const [key, value] of transformedClipboardData) {
      if (key === 'P.c.type' && value != model.notifiedPerson?.currentAddress?.addressType) {
        model.notifiedPerson.currentAddress = {};
      }
    }
    return model;
  }

  private async isPathogenInClipboard(transformedClipboardData: string[][]) {
    return transformedClipboardData.some(([key, value]) => key === 'T.notificationCategory' && !!value);
  }

  private async transformClipboardDataForAddress(model: any, transformedClipboardData: string[][]) {
    for (const [key, value] of transformedClipboardData) {
      if (
        (key === 'P.c.type' && value === AddressType.SubmittingFacility) ||
        (model.notifiedPerson?.currentAddress?.addressType === AddressType.SubmittingFacility && (key !== 'P.c.type' || (key === 'P.c.type' && !value)))
      ) {
        const keysToExclude = ['P.c.street', 'P.c.houseNumber', 'P.c.zip', 'P.c.city', 'P.c.country', 'P.c.name'];
        model.notifiedPerson.currentAddress = {
          ...model.notifiedPerson.currentAddress,
          submittingFacilityIsActive: true,
        };
        return [model, transformedClipboardData.filter(([key]) => !keysToExclude.includes(key))];
      }
    }
    return [model, transformedClipboardData];
  }

  private readonly getSelectedPathogenCodeDisplayFromStorage = () => {
    return this.notificationStorageService.getSelectedPathogenCodeDisplay();
  };

  private setSignalToFetchPathogenData(fromButtonClick: boolean, transformedClipboardData: any) {
    if (this.isPathogenInClipboard(transformedClipboardData) && fromButtonClick) {
      this.pathogenDataIsChangingFromClipboard.next(true);
    }
    if (!fromButtonClick) {
      this.pathogenDataIsChangingFromClipboard.next(false);
    }
  }

  private setModelWithoutBackendInformation(model: any, transformedClipboardData: any, pathogenIsSetAndDoesNotChange: boolean) {
    return {
      pathogenForm: {
        ...model.pathogenForm,
        notifierFacility: transformedClipboardData.notifierFacility,
        submittingFacility: transformedClipboardData.submittingFacility,
        notifiedPerson: transformedClipboardData.notifiedPerson,
        pathogen: transformedClipboardData.pathogen ?? this.getSelectedPathogenCodeDisplayFromStorage()?.code,
        notificationCategory: Object.assign(model.pathogenForm.notificationCategory, transformedClipboardData.notificationCategory),
        ...(pathogenIsSetAndDoesNotChange ? { pathogenDTO: transformedClipboardData.pathogenDTO } : {}),
        isFromClipboard: !transformedClipboardData.notifiedPerson?.currentAddress?.submittingFacilityIsActive,
      },
    };
  }

  private setModelWithBackendInformation(model: any, transformedClipboardData: any) {
    return {
      pathogenForm: {
        ...model.pathogenForm,
        notificationCategory: Object.assign(model.pathogenForm.notificationCategory, transformedClipboardData.notificationCategory),
        pathogenDTO: Object.assign(model.pathogenForm.pathogenDTO, transformedClipboardData.pathogenDTO),
      },
    };
  }

  private removeUnusedModelValues(model: any) {
    if (
      !!model.pathogenForm.notifiedPerson?.currentAddressType &&
      model.pathogenForm.notifiedPerson.currentAddressType != AddressType.SubmittingFacility &&
      model.pathogenForm.notifiedPerson.currentAddressType != AddressType.OtherFacility
    ) {
      delete model.pathogenForm.notifiedPerson.currentAddress?.additionalInfo;
    }
    return model;
  }

  private async fillModelFromClipBoard(model: any, rules: ClipboardRules, keyValuePairs: string[][]): Promise<void> {
    const problems = await this.fillModel(rules, keyValuePairs, model);
    if (problems.length > 0) {
      this.logger.error('Fehlerhafte Daten:', ...problems);
    }
  }

  async fillModel(rules: ClipboardRules, keyValuePairs: string[][], model: any = {}): Promise<string[]> {
    const problems: string[] = [];
    for (const [key, value] of keyValuePairs) {
      if (value === '') continue;
      if (value === undefined) {
        problems.push(`PT_4713 Falsche Syntax nahe: ${key}`);
        continue;
      }
      const rule = rules[key];
      if (!rule) {
        problems.push(`PT_4714 Ungültiger Parametername: ${key}`);
        continue;
      }
      const promiseOrStruct = rule(value, model);
      if (this.isPromise(promiseOrStruct)) {
        try {
          const struct = await promiseOrStruct;
          merge(model, struct);
        } catch (err) {
          problems.push(`Error processing rule for key ${key}: ${err}`);
        }
      } else {
        merge(model, promiseOrStruct);
      }
    }
    return problems;
  }

  private isPromise(val: any | Promise<any>): val is Promise<any> {
    return val && (val as Promise<any>).then !== undefined;
  }

  augmentCode(code: string, valueSetName: 'materials' | 'methods' | 'answerSet' | 'substances' | 'resitances' | 'resistanceGenes'): string {
    if (this.pathogenData) {
      const codeDisplays = this.pathogenData[valueSetName];
      if (!codeDisplays) throw Error(`PT_4711_no-valueset: ${valueSetName}`);
      const cd: CodeDisplay | undefined = codeDisplays.find(cd => cd.code === code);
      if (!cd) {
        this.logger.error(`PT_4712_invalid_code: "${code}" in valueSet "${valueSetName}"`);
        return '';
      }
      return formatCodeDisplayToDisplay(cd);
    }
    this.logger.error('PathogenData is undefined');
    return '';
  }
}
