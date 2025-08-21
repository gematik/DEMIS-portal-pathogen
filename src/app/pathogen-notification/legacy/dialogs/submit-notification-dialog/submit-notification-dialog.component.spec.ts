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

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubmitNotificationDialogComponent, SubmitNotificationDialogData } from './submit-notification-dialog.component';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { throwError, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { NotificationType } from '../../../common/routing-helper';

describe('SubmitNotificationDialogComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    const mockFhirService = jasmine.createSpyObj('FhirNotificationService', ['sendNotification']);
    mockFhirService.sendNotification.and.returnValue(
      of({
        body: {
          status: 'All OK',
          content: '',
          notificationId: '',
          timestamp: '',
          authorName: '',
          authorEmail: '',
          contentType: '',
          title: '',
        },
      })
    );

    const mockData: SubmitNotificationDialogData = {
      notification: { notifiedPerson: { info: 'test' } } as any,
      fhirService: mockFhirService,
      notificationType: NotificationType.NominalNotification7_1,
    };

    TestBed.configureTestingModule({
      imports: [LoggerTestingModule, SubmitNotificationDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {},
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubmitNotificationDialogComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should call showErrorDialog when feature flag is true', fakeAsync(() => {
    spyOnProperty(environment, 'featureFlags', 'get').and.returnValue({
      FEATURE_FLAG_PORTAL_ERROR_DIALOG_ON_SUBMIT: true,
    });

    const messageDialogServiceSpy = jasmine.createSpyObj('MessageDialogService', ['extractMessageFromError', 'showErrorDialog']);
    messageDialogServiceSpy.extractMessageFromError.and.returnValue('Fehlermeldung aus Error');

    const mockFhirService = jasmine.createSpyObj('FhirNotificationService', ['sendNotification']);
    const errorResponse = { message: 'Fehler', validationErrors: [] };
    mockFhirService.sendNotification.and.returnValue(throwError(() => ({ error: errorResponse })));

    const mockData: SubmitNotificationDialogData = {
      notification: { notifiedPerson: { info: 'test' } } as any,
      fhirService: mockFhirService,
      notificationType: NotificationType.NominalNotification7_1,
    };

    TestBed.configureTestingModule({
      imports: [LoggerTestingModule, SubmitNotificationDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {},
          },
        },
        { provide: MessageDialogService, useValue: messageDialogServiceSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubmitNotificationDialogComponent);
    fixture.detectChanges();
    tick();

    expect(messageDialogServiceSpy.extractMessageFromError).toHaveBeenCalledWith(errorResponse);
    expect(messageDialogServiceSpy.showErrorDialog).toHaveBeenCalledWith(
      jasmine.objectContaining({
        errorTitle: 'Meldung konnte nicht zugestellt werden!',
        errors: [
          jasmine.objectContaining({
            text: 'Fehlermeldung aus Error',
            queryString: 'Fehlermeldung aus Error',
          }),
        ],
      })
    );
  }));

  it('should set result to error when feature flag is false', fakeAsync(() => {
    spyOnProperty(environment, 'featureFlags', 'get').and.returnValue({
      FEATURE_FLAG_PORTAL_ERROR_DIALOG_ON_SUBMIT: false,
    });

    const messageDialogServiceSpy = jasmine.createSpyObj('MessageDialogService', ['extractMessageFromError', 'showErrorDialog']);

    const mockFhirService = jasmine.createSpyObj('FhirNotificationService', ['sendNotification']);
    const errorResponse = { message: 'Fehler', validationErrors: [] };
    mockFhirService.sendNotification.and.returnValue(throwError(() => ({ error: errorResponse })));

    const mockData: SubmitNotificationDialogData = {
      notification: { notifiedPerson: { info: 'test' } } as any,
      fhirService: mockFhirService,
      notificationType: NotificationType.NominalNotification7_1,
    };

    TestBed.configureTestingModule({
      imports: [LoggerTestingModule, SubmitNotificationDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {},
          },
        },
        { provide: MessageDialogService, useValue: messageDialogServiceSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SubmitNotificationDialogComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component.result).toBeTruthy();
    expect(component.result?.message).toContain('Es ist ein Fehler aufgetreten');
    expect(messageDialogServiceSpy.showErrorDialog).not.toHaveBeenCalled();
  }));
});
