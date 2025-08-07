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

import { FollowUpNotificationIdDialogComponent } from './follow-up-notification-id-dialog.component';
import { RouterModule } from '@angular/router';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { MockBuilder, MockRender, MockedComponentFixture } from 'ng-mocks';
import { NGXLogger } from 'ngx-logger';
import { FollowUpNotificationIdService } from '../../services/follow-up-notification-id.service';
import { FormlyModule } from '@ngx-formly/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';

describe('FollowUpNotificationIdDialogComponent', () => {
  let component: FollowUpNotificationIdDialogComponent;
  let fixture: MockedComponentFixture<FollowUpNotificationIdDialogComponent>;

  beforeEach(() => {
    return MockBuilder(FollowUpNotificationIdDialogComponent)
      .mock(RouterModule.forRoot([]))
      .mock(FormlyModule)
      .mock(MatDialogModule)
      .mock(MatButtonModule)
      .mock(ReactiveFormsModule)
      .mock(FollowUpNotificationIdService, {
        validationStatus: signal(null),
        closeDialog: () => {},
        validateNotificationId: () => {},
      })
      .mock(PathogenNotificationComponent)
      .mock(NGXLogger);
  });

  beforeEach(() => {
    fixture = MockRender(FollowUpNotificationIdDialogComponent);
    component = fixture.point.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
