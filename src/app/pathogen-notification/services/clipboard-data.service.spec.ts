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

import { NotifiedPersonBasicInfo, PathogenData, PractitionerInfo } from 'src/api/notification';
import { ClipboardDataService } from './clipboard-data.service';
import { FACILITY_RULES, PERSON_RULES } from './core/clipboard-constants';
import { TestBed } from '@angular/core/testing';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { MockProvider } from 'ng-mocks';
import { ActivatedRoute } from '@angular/router';
import { overrides } from '../../../test/shared/test-setup-utils';

describe('ClipboardDataService', () => {
  let service: ClipboardDataService;

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
  });

  describe('PERSON_RULES', () => {
    it('should accept valid gender enums', async () => {
      const model = {};
      const problems = await service.fillModel(PERSON_RULES, [['P.gender', NotifiedPersonBasicInfo.GenderEnum.Female]], model);
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
      const problems = await service.fillModel(PERSON_RULES, [['P.gender', 'W']], model);
      expect(model).toEqual({});
      expect(problems).toEqual(["Error processing rule for key P.gender: Error: Unknown value 'W'"]);
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

    it('should throw error and opens dialog for invalid clipboard data', () => {
      const invalidClipboardData = 'Invalid data';
      expect(() => service.validateClipboardData(invalidClipboardData)).toThrowError('invalid clipboard: it does not start with "URL "');
    });
    it('should log an error and throw when value set is not found', () => {
      service.setPathogenData({} as PathogenData);
      expect(() => service.augmentCode('someCode', 'materials')).toThrowError('PT_4711_no-valueset: materials');
    });
  });
});
