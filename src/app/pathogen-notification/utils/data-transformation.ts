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

import {
  CodeDisplay,
  ContactPointInfo,
  MethodPathogenDTO,
  PathogenData,
  PathogenTest,
  ResistanceDTO,
  ResistanceGeneDTO,
  SpecimenDTO,
} from '../../../api/notification';
import { ExtendedSalutationEnum, findCodeDisplayByDisplayValue, getDesignationValueIfAvailable } from '../legacy/common-utils';
import { isString, merge } from 'lodash-es';

export function transformPathogenTestToPathogenForm(pathogenTest: any): any {
  const result: any = {};

  if (!!pathogenTest.notifierFacility) {
    result.notifierFacility = {
      ...pathogenTest.notifierFacility,
      contacts: transformContactsToPathogenForm(pathogenTest.notifierFacility.contacts),
    };
  }

  if (!!pathogenTest.submittingFacility) {
    result.submittingFacility = {
      ...pathogenTest.submittingFacility,
      contacts: transformContactsToPathogenForm(pathogenTest.submittingFacility.contacts),
    };
  }

  if (!!pathogenTest.notifiedPerson) {
    result.notifiedPerson = {
      info: pathogenTest.notifiedPerson?.info,
      residenceAddress: transformAddressWithoutAddressType(pathogenTest.notifiedPerson?.residenceAddress),
      residenceAddressType: pathogenTest.notifiedPerson?.residenceAddress?.addressType,
      currentAddressType: pathogenTest.notifiedPerson?.currentAddress?.addressType,
      currentAddress: transformAddressWithoutAddressType(pathogenTest.notifiedPerson?.currentAddress),
      contacts: transformContactsToPathogenForm(pathogenTest.notifiedPerson.contacts),
    };
  }

  if (!!pathogenTest.pathogen) {
    result.pathogen = pathogenTest.pathogen;
  }

  if (!!pathogenTest.notificationCategory) {
    result.notificationCategory = {
      ...pathogenTest.notificationCategory,
      pathogen:
        !pathogenTest.notificationCategory?.pathogen || isString(pathogenTest.notificationCategory?.pathogen)
          ? pathogenTest.notificationCategory?.pathogen
          : getDesignationValueIfAvailable(pathogenTest.notificationCategory.pathogen),
    };
  }

  if (!!pathogenTest.pathogenDTO) {
    result.pathogenDTO = {
      codeDisplay: pathogenTest.pathogenDTO.codeDisplay,
      specimenList: pathogenTest.pathogenDTO.specimenList?.map(item => ({
        specimenDTONew: {
          extractionDate: item.extractionDate,
          receivedDate: item.receivedDate,
          ...(item.material && { material: getDesignationValueIfAvailable(item.material) }),
          ...(item.material && {
            methodPathogenList: item.methodPathogenList.map(methodPathogen => ({
              result: methodPathogen.result,
              method: getDesignationValueIfAvailable(methodPathogen.method),
              ...(methodPathogen.analyt && { analyt: getDesignationValueIfAvailable(methodPathogen.analyt) }),
            })),
          }),
          resistanceList: item.resistanceList,
          resistanceGeneList: item.resistanceGeneList,
        },
        specimenDTO: item.specimenDTO,
      })),
    };
    result.pathogenDTO = {
      ...result.pathogenDTO,
      specimenList: result.pathogenDTO.specimenList?.map(item => ({
        specimenDTO: item.specimenDTONew ? merge(item.specimenDTONew, item.specimenDTO) : item.specimenDTO,
      })),
    };
  }

  return result;
}

function transformPerson(pathogenForm: any, result: any) {
  if (!!pathogenForm.notifiedPerson) {
    const currentAddress = transformAddress(
      pathogenForm.notifiedPerson.currentAddressType === 'primaryAsCurrent'
        ? pathogenForm.notifiedPerson.residenceAddress
        : pathogenForm.notifiedPerson.currentAddress,
      pathogenForm.notifiedPerson.currentAddressType
    );

    result.notifiedPerson = {
      info: pathogenForm.notifiedPerson.info,
      contacts: transformContactsToPathogenTest(pathogenForm.notifiedPerson.contacts || []),
      residenceAddress: transformAddress(pathogenForm.notifiedPerson.residenceAddress, pathogenForm.notifiedPerson.residenceAddressType),
      currentAddress,
    };
  }
  return result;
}

function fillSpecimenList(specimenDTOS: Array<SpecimenDTOForm>, pathogenData: PathogenData) {
  let finalSpecimenList: SpecimenDTO[] = [];
  specimenDTOS.forEach(specimenItem => {
    if (specimenItem.specimenDTO) {
      const thisItem = specimenItem.specimenDTO;
      const newSpecimen = {
        extractionDate: thisItem.extractionDate,
        receivedDate: thisItem.receivedDate,
        material: findCodeDisplayByDisplayValue(pathogenData.materials, thisItem.material),
        methodPathogenList: thisItem.methodPathogenList.map(methodPathogen => ({
          ...methodPathogen,
          method: findCodeDisplayByDisplayValue(pathogenData.methods, methodPathogen.method),
          ...(methodPathogen.analyt && {
            analyt: findCodeDisplayByDisplayValue(pathogenData.substances, methodPathogen.analyt),
          }),
        })),
        resistanceList: transformDiagnosticIfNotEmpty(thisItem.resistanceList, pathogenData.resistances, 'resistance'),
        resistanceGeneList: transformDiagnosticIfNotEmpty(thisItem.resistanceGeneList, pathogenData.resistanceGenes, 'resistanceGene'),
      };
      finalSpecimenList.push(newSpecimen);
    }
  });
  return finalSpecimenList;
}

export function transformDiagnostic(pathogenForm: any, result: any, pathogenData: PathogenData, selectedPathogen?: CodeDisplay) {
  result.pathogen = selectedPathogen.code;
  result.notificationCategory = {
    ...pathogenForm.notificationCategory,
    interpretation: pathogenForm.notificationCategory.interpretation || undefined,
    initialNotificationId: pathogenForm.notificationCategory.initialNotificationId || undefined,
    laboratoryOrderId: pathogenForm.notificationCategory.laboratoryOrderId || undefined,
    pathogen: findCodeDisplayByDisplayValue(pathogenData.answerSet, pathogenForm.notificationCategory?.pathogen),
  };
  result.pathogenDTO = {
    codeDisplay: selectedPathogen,
    specimenList: fillSpecimenList(pathogenForm.pathogenDTO.specimenList, pathogenData),
  };
  return result;
}

export function transformPathogenFormToPathogenTest(pathogenForm: any, selectedPathogen?: CodeDisplay, pathogenData?: PathogenData): PathogenTest {
  let result: any = {};
  if (!!pathogenForm.notifierFacility) {
    result.notifierFacility = {
      ...pathogenForm.notifierFacility,
      contact: {
        ...pathogenForm.notifierFacility.contact,
        salutation:
          !!pathogenForm.notifierFacility.contact?.salutation && pathogenForm.notifierFacility.contact.salutation !== ExtendedSalutationEnum.None
            ? pathogenForm.notifierFacility.contact.salutation
            : undefined,
      },
      contacts: transformContactsToPathogenTest(pathogenForm.notifierFacility.contacts || []),
    };
  }

  result = transformPerson(pathogenForm, result);

  if (!!pathogenForm.submittingFacility) {
    result.submittingFacility = {
      ...pathogenForm.submittingFacility,
      contact: {
        ...pathogenForm.submittingFacility.contact,
        salutation:
          !!pathogenForm.submittingFacility.contact?.salutation && pathogenForm.submittingFacility.contact?.salutation !== ExtendedSalutationEnum.None
            ? pathogenForm.submittingFacility.contact.salutation
            : undefined,
      },
      contacts: transformContactsToPathogenTest(pathogenForm.submittingFacility?.contacts || []),
    };
  }

  if (!!selectedPathogen && !!pathogenData) {
    result = transformDiagnostic(pathogenForm, result, pathogenData, selectedPathogen);
  }

  return result;
}

export function transformContactsToPathogenForm(contacts: ContactPointInfo[]): {
  phoneNumbers: ContactPointInfo[];
  emailAddresses: ContactPointInfo[];
} {
  if (!contacts) return { phoneNumbers: [], emailAddresses: [] };
  const phoneNumbers = contacts.filter(contact => contact.contactType === 'phone');
  const emailAddresses = contacts.filter(contact => contact.contactType === 'email');
  return { phoneNumbers, emailAddresses };
}

export function transformContactsToPathogenTest({
  phoneNumbers = [],
  emailAddresses = [],
}: {
  phoneNumbers: ContactPointInfo[];
  emailAddresses: ContactPointInfo[];
}): ContactPointInfo[] {
  return [...phoneNumbers, ...emailAddresses];
}

function transformAddress(address: any, addressType: string): any {
  if (!address) return undefined;

  return {
    ...address,
    addressType,
  };
}

function transformAddressWithoutAddressType(address: any): any {
  if (!address) return {};
  const { addressType, ...addressWithoutType } = address;
  return addressWithoutType;
}

function transformDiagnosticIfNotEmpty(diagnosticList: any[], dataList: CodeDisplay[], key: string): any[] | undefined {
  return diagnosticList
    ? diagnosticList.map(item => ({
        ...item,
        [key]: findCodeDisplayByDisplayValue(dataList, item[key]),
      }))
    : undefined;
}

//TODO create PathogenForm Type here

interface SpecimenDTOForm {
  specimenDTO: SpecimenForm;
}

interface SpecimenForm {
  extractionDate?: string;
  receivedDate: string;
  material: string;
  methodPathogenList: Array<MethodPathogenFrom>;
  resistanceList?: Array<ResistanceDTO>;
  resistanceGeneList?: Array<ResistanceGeneDTO>;
}

export interface MethodPathogenFrom {
  method: string;
  analyt?: string;
  result: MethodPathogenDTO.ResultEnum;
}
