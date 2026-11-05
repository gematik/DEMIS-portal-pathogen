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

import { Component, inject } from '@angular/core';
import { StepContentComponent } from '@gematik/demis-portal-core-library';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { NotificationStepFormComponent } from '../notification-step-form/notification-step-form.component';
import { NotificationStepActionsComponent } from '../notification-step-actions/notification-step-actions.component';
import { PathogenConstants } from '../../pathogen-notification/common/constants';

@Component({
  selector: 'app-notifier-facility',
  imports: [NotificationStepFormComponent, NotificationStepActionsComponent],
  templateUrl: './notifier-facility.component.html',
})
export class NotifierFacilityComponent extends StepContentComponent<void> {
  readonly notificationService = inject(PathogenNotificationService);

  protected readonly fieldConfig = this.notificationService.notifierFacilityFields;

  protected readonly PathogenConstants = PathogenConstants;
}
