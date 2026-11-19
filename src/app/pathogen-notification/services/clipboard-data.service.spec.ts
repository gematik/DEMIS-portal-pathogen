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

import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { Gender, NotificationLaboratoryCategory, PathogenData, PractitionerInfo } from 'src/api/notification';
import { ClipboardDataService } from './clipboard-data.service';
import { ANONYMOUS_PERSON_RULES, FACILITY_RULES, NOMINAL_PERSON_RULES } from './core/clipboard-constants';
import { TestBed } from '@angular/core/testing';
import { LoggerModule } from 'ngx-logger';
import { MockProvider } from 'ng-mocks';
import { ActivatedRoute } from '@angular/router';
import { overrides } from '../../../test/shared/test-setup-utils';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { environment } from '../../../environments/environment';
import { NotificationType } from '../common/routing-helper';

describe('ClipboardDataService', () => {
  let service: ClipboardDataService;
  let showErrorDialogInsertDataFromClipboardSpy: Mock;
  beforeEach(async () => {
    environment.pathogenConfig = {
      ...environment.pathogenConfig,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoggerModule.forRoot(environment.defaultLoggerConfiguration)],
      providers: [ClipboardDataService, MockProvider(ActivatedRoute, overrides.activatedRoute)],
    });
    service = TestBed.inject(ClipboardDataService);
    showErrorDialogInsertDataFromClipboardSpy = vi.spyOn(TestBed.inject(MessageDialogService), 'showErrorDialogInsertDataFromClipboard');
  });

  describe('PERSON_RULES', () => {
    describe('NOMINAL_PERSON_RULES', () => {
      it('should accept valid gender enums', async () => {
        const model = {};
        const problems = await service.fillModel(NOMINAL_PERSON_RULES, [['P.gender', Gender.Female]], model);
        expect(model).toEqual({
          notifiedPerson: {
            info: {
              gender: Gender.Female,
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
      it('should convert dd.mm.yyyy birthDate to yyyy-mm format', async () => {
        const model = {};
        const problems = await service.fillModel(ANONYMOUS_PERSON_RULES, [['P.birthDate', '12.12.2024']], model);
        expect(model).toEqual({
          notifiedPerson: {
            info: {
              birthDate: '2024-12',
            },
          },
        });

        expect(problems).toEqual([]);
      });
      it('should convert mm.yyyy birthDate to yyyy-mm format', async () => {
        const model = {};
        const problems = await service.fillModel(ANONYMOUS_PERSON_RULES, [['P.birthDate', '12.2024']], model);
        expect(model).toEqual({
          notifiedPerson: {
            info: {
              birthDate: '2024-12',
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

  describe('clipboard date normalization without rendered datepickers', () => {
    it.each([
      ['05.11.1998', '2026-11-04', '04.11.2026', '1998-11-05', '2026-11-04', '2026-11-04'],
      ['1998-11-05', '04.11.2026', '2026-11-04', '1998-11-05', '2026-11-04', '2026-11-04'],
      ['invalid-date', 'invalid-date', 'invalid-date', 'invalid-date', 'invalid-date', 'invalid-date'],
    ])('normalizes birth date %s and diagnostic dates', async (birthDate, collectedDate, receivedDate, expectedBirth, expectedCollected, expectedReceived) => {
      const form = await service.mapClipboardData(
        new Map([
          ['P.birthDate', birthDate],
          ['T.collectedDate', collectedDate],
          ['T.receivedDate', receivedDate],
        ]),
        NotificationType.NominalNotification7_1
      );

      expect(form).toMatchObject({
        notifiedPerson: { info: { birthDate: expectedBirth } },
        pathogenDTO: {
          specimenList: [{ specimenDTO: { extractionDate: expectedCollected, receivedDate: expectedReceived } }],
        },
      });
    });

    it.each([
      ['05.11.1998', '1998-11'],
      ['11.1998', '1998-11'],
      ['1998-11', '1998-11'],
      ['1998', '1998'],
    ])('normalizes anonymous birth date %s while preserving reduced precision', async (birthDate, expected) => {
      const form = await service.mapClipboardData(new Map([['P.birthDate', birthDate]]), NotificationType.AnonymousNotification7_3);

      expect(form).toMatchObject({ notifiedPerson: { info: { birthDate: expected } } });
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
      expect(() => service.augmentDisplay('someCode', 'materials')).toThrowError('PT_4711_no-valueset: materials');
    });
  });

  describe('DIAGNOSTIC_CLIPBOARD_RULES - T.analyt', () => {
    const substanceCode = '710543001';
    const substanceDisplay = 'Treponema pallidum IgG';
    const pathogenDataWithSubstances: PathogenData = {
      codeDisplay: { code: 'invp', display: 'Influenzavirus' },
      header: 'Influenzavirus',
      subheader: '',
      methods: [],
      materials: [],
      answerSet: [],
      substances: [
        {
          code: substanceCode,
          display: 'Treponema-pallidum-IgG-Antikörper',
          designations: [{ language: 'de-DE', value: substanceDisplay }],
        },
      ],
      resistances: [],
      resistanceGenes: [],
    } as any;

    beforeEach(() => {
      service.setPathogenData(pathogenDataWithSubstances);
    });

    it('should set analyt as CodeDisplay object', async () => {
      const model = {};
      const problems = await service.fillModel(service.DIAGNOSTIC_CLIPBOARD_RULES, [['T.analyt', substanceCode]], model);

      expect(problems).toEqual([]);
      expect((model as any).pathogenDTO.specimenList[0].specimenDTO.methodPathogenList[0].analyt).toEqual({
        display: substanceDisplay,
        code: substanceCode,
      });
    });
  });

  describe('DIAGNOSTIC_CLIPBOARD_RULES - T.reference', () => {
    it('should map NONE to NoReference enum value', async () => {
      const model = {};
      const problems = await service.fillModel(service.DIAGNOSTIC_CLIPBOARD_RULES, [['T.reference', 'NONE']], model);

      expect(problems).toEqual([]);
      expect((model as any).notificationCategory.notificationIdReference).toBe(NotificationLaboratoryCategory.NotificationIdReferenceEnum.NoReference);
    });

    it('should map OWN to RelatesToOwnFacility enum value', async () => {
      const model = {};
      const problems = await service.fillModel(service.DIAGNOSTIC_CLIPBOARD_RULES, [['T.reference', 'OWN']], model);

      expect(problems).toEqual([]);
      expect((model as any).notificationCategory.notificationIdReference).toBe(NotificationLaboratoryCategory.NotificationIdReferenceEnum.RelatesToOwnFacility);
    });

    it('should map OTHER to RelatesToOtherFacility enum value', async () => {
      const model = {};
      const problems = await service.fillModel(service.DIAGNOSTIC_CLIPBOARD_RULES, [['T.reference', 'OTHER']], model);

      expect(problems).toEqual([]);
      expect((model as any).notificationCategory.notificationIdReference).toBe(
        NotificationLaboratoryCategory.NotificationIdReferenceEnum.RelatesToOtherFacility
      );
    });

    it('should return undefined for unknown value', async () => {
      const model = {};
      const problems = await service.fillModel(service.DIAGNOSTIC_CLIPBOARD_RULES, [['T.reference', 'INVALID']], model);

      expect(problems).toEqual([]);
      expect((model as any).notificationCategory.notificationIdReference).toBeUndefined();
    });

    it('should include T.reference rule', async () => {
      const diagnosticRules = { ...service.DIAGNOSTIC_CLIPBOARD_RULES };
      const model = {};
      const problems = await service.fillModel(diagnosticRules, [['T.reference', 'OWN']], model);

      expect(problems).toEqual([]);
      expect((model as any).notificationCategory.notificationIdReference).toBe(NotificationLaboratoryCategory.NotificationIdReferenceEnum.RelatesToOwnFacility);
    });
  });
});
