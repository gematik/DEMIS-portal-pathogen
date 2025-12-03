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

import { NotifiedPersonBasicInfo, PathogenData, PractitionerInfo } from 'src/api/notification';
import { ClipboardDataService } from './clipboard-data.service';
import { ANONYMOUS_PERSON_RULES, FACILITY_RULES, NOMINAL_PERSON_RULES } from './core/clipboard-constants';
import { TestBed } from '@angular/core/testing';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { MockProvider } from 'ng-mocks';
import { ActivatedRoute } from '@angular/router';
import { overrides } from '../../../test/shared/test-setup-utils';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { environment } from '../../../environments/environment';

describe('ClipboardDataService', () => {
  let service: ClipboardDataService;
  let showErrorDialogInsertDataFromClipboardSpy: jasmine.Spy;
  beforeEach(async () => {
    environment.pathogenConfig = {
      ...environment.pathogenConfig,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LoggerModule.forRoot({
          level: NgxLoggerLevel.DEBUG,
          serverLogLevel: NgxLoggerLevel.ERROR,
        }),
      ],
      providers: [ClipboardDataService, MockProvider(ActivatedRoute, overrides.activatedRoute)],
    });
    service = TestBed.inject(ClipboardDataService);
    showErrorDialogInsertDataFromClipboardSpy = spyOn(TestBed.inject(MessageDialogService), 'showErrorDialogInsertDataFromClipboard');
  });

  describe('PERSON_RULES', () => {
    describe('NOMINAL_PERSON_RULES', () => {
      it('should accept valid gender enums', async () => {
        const model = {};
        const problems = await service.fillModel(NOMINAL_PERSON_RULES, [['P.gender', NotifiedPersonBasicInfo.GenderEnum.Female]], model);
        expect(model).toEqual({
          notifiedPerson: {
            info: {
              gender: NotifiedPersonBasicInfo.GenderEnum.Female,
            },
          },
        });

        expect(problems).toEqual([]);
      });

      it('should reject invalid gender enums', async () => {
        const model = {};
        const problems = await service.fillModel(NOMINAL_PERSON_RULES, [['P.gender', 'W']], model);
        expect(model).toEqual({});
        expect(problems).toEqual(["Error processing rule for key P.gender: Error: Unknown value 'W'"]);
      });
    });
    describe('ANONYMOUS_PERSON_RULES', () => {
      it('should convert dd.mm.yyyy birthDate to mm.yyyy format', async () => {
        const model = {};
        const problems = await service.fillModel(ANONYMOUS_PERSON_RULES, [['P.birthDate', '12.12.2024']], model);
        expect(model).toEqual({
          notifiedPerson: {
            info: {
              birthDate: '12.2024',
            },
          },
        });

        expect(problems).toEqual([]);
      });
      it('should keep birthDate unchanged if already in mm.yyyy format', async () => {
        const model = {};
        const problems = await service.fillModel(ANONYMOUS_PERSON_RULES, [['P.birthDate', '12.2024']], model);
        expect(model).toEqual({
          notifiedPerson: {
            info: {
              birthDate: '12.2024',
            },
          },
        });

        expect(problems).toEqual([]);
      });
      it('should truncate zip code to first 3 digits if longer than 3 digits', async () => {
        const model = {};
        const problems = await service.fillModel(ANONYMOUS_PERSON_RULES, [['P.r.zip', '12345']], model);
        expect(model).toEqual({
          notifiedPerson: {
            residenceAddress: {
              zip: '123',
            },
          },
        });

        expect(problems).toEqual([]);
      });
      it('should keep zip code unchanged if it is exactly 3 digits', async () => {
        const model = {};
        const problems = await service.fillModel(ANONYMOUS_PERSON_RULES, [['P.r.zip', '123']], model);
        expect(model).toEqual({
          notifiedPerson: {
            residenceAddress: {
              zip: '123',
            },
          },
        });

        expect(problems).toEqual([]);
      });
    });
  });

  describe('FACILITY_RULES', () => {
    it('should accept valid salutation enums', async () => {
      const model = {};
      const problems = await service.fillModel(FACILITY_RULES, [['N.salutation', PractitionerInfo.SalutationEnum.Mr]], model);
      expect(model).toEqual({
        notifierFacility: {
          contact: {
            salutation: PractitionerInfo.SalutationEnum.Mr,
          },
        },
      });

      expect(problems).toEqual([]);
    });

    it('should reject invalid salutation enums', async () => {
      const model = {};
      const problems = await service.fillModel(FACILITY_RULES, [['N.salutation', 'M']], model);
      expect(model).toEqual({});
      expect(problems).toEqual(["Error processing rule for key N.salutation: Error: Unknown value 'M'"]);
    });

    it('should log an error and throw when value set is not found', () => {
      service.setPathogenData({} as PathogenData);
      expect(() => service.augmentCode('someCode', 'materials')).toThrowError('PT_4711_no-valueset: materials');
    });
  });

  describe('should display error dialog', () => {
    it('should throw error and opens dialog for invalid clipboard data', () => {
      const invalidClipboardData = 'Invalid data';
      expect(() => service.validateClipboardData(invalidClipboardData)).toThrowError('invalid clipboard: it does not start with "URL "');
      expect(showErrorDialogInsertDataFromClipboardSpy).toHaveBeenCalled();
    });
  });
});
