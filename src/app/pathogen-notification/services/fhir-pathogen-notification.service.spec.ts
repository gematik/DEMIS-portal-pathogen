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

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { NGXLogger } from 'ngx-logger';
import { FhirPathogenNotificationService } from './fhir-pathogen-notification.service';
import { ErrorDialogService } from './error-dialog.service';
import { provideHttpClient } from '@angular/common/http';
import { NGXLoggerMock } from 'ngx-logger/testing';
import { CodeDisplay, NotificationLaboratoryCategory, PathogenTest } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { NotificationType } from '../common/routing-helper';
import { MessageDialogService, SeverityEnum } from '@gematik/demis-portal-core-library';
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
        pathogen: '/notification/pathogen',
        pathogen_7_1: '/notification/pathogen/7.1',
        pathogen_7_3_non_nominal: '/notification/pathogen/7.3/non_nominal',
        pathogen_7_3_anonymous: '/notification/pathogen/7.3/anonymous',
      },
      futsPaths: {
        countryCodes: '/utils/countryCodes',
        federalStates_7_1: '/laboratory/7.1/federalStates',
        notificationCategories_7_3: '/laboratory/7.3',
        notificationCategories_7_1: '/laboratory/7.1',
        notificationCategoriesForFederalState_7_1: '/laboratory/7.1/federalState/',
        laboratoryDataForSpecificCode_7_1: '/laboratory/7.1/federalState/pathogenData/',
        laboratoryDataForSpecificCode_7_3: '/laboratory/7.3/pathogenData/',
        laboratoryDataForSpecificCodeDefault: '/laboratory/federalState/pathogenData/',
        followUpCode_7_1: '/laboratory/7.1/followup/',
        followUpCode_7_3: '/laboratory/7.3/followup/',
      },
      ngxLoggerConfig: environment.defaultLoggerConfiguration,
      pathToGateway: '../gateway/pathogen',
      pathToFuts: '/translation/ui-data-model/v6/fhir',
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

    const req = httpMock.expectOne(`${environment.laboratoryDataForSpecificCode_7_1}${pathogenCode}`);
    req.flush('Error fetching diagnostic', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.showBasicClosableErrorDialog).toHaveBeenCalled();
  });

  describe('fetchPathogenCodeDisplaysByTypeAndState', () => {
    it('should handle error when fetching pathogen code displays for federal state', () => {
      const federalStateCode = 'AB-CD';
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'showBasicErrorDialogWithRedirect');

      service.fetchPathogenCodeDisplaysByTypeAndState(NotificationType.NominalNotification7_1, federalStateCode).subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.notificationCategoriesForFederalState_7_1}${federalStateCode}`);
      req.flush('Error fetching pathogen code displays', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalled();
      expect(errorDialogService.showBasicErrorDialogWithRedirect).toHaveBeenCalled();
    });

    it('should handle error when fetching pathogen code displays for federal state', () => {
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'showBasicErrorDialogWithRedirect');

      service.fetchFederalStateCodeDisplays(NotificationType.NominalNotification7_1).subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.pathToFederalStates_7_1}`);
      req.flush('Error fetching federal state code displays', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalled();
      expect(errorDialogService.showBasicErrorDialogWithRedirect).toHaveBeenCalled();
    });
  });

  it('should handle error when fetching country code displays', () => {
    spyOn(logger, 'error');
    spyOn(errorDialogService, 'showBasicErrorDialogWithRedirect');

    service.fetchCountryCodeDisplays().subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne(`${environment.pathToFuts}/utils/countryCodes`);
    req.flush('Error fetching country code displays', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.showBasicErrorDialogWithRedirect).toHaveBeenCalled();
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

    const req = httpMock.expectOne(`${environment.pathToGateway}${environment.pathToPathogen_7_1}`);
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

      const validationErrors = [{ message: 'Error A' }, { message: 'Error B', severity: SeverityEnum.ERROR }];

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
        { text: 'Error A', queryString: 'Error A', severity: undefined },
        { text: 'Error B', queryString: 'Error B', severity: SeverityEnum.ERROR },
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
      const validationErrors = [
        { message: 'VE1', severity: 'error' },
        { message: 'VE2', severity: 'error' },
      ];
      const err = { error: { validationErrors } };
      const result = (service as any).extractErrorDetails(err);
      expect(result).toEqual([
        { text: 'VE1', queryString: 'VE1', severity: 'error' },
        { text: 'VE2', queryString: 'VE2', severity: 'error' },
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

      service.fetchAllPathogenCodeDisplays('7.1').subscribe(res => {
        expect(res).toEqual(mockCodeDisplays);
      });

      const req = httpMock.expectOne(`${environment.notificationCategories_7_1}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCodeDisplays);
    });

    it('should handle error when fetching all pathogen code displays for §7.1', () => {
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'showBasicErrorDialogWithRedirect');

      service.fetchAllPathogenCodeDisplays('7.1').subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.notificationCategories_7_1}`);
      req.flush('Error fetching §7.1 pathogen code displays', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalledWith('Error fetching §7.1 pathogen code displays', jasmine.any(Object));
      expect(errorDialogService.showBasicErrorDialogWithRedirect).toHaveBeenCalledWith(
        jasmine.any(Object),
        '§7.1 Meldetatbestände konnten nicht abgerufen werden.'
      );
    });
  });

  describe('fetchFollowUpCode', () => {
    it('should fetch follow-up codes successfully', () => {
      const notificationCategory = 'cat-001';
      const mockCodeDisplays = [
        { code: 'invp', display: 'Influenza' },
        { code: 'infp', display: 'Influenca' },
      ];

      service.fetchFollowUpCode(notificationCategory, NotificationType.FollowUpNotification7_1).subscribe(res => {
        expect(res).toEqual(mockCodeDisplays);
      });

      const req = httpMock.expectOne(`${environment.notificationCategory_FollowUp_7_1}${notificationCategory}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCodeDisplays);
    });

    it('should handle error when fetching follow-up codes', () => {
      const notificationCategory = 'invp';
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'showBasicErrorDialogWithRedirect');

      service.fetchFollowUpCode(notificationCategory, NotificationType.FollowUpNotification7_1).subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.pathToFuts}/laboratory/7.1/followup/${notificationCategory}`);
      req.flush('Error fetching follow-up codes', { status: 500, statusText: 'Server Error' });

      expect(logger.error).toHaveBeenCalledWith('Error fetching follow up code', jasmine.any(Object));
      expect(errorDialogService.showBasicErrorDialogWithRedirect).toHaveBeenCalledWith(
        'Diese Meldekategorie wird für diese Meldungsart nicht unterstützt. Bitte stellen Sie sicher, dass Sie auf eine Meldung nach § 7 Abs. 1 IfSG referenzieren.',
        'Fehler'
      );
    });

    it('should handle 404 error when follow-up codes are not available', () => {
      const notificationCategory = 'unknown-cat';
      spyOn(logger, 'error');
      spyOn(errorDialogService, 'showBasicErrorDialogWithRedirect');

      service.fetchFollowUpCode(notificationCategory, NotificationType.FollowUpNotification7_1).subscribe({
        error: err => {
          expect(err).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(`${environment.notificationCategory_FollowUp_7_1}${notificationCategory}`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(logger.error).toHaveBeenCalledWith('Error fetching follow up code', jasmine.any(Object));
      expect(errorDialogService.showBasicErrorDialogWithRedirect).toHaveBeenCalled();
    });

    it('should include headers in the request', () => {
      const notificationCategory = 'cat-001';
      const mockCodeDisplays: CodeDisplay[] = [];

      service.fetchFollowUpCode(notificationCategory, NotificationType.FollowUpNotification7_1).subscribe();

      const req = httpMock.expectOne(`${environment.notificationCategory_FollowUp_7_1}${notificationCategory}`);
      expect(req.request.headers.get('Authorization')).toBeDefined();
      req.flush(mockCodeDisplays);
    });
  });

  describe('getNotificationUrl', () => {
    it('should return gateway + pathToPathogen_7_3_nonNominal for NonNominalNotification7_3', () => {
      const result = service.getNotificationUrl(NotificationType.NonNominalNotification7_3);
      expect(result).toBe('../gateway/pathogen/notification/pathogen/7.3/non_nominal');
    });

    it('should return gateway + pathToPathogen_7_1 for NominalNotification7_1', () => {
      const result = service.getNotificationUrl(NotificationType.NominalNotification7_1);
      expect(result).toBe('../gateway/pathogen/notification/pathogen/7.1');
    });

    it('should return gateway + pathToPathogen for unknown notification type (default case)', () => {
      const result = service.getNotificationUrl('UnknownType' as unknown as NotificationType);
      expect(result).toBe('../gateway/pathogen/notification/pathogen');
    });

    it('should return gateway + pathToPathogen_7_1 for FollowUpNotification7_1', () => {
      const result = service.getNotificationUrl(NotificationType.FollowUpNotification7_1);
      expect(result).toBe('../gateway/pathogen/notification/pathogen/7.1');
    });

    it('should return gateway + pathToPathogen_7_1 for FollowUpNotification7_3', () => {
      const result = service.getNotificationUrl(NotificationType.FollowUpNotification7_3);
      expect(result).toBe('../gateway/pathogen/notification/pathogen/7.3/non_nominal');
    });

    it('should return gateway + pathToPathogen_7_1 for AnonymousNotification7_3', () => {
      const result = service.getNotificationUrl(NotificationType.AnonymousNotification7_3);
      expect(result).toBe('../gateway/pathogen/notification/pathogen/7.3/anonymous');
    });
  });
});
