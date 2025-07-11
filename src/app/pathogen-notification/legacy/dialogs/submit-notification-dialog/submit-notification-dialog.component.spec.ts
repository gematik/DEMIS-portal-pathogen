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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SubmitNotificationDialogComponent, SubmitNotificationDialogData } from './submit-notification-dialog.component';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { of } from 'rxjs';
import { FhirNotificationService } from '../../services/fhir-notification.service';
import { NotificationType } from '../../../common/routing-helper';

describe('SubmitNotificationDialogComponent', () => {
  let component: SubmitNotificationDialogComponent;
  let fixture: ComponentFixture<SubmitNotificationDialogComponent>;

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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoggerTestingModule, SubmitNotificationDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SubmitNotificationDialogComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
