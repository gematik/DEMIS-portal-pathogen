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
import { Notification } from '../../../api/notification/model/notification';
import { NotificationLaboratoryCategory } from '../../../api/notification';
import { environment } from '../../../environments/environment';

describe('FhirPathogenNotificationService', () => {
  let service: FhirPathogenNotificationService;
  let httpMock: HttpTestingController;
  let logger: NGXLogger;
  let errorDialogService: ErrorDialogService;

  beforeEach(async () => {
    environment.pathogenConfig = {
      featureFlags: {
        FEATURE_FLAG_COPY_CHECKBOX_FOR_NOTIFIER_DATA: false,
      },
      gatewayPaths: {
        pathogen: '/api/ng/notification/pathogen',
      },
      ngxLoggerConfig: {
        serverLogLevel: 1,
        disableConsoleLogging: true,
        level: 1,
      },
      pathToGateway: '../gateway/notification',
      production: false,
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        FhirPathogenNotificationService,
        { provide: NGXLogger, useClass: NGXLoggerMock },
        ErrorDialogService,
        provideHttpClient(),
        provideHttpClientTesting(),
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
    spyOn(errorDialogService, 'openErrorDialogAndClose');

    service.fetchDiagnosticsBasedOnPathogenSelection(pathogenCode).subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne(`/fhir-ui-data-model-translation/laboratory/federalState/pathogenData/${pathogenCode}`);
    req.flush('Error fetching diagnostic', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.openErrorDialogAndClose).toHaveBeenCalled();
  });

  it('should handle error when fetching pathogen code displays for federal state', () => {
    const federalStateCode = 'AB-CD';
    spyOn(logger, 'error');
    spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

    service.fetchPathogenCodeDisplaysForFederalState(federalStateCode).subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne(`/fhir-ui-data-model-translation/laboratory/federalState/${federalStateCode}`);
    req.flush('Error fetching pathogen code displays', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalled();
  });

  it('should handle error when fetching pathogen code displays for federal state', () => {
    spyOn(logger, 'error');
    spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

    service.fetchFederalStateCodeDisplays().subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne('/fhir-ui-data-model-translation/laboratory/federalStates');
    req.flush('Error fetching federal state code displays', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalled();
  });

  it('should handle error when fetching country code displays', () => {
    spyOn(logger, 'error');
    spyOn(errorDialogService, 'openErrorDialogAndRedirectToHome');

    service.fetchCountryCodeDisplays().subscribe({
      error: err => {
        expect(err).toBeTruthy();
      },
    });

    const req = httpMock.expectOne('/fhir-ui-data-model-translation/utils/countryCodes');
    req.flush('Error fetching country code displays', { status: 500, statusText: 'Server Error' });

    expect(logger.error).toHaveBeenCalled();
    expect(errorDialogService.openErrorDialogAndRedirectToHome).toHaveBeenCalled();
  });

  it('should reformat notification', () => {
    const mockNotification: Notification = {
      notificationType: Notification.NotificationTypeEnum.PathogenTest,
      pathogenTest: {
        notifiedPerson: {
          info: { birthDate: '03.03.2025' },
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
      },
    } as any;

    const notificationWithRemovedFields: Notification = {
      notificationType: Notification.NotificationTypeEnum.PathogenTest,
      pathogenTest: {
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
      },
    } as any;

    spyOn<any>(service, 'removeUnusedFormlyFields').and.callThrough();
    spyOn<any>(FhirPathogenNotificationService, 'setFhirSpecificsDateFormat').and.callThrough();

    service.sendNotification(mockNotification).subscribe(response => {
      expect(response).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.pathToGateway}${environment.pathToPathogen}`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });

    expect(service['removeUnusedFormlyFields'] as any).toHaveBeenCalledWith(notificationWithRemovedFields.pathogenTest);
    expect(FhirPathogenNotificationService['setFhirSpecificsDateFormat'] as any).toHaveBeenCalledWith(notificationWithRemovedFields.pathogenTest);
  });
});
