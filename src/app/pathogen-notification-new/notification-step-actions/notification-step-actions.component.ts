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

import { Component, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { GemDemisAriaDisabledButtonDirective, StepNavigation } from '@gematik/demis-portal-core-library';
import { PathogenNotificationService } from '../pathogen-notification.service';

@Component({
  selector: 'app-notification-step-actions',
  imports: [MatButton, MatIcon, GemDemisAriaDisabledButtonDirective],
  templateUrl: './notification-step-actions.component.html',
  host: { style: 'display: contents' },
})
export class NotificationStepActionsComponent {
  readonly side = input.required<'left' | 'right'>();
  readonly showNext = input(true);
  protected readonly navigation = inject(StepNavigation);
  protected readonly notificationService = inject(PathogenNotificationService);
}
