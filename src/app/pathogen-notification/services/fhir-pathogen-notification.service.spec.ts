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

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { NGXLogger } from 'ngx-logger';
import { FhirPathogenNotificationService } from './fhir-pathogen-notification.service';
import { ErrorDialogService } from './error-dialog.service';
import { provideHttpClient } from '@angular/common/http';
import { NGXLoggerMock } from 'ngx-logger/testing';
import { NotificationLaboratoryCategory, PathogenTest } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { NotificationType } from '../common/routing-helper';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { FileService } from '../legacy/services/file.service';

describe('FhirPathogenNotificationService', () => {
  let service: FhirPathogenNotificationService;
  let httpMock: HttpTestingController;
  let logger: NGXLogger;
  let errorDialogService: ErrorDialogService;
  let messageDialogService: jasmine.SpyObj<MessageDialogService>;
  let fileService: jasmine.SpyObj<FileService>;

  beforeEach(async () => {
    environment.pathogenConfig = {
      featureFlags: {},
      gatewayPaths: {
        pathogen: '/api/ng/notification/pathogen',
        pathogen_7_1: '/api/ng/notification/pathogen/7.1',
        pathogen_7_3_non_nominal: '/api/ng/notification/pathogen/7.3/non_nominal',
      },
      futsPaths: {
        countryCodes: '/utils/countryCodes',
        federalStates_7_1: '/laboratory/7.1/federalStates',
        notificationCategories_7_3: '/laboratory/7.3',
        notificationCategoriesForFederalState_7_1: '/laboratory/7.1/federalState/',
        laboratoryDataForSpecificCode_7_1: '/laboratory/7.1/federalState/pathogenData/',
        laboratoryDataForSpecificCode_7_3: '/laboratory/7.3/pathogenData/',
      },
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

  beforeEach(() => {
    messageDialogService = jasmine.createSpyObj<MessageDialogService>('MessageDialogService', [
      'showSpinnerDialog',
      'closeSpinnerDialog',
      'showSubmitDialog',
      'showErrorDialog',
      'extractMessageFromError',
    ]);
    fileService = jasmine.createSpyObj<FileService>('FileService', ['getFileNameByNotificationType']);

    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        FhirPathogenNotificationService,
        { provide: NGXLogger, useClass: NGXLoggerMock },
        ErrorDialogService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageDialogService, useValue: messageDialogService },
        { provide: FileService, useValue: fileService },
      ],
    });

    service = TestBed.inject(FhirPathogenNotificationService);
    httpMock = TestBed.inject(HttpTestingController);
    logger = TestBed.inject(NGXLogger);
    errorDialogService = TestBed.inject(ErrorDialogService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle error when fetching diagnostics based on pathogen selection', () => {
    const pathogenCode = '12345';
    spyOn(logger, 'error');
    spyOn(errorDialogService, 'showBasicClosableErrorDialog');

    service.fetchDiagnosticsBasedOnPathogenSelection(pathogenCode, NotificationType.NominalNotification7_1).subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne(`${environment.pathToFuts}/laboratory/federalState/pathogenData/${pathogenCode}`);
    req.flush('Error fetching diagnostic', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.showBasicClosableErrorDialog).toHaveBeenCalled();
  });

  describe('fetchPathogenCodeDisplaysByTypeAndState', () => {
    it('should handle error when fetching pathogen code displays for federal state', () => {
      const federalStateCode = 'AB-CD';
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

      service.fetchPathogenCodeDisplaysByTypeAndState(NotificationType.NominalNotification7_1, federalStateCode).subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.pathToFuts}/laboratory/federalState/${federalStateCode}`);
      req.flush('Error fetching pathogen code displays', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalled();
      expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalled();
    });

    it('should handle error when fetching pathogen code displays for federal state', () => {
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

      service.fetchFederalStateCodeDisplays(NotificationType.NominalNotification7_1).subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.pathToFuts}/laboratory/federalStates`);
      req.flush('Error fetching federal state code displays', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalled();
      expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalled();
    });
  });

  it('should handle error when fetching country code displays', () => {
    spyOn(logger, 'error');
    spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

    service.fetchCountryCodeDisplays().subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne(`${environment.pathToFuts}/utils/countryCodes`);
    req.flush('Error fetching country code displays', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalled();
  });

  it('should reformat notification', () => {
    const mockNotification: PathogenTest = {
      notifiedPerson: {
        info: { birthDate: '2025-03-03' },
      },
      notificationCategory: {
        pathogen: {
          code: 'Test',
          display: 'Test',
        },
        reportStatus: NotificationLaboratoryCategory.ReportStatusEnum.Final,
        federalStateCodeDisplay: 'removeMe',
        pathogenDisplay: 'removeMeToo',
      },
      submittingFacility: {
        copyAddressCheckBox: true,
      },
    } as any;

    const notificationWithRemovedFields: PathogenTest = {
      notifiedPerson: {
        info: { birthDate: '2025-03-03' },
      },
      notificationCategory: {
        pathogen: {
          code: 'Test',
          display: 'Test',
        },
        reportStatus: NotificationLaboratoryCategory.ReportStatusEnum.Final,
      },
      submittingFacility: {},
    } as any;

    spyOn<any>(service, 'removeUnusedFormlyFields').and.callThrough();
    fileService.getFileNameByNotificationType.and.returnValue('notification.pdf');

    service.submitNotification(mockNotification, NotificationType.NominalNotification7_1);

    const req = httpMock.expectOne(`${environment.pathToGateway}${environment.pathToPathogen}`);
    expect(req.request.method).toBe('POST');
    req.flush({
      authorEmail: 'test@example.com',
      content: 'YmFzZTY0Y29udGVudA==',
      notificationId: 'TEST-123',
      timestamp: '2025-03-03T12:00:00Z',
    });

    expect(service['removeUnusedFormlyFields'] as any).toHaveBeenCalledWith(notificationWithRemovedFields);
    expect(messageDialogService.showSubmitDialog).toHaveBeenCalled();
  });
  describe('submitNotification', () => {
    const notificationTypes = [
      { type: NotificationType.NominalNotification7_1, name: 'NominalNotification7_1' },
      { type: NotificationType.NonNominalNotification7_3, name: 'NonNominalNotification7_3' },
      { type: NotificationType.FollowUpNotification7_1, name: 'FollowUpNotification7_1' },
    ];

    notificationTypes.forEach(({ type, name }) => {
      it(`should submit successfully and show submit dialog for ${name}`, () => {
        const mockNotification = { notificationCategory: {}, submittingFacility: {} } as unknown as PathogenTest;
        const mockUrl = '/mock/submit/url';
        const responseBody = {
          authorEmail: 'author@example.org',
          content: 'YmFzZTY0Y29udGVudA==',
          notificationId: 'ABC-123',
          timestamp: '2025-03-03T12:00:00Z',
        };

        spyOn<any>(service, 'getNotificationUrl').and.returnValue(mockUrl);
        fileService.getFileNameByNotificationType.and.returnValue('notification.pdf');

        service.submitNotification(mockNotification, type);

        const req = httpMock.expectOne(mockUrl);
        expect(req.request.method).toBe('POST');
        req.flush(responseBody);

        expect(messageDialogService.showSpinnerDialog).toHaveBeenCalled();
        expect(messageDialogService.closeSpinnerDialog).toHaveBeenCalled();

        expect(fileService.getFileNameByNotificationType).toHaveBeenCalledWith(jasmine.any(Object), type, responseBody.notificationId);

        expect(messageDialogService.showSubmitDialog).toHaveBeenCalled();
        const submitArg = messageDialogService.showSubmitDialog.calls.mostRecent().args[0];
        expect(submitArg.authorEmail).toBe(responseBody.authorEmail);
        expect(submitArg.notificationId).toBe(responseBody.notificationId);
        expect(submitArg.timestamp).toBe(responseBody.timestamp);
        expect(submitArg.fileName).toBe('notification.pdf');

        const expectedHrefPrefix = 'data:application/octet-stream;base64,';
        const expectedEncodedContent = encodeURIComponent(responseBody.content);
        expect(submitArg.href.startsWith(expectedHrefPrefix)).toBeTrue();
        expect(submitArg.href).toContain(expectedEncodedContent);
      });
    });

    it('should handle backend validation errors properly', () => {
      const mockNotification = { notificationCategory: {}, submittingFacility: {} } as unknown as PathogenTest;
      const mockUrl = '/mock/submit/url';
      spyOn<any>(service, 'getNotificationUrl').and.returnValue(mockUrl);
      messageDialogService.extractMessageFromError.and.returnValue('should-not-be-used');

      const validationErrors = [{ message: 'Error A' }, { message: 'Error B' }];

      service.submitNotification(mockNotification, NotificationType.NominalNotification7_1);

      const req = httpMock.expectOne(mockUrl);
      expect(req.request.method).toBe('POST');
      req.flush({ validationErrors }, { status: 400, statusText: 'Bad Request' });

      expect(messageDialogService.showSpinnerDialog).toHaveBeenCalled();
      expect(messageDialogService.closeSpinnerDialog).toHaveBeenCalled();

      expect(messageDialogService.showErrorDialog).toHaveBeenCalled();
      const errorArg = messageDialogService.showErrorDialog.calls.mostRecent().args[0];
      expect(errorArg.errorTitle).toBe('Meldung konnte nicht zugestellt werden!');
      expect(errorArg.errors).toEqual([
        { text: 'Error A', queryString: 'Error A' },
        { text: 'Error B', queryString: 'Error B' },
      ]);
    });

    it('should handle generic error (no validationErrors) properly', () => {
      const mockNotification = { notificationCategory: {}, submittingFacility: {} } as unknown as PathogenTest;
      const mockUrl = '/mock/submit/url';
      spyOn<any>(service, 'getNotificationUrl').and.returnValue(mockUrl);
      messageDialogService.extractMessageFromError.and.returnValue('Generic failure');

      service.submitNotification(mockNotification, NotificationType.NominalNotification7_1);

      const req = httpMock.expectOne(mockUrl);
      expect(req.request.method).toBe('POST');
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(messageDialogService.showSpinnerDialog).toHaveBeenCalled();
      expect(messageDialogService.closeSpinnerDialog).toHaveBeenCalled();

      expect(messageDialogService.showErrorDialog).toHaveBeenCalled();
      const errorArg = messageDialogService.showErrorDialog.calls.mostRecent().args[0];
      expect(errorArg.errorTitle).toBe('Meldung konnte nicht zugestellt werden!');
      expect(errorArg.errors).toEqual([{ text: 'Generic failure', queryString: 'Generic failure' }]);
    });
  });

  describe('extractErrorDetails', () => {
    it('extractErrorDetails should map validation errors', () => {
      const validationErrors = [{ message: 'VE1' }, { message: 'VE2' }];
      const err = { error: { validationErrors } };
      const result = (service as any).extractErrorDetails(err);
      expect(result).toEqual([
        { text: 'VE1', queryString: 'VE1' },
        { text: 'VE2', queryString: 'VE2' },
      ]);
    });

    it('extractErrorDetails should fall back to extracted message when no validation errors', () => {
      messageDialogService.extractMessageFromError.and.returnValue('Fallback message');
      const err = { error: { any: 'thing' } };
      const result = (service as any).extractErrorDetails(err);
      expect(messageDialogService.extractMessageFromError).toHaveBeenCalled();
      expect(result).toEqual([{ text: 'Fallback message', queryString: 'Fallback message' }]);
    });
  });

  describe('fetchAllPathogenCodeDisplays7_1', () => {
    it('should fetch all pathogen code displays for §7.1 successfully', () => {
      const mockCodeDisplays = [
        { code: 'invp', display: 'Invasive Pneumokokken-Erkrankung' },
        { code: 'masn', display: 'Masern' },
        { code: 'tubs', display: 'Tuberkulose' },
      ];

      service.fetchAllPathogenCodeDisplays7_1().subscribe(res => {
        expect(res).toEqual(mockCodeDisplays);
      });

      const req = httpMock.expectOne(`${environment.pathToFuts}/laboratory/7.1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCodeDisplays);
    });

    it('should handle error when fetching all pathogen code displays for §7.1', () => {
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

      service.fetchAllPathogenCodeDisplays7_1().subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.pathToFuts}/laboratory/7.1`);
      req.flush('Error fetching §7.1 pathogen code displays', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalledWith('Error fetching §7.1 pathogen code displays', jasmine.any(Object));
      expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalledWith(
        jasmine.any(Object),
        '§7.1 Meldetatbestände konnten nicht abgerufen werden.'
      );
    });
  });

  describe('getNotificationUrl', () => {
    describe('when FEATURE_FLAG_NON_NOMINAL_NOTIFICATION is false', () => {
      beforeEach(() => {
        environment.pathogenConfig = {
          ...environment.pathogenConfig,
          featureFlags: { FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: false },
        };
      });

      it('should return gateway + pathToPathogen for NominalNotification7_1', () => {
        const result = service.getNotificationUrl(NotificationType.NominalNotification7_1);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen');
      });

      it('should return gateway + pathToPathogen for NonNominalNotification7_3', () => {
        const result = service.getNotificationUrl(NotificationType.NonNominalNotification7_3);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen');
      });

      it('should return gateway + pathToPathogen for FollowUpNotification7_1', () => {
        const result = service.getNotificationUrl(NotificationType.FollowUpNotification7_1);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen');
      });

      it('should return gateway + pathToPathogen for any other type', () => {
        const result = service.getNotificationUrl('UnknownType' as unknown as NotificationType);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen');
      });
    });

    describe('when FEATURE_FLAG_NON_NOMINAL_NOTIFICATION is true', () => {
      beforeEach(() => {
        environment.pathogenConfig = {
          ...environment.pathogenConfig,
          featureFlags: { FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: true },
        };
      });

      it('should return gateway + pathToPathogen_7_3_nonNominal for NonNominalNotification7_3', () => {
        const result = service.getNotificationUrl(NotificationType.NonNominalNotification7_3);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen/7.3/non_nominal');
      });

      it('should return gateway + pathToPathogen_7_1 for NominalNotification7_1', () => {
        const result = service.getNotificationUrl(NotificationType.NominalNotification7_1);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen/7.1');
      });

      it('should return gateway + pathToPathogen for FollowUpNotification7_1 (default case)', () => {
        const result = service.getNotificationUrl(NotificationType.FollowUpNotification7_1);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen');
      });

      it('should return gateway + pathToPathogen for unknown notification type (default case)', () => {
        const result = service.getNotificationUrl('UnknownType' as unknown as NotificationType);
        expect(result).toBe('../gateway/notification/api/ng/notification/pathogen');
      });
    });
  });
});
