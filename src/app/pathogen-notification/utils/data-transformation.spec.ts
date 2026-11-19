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

import { beforeEach, describe, expect, it } from 'vitest';
import { transformDiagnostic, transformPathogenFormToPathogenTest, transformPathogenTestToPathogenForm } from './data-transformation';
import { environment } from '../../../environments/environment';
import { TEST_DATA } from '../../../test/shared/test-data';
import { NotificationType } from '../common/routing-helper';
import { AddressType } from '../../../api/notification';

describe('DataTransformation', () => {
  beforeEach(async () => {
    environment.pathogenConfig = {
      featureFlags: {},
      gatewayPaths: {
        pathogen: '/notification/pathogen',
      },
      futsPaths: {},
      ngxLoggerConfig: environment.defaultLoggerConfiguration,
      pathToGateway: '../gateway/pathogen',
      pathToFuts: '/translation/ui-data-model/v6/fhir',
      pathToDestinationLookup: '/destination-lookup/v1',
      production: false,
    };
  });
  describe('transformDiagnostic', () => {
    const result = {};
    const pathogenData = TEST_DATA.diagnosticBasedOnPathogenSelectionINVP;
    const selectedPathogen = TEST_DATA.pathogenCodeDisplays[0];

    it('should set interpretation, initialNotificationId and laboratoryOrderId with the given values', () => {
      const pathogenForm = {
        notificationCategory: {
          federalState: 'DE-BW',
          notifiablePathogen: 'Influenzavirus',
          pathogen: {
            code: '407479009',
            display: 'Influenza A virus (organism)',
            designations: [
              {
                language: 'en-US',
                value: 'Influenza A virus (organism)',
              },
              {
                language: 'de-DE',
                value: 'Influenza A-Virus',
              },
            ],
          },
          reportStatus: 'preliminary',
          interpretation: 'an interpretation',
          initialNotificationId: 'an id',
          laboratoryOrderId: 'an laboratory order id',
        },
        pathogenDTO: {
          codeDisplay: {
            code: 'invp',
            display: 'Influenzavirus; Meldepflicht nur für den direkten Nachweis',
            designations: [
              {
                language: 'de',
                value: 'Influenzavirus',
              },
            ],
          },
          specimenList: [
            {
              specimenDTO: {
                extractionDate: '05.02.2025',
                receivedDate: '05.02.2025',
                resistanceList: [],
                resistanceGeneList: [],
                material: 'Rachenabstrich',
                methodPathogenList: [
                  {
                    method: 'Antigennachweis',
                    result: 'POS',
                  },
                ],
              },
            },
          ],
        },
      };

      const expected = {
        pathogen: 'invp',
        notificationCategory: {
          ...pathogenForm.notificationCategory,
          pathogen: pathogenData.answerSet[0],
        },
      };
      const actual = transformDiagnostic(pathogenForm, result, pathogenData, selectedPathogen);
      expect(actual.pathogen).toEqual(expected.pathogen);
      expect(actual.notificationCategory).toEqual(expected.notificationCategory);
    });
    it('should set interpretation, initialNotificationId and laboratoryOrderId to undefined', () => {
      const pathogenForm = {
        notificationCategory: {
          federalState: 'DE-BW',
          notifiablePathogen: 'Influenzavirus',
          pathogen: {
            code: '407479009',
            display: 'Influenza A virus (organism)',
            designations: [
              {
                language: 'en-US',
                value: 'Influenza A virus (organism)',
              },
              {
                language: 'de-DE',
                value: 'Influenza A-Virus',
              },
            ],
          },
          reportStatus: 'preliminary',
          interpretation: '',
          initialNotificationId: '',
          laboratoryOrderId: '',
        },
        pathogenDTO: {
          codeDisplay: {
            code: 'invp',
            display: 'Influenzavirus; Meldepflicht nur für den direkten Nachweis',
            designations: [
              {
                language: 'de',
                value: 'Influenzavirus',
              },
            ],
          },
          specimenList: [
            {
              specimenDTO: {
                extractionDate: '05.02.2025',
                receivedDate: '05.02.2025',
                resistanceList: [],
                resistanceGeneList: [],
                material: 'Rachenabstrich',
                methodPathogenList: [
                  {
                    method: 'Antigennachweis',
                    result: 'POS',
                  },
                ],
              },
            },
          ],
        },
      };

      const expected = {
        pathogen: 'invp',
        notificationCategory: {
          ...pathogenForm.notificationCategory,
          pathogen: pathogenData.answerSet[0],
          interpretation: undefined,
          initialNotificationId: undefined,
          laboratoryOrderId: undefined,
        },
      };
      const actual = transformDiagnostic(pathogenForm, result, pathogenData, selectedPathogen);
      expect(actual.pathogen).toEqual(expected.pathogen);
      expect(actual.notificationCategory).toEqual(expected.notificationCategory);
    });
  });

  describe('transformAnonymousPerson', () => {
    it('should transform notified person to anonymous person with all fields', () => {
      const pathogenForm = {
        notifiedPerson: {
          info: {
            gender: 'MALE',
            birthDate: '1990-01-01',
          },
          residenceAddress: {
            country: 'DE',
            zip: '12345',
            city: 'Berlin',
            street: 'Main Street',
          },
        },
      };

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.FollowUpNotification7_1);

      expect(result.notifiedPersonAnonymous).toBeDefined();
      expect(result.notifiedPersonAnonymous.gender).toBe('MALE');
      expect(result.notifiedPersonAnonymous.birthDate).toBe('1990-01-01');
      expect(result.notifiedPersonAnonymous.residenceAddress).toEqual({
        country: 'DE',
        zip: '12345',
        addressType: AddressType.Primary,
      });
      expect(result.notifiedPerson).toBeUndefined();
    });

    it('should transform notified person to anonymous person with undefined zip and birthDate when not provided', () => {
      const pathogenForm = {
        notifiedPerson: {
          info: {
            gender: 'FEMALE',
            birthDate: '',
          },
          residenceAddress: {
            country: 'DE',
            zip: '',
          },
        },
      };

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.FollowUpNotification7_1);

      expect(result.notifiedPersonAnonymous).toBeDefined();
      expect(result.notifiedPersonAnonymous.gender).toBe('FEMALE');
      expect(result.notifiedPersonAnonymous.birthDate).toBeUndefined();
      expect(result.notifiedPersonAnonymous.residenceAddress).toEqual({
        country: 'DE',
        zip: undefined,
        addressType: AddressType.Primary,
      });
    });

    it('should not include notifiedPersonAnonymous when notifiedPerson is not provided', () => {
      const pathogenForm = {};

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.FollowUpNotification7_1);

      expect(result.notifiedPersonAnonymous).toBeUndefined();
    });
  });

  describe('transformNotifiedPersonNotByName', () => {
    it('should transform notified person without contacts and current address', () => {
      const pathogenForm = {
        notifiedPerson: {
          info: {
            gender: 'MALE',
            birthDate: '1985-06-15',
            firstname: 'John',
            lastname: 'Doe',
          },
          residenceAddress: {
            country: 'DE',
            zip: '54321',
            city: 'Hamburg',
            street: 'Second Street',
          },
          residenceAddressType: AddressType.Primary,
        },
      };

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.NonNominalNotification7_3);

      expect(result.notifiedPerson).toBeDefined();
      expect(result.notifiedPerson.info).toEqual({
        gender: 'MALE',
        birthDate: '1985-06-15',
        firstname: 'John',
        lastname: 'Doe',
      });
      expect(result.notifiedPerson.residenceAddress).toEqual({
        country: 'DE',
        zip: '54321',
        city: 'Hamburg',
        street: 'Second Street',
        addressType: AddressType.Primary,
      });
      expect(result.notifiedPerson.contacts).toBeUndefined();
      expect(result.notifiedPerson.currentAddress).toBeUndefined();
    });

    it('should handle different address types', () => {
      const pathogenForm = {
        notifiedPerson: {
          info: {
            gender: 'OTHER',
            birthDate: '2000-12-31',
          },
          residenceAddress: {
            country: 'AT',
            zip: '1010',
            city: 'Vienna',
          },
          residenceAddressType: AddressType.Ordinary,
        },
      };

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.NonNominalNotification7_3);

      expect(result.notifiedPerson).toBeDefined();
      expect(result.notifiedPerson.residenceAddress.addressType).toBe(AddressType.Ordinary);
    });

    it('should not include notifiedPerson when not provided', () => {
      const pathogenForm = {};

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.NonNominalNotification7_3);

      expect(result.notifiedPerson).toBeUndefined();
    });
  });

  describe('fillSpecimenList - analyt handling', () => {
    const selectedPathogen = TEST_DATA.pathogenCodeDisplays[0];
    const analytCodeDisplay = { code: 'analyt-1', display: 'Analyt substance', designations: [{ language: 'de-DE', value: 'Analyt Substanz' }] };

    const pathogenDataWithSubstances = {
      ...TEST_DATA.diagnosticBasedOnPathogenSelectionINVP,
      substances: [analytCodeDisplay],
    };

    const baseDiagnosticForm = {
      notificationCategory: {
        federalState: 'DE-BW',
        pathogen: 'Influenza A-Virus',
        notifiablePathogen: 'Influenzavirus',
        reportStatus: 'preliminary',
      },
      pathogenDTO: {
        codeDisplay: selectedPathogen,
        specimenList: [
          {
            specimenDTO: {
              extractionDate: '05.02.2025',
              receivedDate: '05.02.2025',
              resistanceList: [],
              resistanceGeneList: [],
              material: 'Anderes Untersuchungsmaterial',
              methodPathogenList: [
                {
                  method: 'DNA-Sequenzierung',
                  analyt: 'Analyt Substanz',
                  result: 'POS',
                },
              ],
            },
          },
        ],
      },
    };

    it('should use analyt as CodeDisplay directly', () => {
      const analytAsCodeDisplay = { code: 'analyt-1', display: 'Analyt substance', designations: [{ language: 'de-DE', value: 'Analyt Substanz' }] };
      const pathogenForm = {
        ...baseDiagnosticForm,
        pathogenDTO: {
          ...baseDiagnosticForm.pathogenDTO,
          specimenList: [
            {
              specimenDTO: {
                ...baseDiagnosticForm.pathogenDTO.specimenList[0].specimenDTO,
                methodPathogenList: [
                  {
                    method: 'DNA-Sequenzierung',
                    analyt: analytAsCodeDisplay,
                    result: 'POS',
                  },
                ],
              },
            },
          ],
        },
      };

      const result = transformDiagnostic(pathogenForm, {}, pathogenDataWithSubstances, selectedPathogen);

      expect(result.pathogenDTO.specimenList[0].methodPathogenList[0].analyt).toEqual(analytAsCodeDisplay);
    });

    it('should not include analyt when methodPathogen has no analyt value', () => {
      const pathogenForm = {
        ...baseDiagnosticForm,
        pathogenDTO: {
          ...baseDiagnosticForm.pathogenDTO,
          specimenList: [
            {
              specimenDTO: {
                ...baseDiagnosticForm.pathogenDTO.specimenList[0].specimenDTO,
                methodPathogenList: [
                  {
                    method: 'DNA-Sequenzierung',
                    result: 'POS',
                  },
                ],
              },
            },
          ],
        },
      };

      const result = transformDiagnostic(pathogenForm, {}, pathogenDataWithSubstances, selectedPathogen);

      expect(result.pathogenDTO.specimenList[0].methodPathogenList[0].analyt).toBeUndefined();
    });
  });

  describe('transformStaticSystemVersions', () => {
    it('should set staticSystemVersions when available in pathogenData', () => {
      const pathogenForm = {};
      const pathogenData = TEST_DATA.diagnosticBasedOnPathogenSelectionINVP;

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.FollowUpNotification7_1, undefined, pathogenData);

      expect(result.staticSystemVersions).toEqual(pathogenData.staticSystemVersions);
    });

    it('should not set staticSystemVersions when not available in pathogenData', () => {
      const pathogenForm = {};
      const pathogenData = { ...TEST_DATA.diagnosticBasedOnPathogenSelectionINVP };
      delete pathogenData.staticSystemVersions;

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.FollowUpNotification7_1, undefined, pathogenData);

      expect(result.staticSystemVersions).toBeUndefined();
    });

    it('should not set staticSystemVersions when pathogenData is undefined', () => {
      const pathogenForm = {};

      const result = transformPathogenFormToPathogenTest(pathogenForm, NotificationType.FollowUpNotification7_1, undefined, undefined);

      expect(result.staticSystemVersions).toBeUndefined();
    });
  });

  describe('transformDiagnostic - filterable-select pathogen handling', () => {
    const pathogenData = TEST_DATA.diagnosticBasedOnPathogenSelectionINVP;
    const selectedPathogen = TEST_DATA.pathogenCodeDisplays[0];

    const buildPathogenForm = (pathogenValue: unknown) => ({
      notificationCategory: {
        federalState: 'DE-BW',
        pathogen: pathogenValue,
        notifiablePathogen: 'Influenzavirus',
        reportStatus: 'preliminary',
      },
      pathogenDTO: {
        codeDisplay: selectedPathogen,
        specimenList: [
          {
            specimenDTO: {
              extractionDate: '05.02.2025',
              receivedDate: '05.02.2025',
              resistanceList: [],
              resistanceGeneList: [],
              material: 'Rachenabstrich',
              methodPathogenList: [{ method: 'Antigennachweis', result: 'POS' }],
            },
          },
        ],
      },
    });

    it('should use the pathogen CodeDisplay object directly', () => {
      const pathogenAsCodeDisplay = pathogenData.answerSet[0];

      const result = transformDiagnostic(buildPathogenForm(pathogenAsCodeDisplay), {}, pathogenData, selectedPathogen);

      expect(result.notificationCategory.pathogen).toEqual(pathogenAsCodeDisplay);
    });
  });

  describe('filterable-select option values', () => {
    const pathogenData = TEST_DATA.diagnosticBasedOnPathogenSelectionINVP;
    const selectedPathogen = TEST_DATA.pathogenCodeDisplays[0];
    const resistance = { code: 'res-1', display: 'Resistance', designations: [] };
    const resistanceGene = { code: 'gene-1', display: 'Gene', designations: [] };
    const germany = { value: 'DE', label: 'Deutschland' };

    it('should resolve diagnostic options by code', () => {
      const pathogenForm = {
        notificationCategory: { federalState: 'DE-BW', pathogen: pathogenData.answerSet[0], reportStatus: 'preliminary' },
        pathogenDTO: {
          specimenList: [
            {
              specimenDTO: {
                extractionDate: '05.02.2025',
                receivedDate: '05.02.2025',
                material: { code: '119334006', display: 'Sputum' },
                methodPathogenList: [{ method: { code: '117040002', display: 'DNA-Sequenzierung' }, result: 'POS' }],
                resistanceList: [{ resistance: { code: 'res-1', display: 'Resistenz' }, resistanceResult: 'R' }],
                resistanceGeneList: [{ resistanceGene: { code: 'gene-1', display: 'Gen' }, resistanceGeneResult: 'D' }],
              },
            },
          ],
        },
      };

      const result = transformDiagnostic(pathogenForm, {}, { ...pathogenData, resistances: [resistance], resistanceGenes: [resistanceGene] }, selectedPathogen);
      const specimen = result.pathogenDTO.specimenList[0];

      expect(specimen.material).toEqual(pathogenData.materials[1]);
      expect(specimen.methodPathogenList[0].method).toEqual(pathogenData.methods[0]);
      expect(specimen.resistanceList[0].resistance).toEqual(resistance);
      expect(specimen.resistanceGeneList[0].resistanceGene).toEqual(resistanceGene);
    });

    it('should transform person and address options to codes', () => {
      const pathogenForm = {
        notifiedPerson: {
          info: { gender: { value: 'FEMALE', label: 'Weiblich' }, birthDate: '1990-01-01' },
          residenceAddress: { country: germany, zip: '12345' },
          residenceAddressType: AddressType.Primary,
        },
      };

      const notByName = transformPathogenFormToPathogenTest(pathogenForm as never, NotificationType.NonNominalNotification7_3);
      expect(notByName.notifiedPerson.info.gender).toBe('FEMALE');
      expect(notByName.notifiedPerson.residenceAddress.country).toBe('DE');

      const anonymous = transformPathogenFormToPathogenTest(pathogenForm as never, NotificationType.FollowUpNotification7_1);
      expect(anonymous.notifiedPersonAnonymous.gender).toBe('FEMALE');
      expect(anonymous.notifiedPersonAnonymous.residenceAddress.country).toBe('DE');
    });

    it.each([
      [{ value: 'Mrs', label: 'Frau' }, 'Mrs'],
      [{ value: 'None', label: 'Keine Anrede' }, undefined],
    ])('should transform the salutation option %o of the facilities to %s', (salutation, expected) => {
      const facility = { address: { country: germany }, contact: { salutation } };
      const result = transformPathogenFormToPathogenTest(
        { notifierFacility: facility, submittingFacility: facility } as never,
        NotificationType.FollowUpNotification7_1
      );

      expect(result.notifierFacility.contact.salutation).toBe(expected);
      expect(result.notifierFacility.address.country).toBe('DE');
      expect(result.submittingFacility.contact.salutation).toBe(expected);
      expect(result.submittingFacility.address.country).toBe('DE');
    });
  });

  describe('transformPathogenTestToPathogenForm - notificationCategory.pathogen handling', () => {
    const pathogenData = TEST_DATA.diagnosticBasedOnPathogenSelectionINVP;

    it('should keep the pathogen CodeDisplay object', () => {
      const pathogenCodeDisplay = pathogenData.answerSet[0];
      const pathogenTest = { notificationCategory: { reportStatus: 'preliminary', pathogen: pathogenCodeDisplay } };

      const result = transformPathogenTestToPathogenForm(pathogenTest);

      expect(result.notificationCategory.pathogen).toEqual(pathogenCodeDisplay);
    });

    it('should keep an undefined pathogen value unchanged', () => {
      const pathogenTest = { notificationCategory: { reportStatus: 'preliminary' } };

      const result = transformPathogenTestToPathogenForm(pathogenTest);

      expect(result.notificationCategory.pathogen).toBeUndefined();
    });
  });
});
