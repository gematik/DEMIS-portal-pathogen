/*
 Copyright (c) 2025 gematik GmbH
 Licensed under the EUPL, Version 1.2 or - as soon they will be approved by
 the European Commission - subsequent versions of the EUPL (the "Licence");
 You may not use this work except in compliance with the Licence.
    You may obtain a copy of the Licence at:
    https://joinup.ec.europa.eu/software/page/eupl
        Unless required by applicable law or agreed to in writing, software
 distributed under the Licence is distributed on an "AS IS" basis,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the Licence for the specific language governing permissions and
 limitations under the Licence.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { anything, instance, mock, when } from 'ts-mockito';
import { SubmitNotificationDialogComponent } from './submit-notification-dialog.component';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LoggerTestingModule } from 'ngx-logger/testing';
import { of } from 'rxjs';
import { FhirNotificationService } from '../../services/fhir-notification.service';

describe('SubmitNotificationDialogComponent', () => {
  let component: SubmitNotificationDialogComponent;
  let fixture: ComponentFixture<SubmitNotificationDialogComponent>;

  const fhirNotificationService = mock(FhirNotificationService);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoggerTestingModule, SubmitNotificationDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: false },
        { provide: MatDialogRef, useValue: {} },
        {
          provide: FhirNotificationService,
          useFactory: () => instance(fhirNotificationService),
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
    when(fhirNotificationService.sendNotification(anything())).thenReturn(of());
    fixture = TestBed.createComponent(SubmitNotificationDialogComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
