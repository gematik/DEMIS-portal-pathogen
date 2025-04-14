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
  AddressType,
  CodeDisplay,
  ContactPointInfo,
  MethodPathogenDTO,
  NotificationLaboratoryCategory,
  NotifiedPersonBasicInfo,
} from '../../../api/notification';
import { GERMANY_COUNTRY_CODE, newDate, UI_DATE_FORMAT_ENG, ZIP_CODE_DEFAULT } from '../legacy/common-utils';
import { transformPathogenTestToPathogenForm } from './data-transformation';
import ContactTypeEnum = ContactPointInfo.ContactTypeEnum;
import UsageEnum = ContactPointInfo.UsageEnum;
import GenderEnum = NotifiedPersonBasicInfo.GenderEnum;
import ResultEnum = MethodPathogenDTO.ResultEnum;
import ReportStatusEnum = NotificationLaboratoryCategory.ReportStatusEnum;

const pathogenTestDummyDataSource: any = {
  notifierFacility: {
    facilityInfo: {
      institutionName: 'TEST Organisation',
      bsnr: '248123512',
      existsBsnr: true,
    },
    address: {
      zip: ZIP_CODE_DEFAULT,
      country: GERMANY_COUNTRY_CODE,
      street: 'Im Himmelreich',
      // institutionName: 'TEST Organisation',
      additionalInfo: null,
      city: 'Frühling',
      houseNumber: '1',
      addressType: AddressType.Current,
    },
    contact: {
      salutation: 'Mr',
      prefix: 'Dr',
      firstname: 'Melderina',
      lastname: 'Melderson',
    },
    contacts: [
      {
        contactType: ContactTypeEnum.Phone,
        value: '0182736912388889',
        usage: UsageEnum.Work,
      },
      {
        contactType: ContactTypeEnum.Email,
        value: 'testerino@test.de',
      },
    ],
  },
  submittingFacility: {
    facilityInfo: {
      institutionName: 'Das Einsenderinstitut',
      departmentName: 'Station 9a',
    },
    address: {
      zip: ZIP_CODE_DEFAULT,
      country: GERMANY_COUNTRY_CODE,
      street: 'Am Einsenderdamm',
      city: 'Einsendercity',
      houseNumber: '1',
    },
    contact: {
      salutation: 'Mrs',
      prefix: 'Dr',
      firstname: 'Einsenderina',
      lastname: 'Einsenderson',
    },
    contacts: [
      {
        contactType: ContactTypeEnum.Phone,
        value: '012345678',
      },
      {
        contactType: ContactTypeEnum.Email,
        value: 'einsender@einsenderinstitut.de',
      },
    ],
  },
  notifiedPerson: {
    info: {
      firstname: 'Max',
      lastname: 'Power',
      birthDate: newDate(UI_DATE_FORMAT_ENG),
      gender: GenderEnum.Male,
    },
    residenceAddress: {
      zip: ZIP_CODE_DEFAULT,
      country: GERMANY_COUNTRY_CODE,
      street: 'Wohnsitzstraße',
      city: 'Berlin',
      houseNumber: '1',
      addressType: AddressType.Primary,
    },
    currentAddress: {
      addressType: AddressType.PrimaryAsCurrent,
    },
    contacts: [
      {
        contactType: ContactTypeEnum.Phone,
        value: '012345767',
      },
      { contactType: ContactTypeEnum.Email, value: 'testerino@test.de' },
    ],
  },
  pathogen: 'invp',
  notificationCategory: {
    federalStateCodeDisplay: 'DE-BW',
    pathogenDisplay: 'Influenzavirus',
    pathogen: 'Influenza A-Virus' as unknown as CodeDisplay,
    reportStatus: ReportStatusEnum.Preliminary,
  },
  pathogenDTO: {
    codeDisplay: {
      code: 'invp',
      display: 'Influenzavirus; Meldepflicht nur für den direkten Nachweis',
      designations: [{ language: 'de', value: 'Influenzavirus' }],
    },
    specimenList: [
      {
        specimenDTO: {
          extractionDate: newDate(UI_DATE_FORMAT_ENG),
          receivedDate: newDate(UI_DATE_FORMAT_ENG),
          material: 'Rachenabstrich' as unknown as CodeDisplay,
          methodPathogenList: [
            {
              method: 'Antigennachweis' as unknown as CodeDisplay,
              result: ResultEnum.Pos,
            },
          ],
          resistanceList: [],
          resistanceGeneList: [],
        },
      },
    ],
  },
};

export const pathogenTestDummyData = (): any => {
  return pathogenTestDummyDataSource;
};

export const pathogenFormDummyData = (): any => {
  return transformPathogenTestToPathogenForm(pathogenTestDummyData());
};

export const dummyDataForPathogenForm = {
  notifierFacility: pathogenFormDummyData().notifierFacility,
  submittingFacility: pathogenFormDummyData().submittingFacility,
  notifiedPerson: pathogenFormDummyData().notifiedPerson,
  notificationCategory: pathogenFormDummyData().notificationCategory,
  pathogenDTO: pathogenFormDummyData().pathogenDTO,
};
