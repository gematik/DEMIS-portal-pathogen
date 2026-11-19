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

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FollowUpNotificationIdService } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeDisplay, PathogenData } from '../../api/notification';
import { NotificationType } from '../pathogen-notification/common/routing-helper';
import { formatCodeDisplayToDisplay } from '../pathogen-notification/legacy/common-utils';
import { PathogenFormModel } from '../pathogen-notification/legacy/models/pathogen-form-model';
import { ClipboardDataService } from '../pathogen-notification/services/clipboard-data.service';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { dummyDataForPathogenForm } from '../pathogen-notification/utils/dummy-data';
import { PathogenNotificationPrefillService } from './pathogen-notification-prefill.service';
import { PathogenNotificationService } from './pathogen-notification.service';

describe('PathogenNotificationPrefillService', () => {
  let service: PathogenNotificationPrefillService;
  let initializationCancelled: Subject<void>;
  const pathogen: CodeDisplay = { code: 'invp', display: 'Influenza', designations: [] };
  const diagnostics: PathogenData = {
    codeDisplay: pathogen,
    header: 'Diagnostics',
    materials: [],
    methods: [],
    answerSet: [],
  };
  const formService = {
    formsInitialized: signal(true),
    notificationType: NotificationType.NominalNotification7_1,
    pathogenData: undefined as PathogenData | undefined,
    pathogenCodeDisplays: [] as CodeDisplay[],
    initializationCancelled$: new Subject<void>().asObservable(),
    resetPathogenDiagnostics: vi.fn(),
    applyPathogenReferenceData: vi.fn(),
    applyPrefillData: vi.fn(),
    getStoredFederalStateCode: vi.fn<() => string>(),
    toPathogenFormValue: vi.fn((pathogen?: CodeDisplay) => (pathogen ? formatCodeDisplayToDisplay(pathogen) : '')),
  };
  const fhir = {
    fetchPathogenCodeDisplaysByTypeAndState: vi.fn(),
    fetchAllPathogenCodeDisplays: vi.fn(),
    fetchDiagnosticsBasedOnPathogenSelection: vi.fn(),
  };
  const storage = {
    getSelectedPathogenCodeDisplay: vi.fn<() => CodeDisplay | undefined>(),
  };
  const clipboard = { mapClipboardData: vi.fn<ClipboardDataService['mapClipboardData']>() };
  const followUp = { validatedNotificationId: vi.fn(() => 'validated-id') };
  const logger = { error: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    initializationCancelled = new Subject<void>();
    formService.initializationCancelled$ = initializationCancelled.asObservable();
    formService.formsInitialized.set(true);
    formService.notificationType = NotificationType.NominalNotification7_1;
    formService.pathogenData = undefined;
    formService.pathogenCodeDisplays = [];
    fhir.fetchPathogenCodeDisplaysByTypeAndState.mockReturnValue(of([pathogen]));
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(of([pathogen]));
    fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(of(diagnostics));
    formService.getStoredFederalStateCode.mockReturnValue('DE-BW');
    clipboard.mapClipboardData.mockResolvedValue({ notifiedPerson: { info: { firstname: 'Ada' } }, pathogenDTO: {} });
    followUp.validatedNotificationId.mockReturnValue('validated-id');
    TestBed.configureTestingModule({
      providers: [
        { provide: PathogenNotificationService, useValue: formService },
        { provide: FhirPathogenNotificationService, useValue: fhir },
        { provide: PathogenNotificationStorageService, useValue: storage },
        { provide: ClipboardDataService, useValue: clipboard },
        { provide: FollowUpNotificationIdService, useValue: followUp },
        { provide: NGXLogger, useValue: logger },
      ],
    });
    service = TestBed.inject(PathogenNotificationPrefillService);
  });

  it.each(['dummy', 'clipboard'] as const)('rejects %s imports before initialization', source => {
    formService.formsInitialized.set(false);

    if (source === 'dummy') service.populateWithDummyData();
    else service.populateFromClipboard(new Map());

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      source === 'dummy' ? 'Dummy data cannot be applied before form initialization.' : 'Clipboard data cannot be applied before form initialization.'
    );
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).not.toHaveBeenCalled();
    expect(clipboard.mapClipboardData).not.toHaveBeenCalled();
    expect(formService.applyPrefillData).not.toHaveBeenCalled();
  });

  it.each([
    [NotificationType.NominalNotification7_1, 'invp', undefined],
    [NotificationType.NonNominalNotification7_3, 'hivp', undefined],
    [NotificationType.AnonymousNotification7_3, 'hivp', undefined],
    [NotificationType.FollowUpNotification7_1, 'invp', '7.1'],
    [NotificationType.FollowUpNotification7_3, 'hivp', '7.3'],
  ] as const)('loads and applies dummy data for notification type %s', (type, code, paragraph) => {
    formService.notificationType = type;
    const selected = { ...pathogen, code };
    const data = dummyDataForPathogenForm(type);
    fhir.fetchPathogenCodeDisplaysByTypeAndState.mockReturnValue(of([selected]));
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(of([selected]));

    service.populateWithDummyData();

    if (paragraph) {
      expect(fhir.fetchAllPathogenCodeDisplays).toHaveBeenCalledExactlyOnceWith(paragraph);
      expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).not.toHaveBeenCalled();
    } else {
      expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).toHaveBeenCalledExactlyOnceWith(type, 'DE-BW');
      expect(fhir.fetchAllPathogenCodeDisplays).not.toHaveBeenCalled();
    }
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith(code, type);
    expect(formService.resetPathogenDiagnostics).toHaveBeenCalledOnce();
    expect(formService.applyPathogenReferenceData).toHaveBeenCalledExactlyOnceWith({ pathogen: selected, pathogens: [selected], diagnostics }, 'DE-BW');
    expect(formService.applyPrefillData).toHaveBeenCalledExactlyOnceWith({
      ...data,
      notificationCategory: {
        ...data.notificationCategory,
        federalState: 'DE-BW',
        notifiablePathogen: 'Influenza',
        ...(paragraph && { initialNotificationId: 'validated-id', notificationIdReference: 'relatesToOtherFacility' }),
      },
    });
    expect(formService.resetPathogenDiagnostics.mock.invocationCallOrder[0]).toBeLessThan(formService.applyPathogenReferenceData.mock.invocationCallOrder[0]);
    expect(formService.applyPathogenReferenceData.mock.invocationCallOrder[0]).toBeLessThan(formService.applyPrefillData.mock.invocationCallOrder[0]);
  });

  it('waits for the pathogen list, diagnostics and clipboard mapping before applying data', async () => {
    const list = new Subject<CodeDisplay[]>();
    const diagnosticResponse = new Subject<PathogenData>();
    let resolveMapping!: (data: PathogenFormModel) => void;
    clipboard.mapClipboardData.mockReturnValue(
      new Promise(resolve => {
        resolveMapping = resolve;
      })
    );
    fhir.fetchPathogenCodeDisplaysByTypeAndState.mockReturnValue(list);
    fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(diagnosticResponse);
    formService.getStoredFederalStateCode.mockReturnValue('DE-BY');
    const entries = new Map([['T.notificationCategory', 'invp']]);

    service.populateFromClipboard(entries);

    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
    list.next([pathogen]);
    expect(clipboard.mapClipboardData).not.toHaveBeenCalled();
    diagnosticResponse.next(diagnostics);
    expect(clipboard.mapClipboardData).toHaveBeenCalledExactlyOnceWith(entries, NotificationType.NominalNotification7_1, diagnostics);
    expect(formService.applyPathogenReferenceData).not.toHaveBeenCalled();
    resolveMapping({ notificationCategory: { interpretation: 'Imported' }, pathogenDTO: {} });
    await vi.waitFor(() => expect(formService.applyPrefillData).toHaveBeenCalledOnce());

    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).toHaveBeenCalledExactlyOnceWith(NotificationType.NominalNotification7_1, 'DE-BY');
    expect(formService.applyPathogenReferenceData).toHaveBeenCalledExactlyOnceWith({ pathogen, pathogens: [pathogen], diagnostics }, 'DE-BY');
    expect(formService.applyPrefillData).toHaveBeenCalledExactlyOnceWith(
      {
        notificationCategory: { interpretation: 'Imported', federalState: 'DE-BY', notifiablePathogen: 'Influenza' },
        pathogenDTO: { codeDisplay: pathogen },
      },
      { mergeArrays: true }
    );
  });

  it.each([undefined, pathogen])('imports person data without reference requests with selected pathogen %s', async selected => {
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(selected);
    const entries = new Map([['P.given', 'Ada']]);

    service.populateFromClipboard(entries);
    await vi.waitFor(() => expect(formService.applyPrefillData).toHaveBeenCalledOnce());

    expect(clipboard.mapClipboardData).toHaveBeenCalledExactlyOnceWith(entries, NotificationType.NominalNotification7_1, undefined);
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).not.toHaveBeenCalled();
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
    expect(formService.applyPathogenReferenceData).not.toHaveBeenCalled();
  });

  it('reuses diagnostics for an unchanged selected pathogen', async () => {
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(pathogen);
    formService.pathogenData = diagnostics;
    formService.pathogenCodeDisplays = [pathogen];
    const entries = new Map([['T.material', 'material']]);

    service.populateFromClipboard(entries);
    await vi.waitFor(() => expect(formService.applyPrefillData).toHaveBeenCalledOnce());

    expect(clipboard.mapClipboardData).toHaveBeenCalledExactlyOnceWith(entries, NotificationType.NominalNotification7_1, diagnostics);
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).not.toHaveBeenCalled();
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
    expect(formService.resetPathogenDiagnostics).not.toHaveBeenCalled();
  });

  it.each([
    [NotificationType.FollowUpNotification7_1, '7.1'],
    [NotificationType.FollowUpNotification7_3, '7.3'],
  ] as const)('preserves the selected follow-up category for type %s', async (type, paragraph) => {
    formService.notificationType = type;
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(pathogen);

    service.populateFromClipboard(new Map([['T.notificationCategory', 'ignored-code']]));
    await vi.waitFor(() => expect(formService.applyPrefillData).toHaveBeenCalledOnce());

    expect(fhir.fetchAllPathogenCodeDisplays).toHaveBeenCalledExactlyOnceWith(paragraph);
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith('invp', type);
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).not.toHaveBeenCalled();
  });

  it.each(['dummy', 'clipboard'] as const)('reports reference loading failures for %s without applying data', source => {
    const error = new Error('Backend failed');
    fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(throwError(() => error));

    if (source === 'dummy') service.populateWithDummyData();
    else service.populateFromClipboard(new Map([['T.notificationCategory', 'invp']]));

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(`Failed to populate ${source === 'dummy' ? 'dummy' : 'clipboard'} data.`, error);
    expect(clipboard.mapClipboardData).not.toHaveBeenCalled();
    expect(formService.applyPathogenReferenceData).not.toHaveBeenCalled();
    expect(formService.applyPrefillData).not.toHaveBeenCalled();
  });

  it('reports an unavailable pathogen without requesting diagnostics', () => {
    fhir.fetchPathogenCodeDisplaysByTypeAndState.mockReturnValue(of([]));

    service.populateWithDummyData();

    expect(logger.error).toHaveBeenCalledExactlyOnceWith('Failed to populate dummy data.', new Error('Pathogen "invp" is not available.'));
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
    expect(formService.applyPrefillData).not.toHaveBeenCalled();
  });

  it('reports rejected clipboard mapping without changing form state', async () => {
    const error = new Error('Mapping failed');
    clipboard.mapClipboardData.mockRejectedValue(error);

    service.populateFromClipboard(new Map([['T.notificationCategory', 'invp']]));
    await vi.waitFor(() => expect(logger.error).toHaveBeenCalledExactlyOnceWith('Failed to populate clipboard data.', error));

    expect(formService.applyPathogenReferenceData).not.toHaveBeenCalled();
    expect(formService.applyPrefillData).not.toHaveBeenCalled();
  });

  it.each(['explicit cancellation', 'initialization', 'destroy', 'clipboard import', 'dummy import'] as const)(
    'cancels a pending backend request on %s',
    async action => {
      const response = new Subject<PathogenData>();
      fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(response);
      service.populateWithDummyData();
      expect(response.observed).toBe(true);

      fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(of(diagnostics));
      if (action === 'explicit cancellation') service.cancelPendingPrefill();
      if (action === 'initialization') initializationCancelled.next();
      if (action === 'destroy') TestBed.resetTestingModule();
      if (action === 'clipboard import') service.populateFromClipboard(new Map([['P.given', 'Ada']]));
      if (action === 'dummy import') service.populateWithDummyData();

      expect(response.observed).toBe(false);
      response.next(diagnostics);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(formService.applyPrefillData).toHaveBeenCalledTimes(action.endsWith('import') ? 1 : 0);
    }
  );

  it('ignores a pending clipboard promise after cancellation', async () => {
    let resolveMapping!: (data: PathogenFormModel) => void;
    clipboard.mapClipboardData.mockReturnValue(
      new Promise(resolve => {
        resolveMapping = resolve;
      })
    );
    service.populateFromClipboard(new Map([['T.notificationCategory', 'invp']]));

    service.cancelPendingPrefill();
    resolveMapping({ pathogenDTO: {} });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formService.applyPathogenReferenceData).not.toHaveBeenCalled();
    expect(formService.applyPrefillData).not.toHaveBeenCalled();
  });
});
