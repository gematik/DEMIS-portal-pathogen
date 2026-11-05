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

import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SectionHeaderComponent } from '@gematik/demis-portal-core-library';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';

@Component({
  selector: 'app-notification-step-form',
  imports: [SectionHeaderComponent, ReactiveFormsModule, FormlyForm],
  templateUrl: './notification-step-form.component.html',
  host: { style: 'display: contents' },
})
export class NotificationStepFormComponent {
  readonly title = input.required<string>();
  readonly group = input.required<FormGroup>();
  readonly model = input.required<object>();
  readonly fields = input.required<FormlyFieldConfig[]>();
  readonly modelChanged = output<void>();
  readonly sectionId = input('notifier-facility-section-header');
  readonly headlineId = input('notifier-facility-headline');
}
