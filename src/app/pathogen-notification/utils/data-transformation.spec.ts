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

import { transformDiagnostic } from './data-transformation';
import { environment } from '../../../environments/environment';
import { TEST_DATA } from '../../../test/shared/test-data';

describe('DataTransformation', () => {
  beforeEach(async () => {
    environment.pathogenConfig = {
      featureFlags: {},
      gatewayPaths: {
        pathogen: '/api/ng/notification/pathogen',
      },
      futsPaths: {},
      ngxLoggerConfig: {
        serverLogLevel: 1,
        disableConsoleLogging: true,
        level: 1,
      },
      pathToGateway: '../gateway/notification',
      pathToFuts: '../fhir-ui-data-model-translation',
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
          federalStateCodeDisplay: 'DE-BW',
          pathogen: 'Influenza A-Virus',
          pathogenDisplay: 'Influenzavirus',
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
          federalStateCodeDisplay: 'DE-BW',
          pathogen: 'Influenza A-Virus',
          pathogenDisplay: 'Influenzavirus',
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
});
