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

import { Component, effect, inject } from '@angular/core';
import { MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FollowUpNotificationIdService } from '../../services/follow-up-notification-id.service';

@Component({
  selector: 'follow-up-notification-id-dialog',
  imports: [MatDialogTitle, MatButton, MatDialogActions, FormlyModule, ReactiveFormsModule, RouterLink],
  templateUrl: './follow-up-notification-id-dialog.component.html',
  styleUrl: './follow-up-notification-id-dialog.component.scss',
  standalone: true,
})
export class FollowUpNotificationIdDialogComponent {
  private readonly router = inject(Router);
  private readonly followUpNotificationIdService = inject(FollowUpNotificationIdService);
  protected readonly key: string = 'initialNotificationIdInput';

  readonly validationStatus = this.followUpNotificationIdService.validationStatus;

  constructor() {
    effect(() => {
      const isValid = this.validationStatus();
      const field = this.form?.get(this.key);
      if (field && isValid === false) {
        this.fields[0].form.get(this.key).setErrors({ custom: true });
      } else if (field && isValid === true) this.fields[0].form.get(this.key).setErrors(null);
    });
  }

  form = new FormGroup({});
  model = {};
  fields: FormlyFieldConfig[] = [
    {
      id: this.key,
      key: this.key,
      type: 'input',
      props: {
        label: 'Initiale Meldungs-ID',
        placeholder: 'Bitte eingeben',
        required: true,
      },
      validators: {
        validation: ['textValidator', 'nonBlankValidator'],
      },
      validation: {
        messages: {
          custom:
            'Die von Ihnen angegebene ID konnte nicht gefunden werden. Überprüfen Sie die ID oder stellen Sie sicher, dass die Erstmeldung nicht älter als \n' +
            '30 Tage ist. Alternativ setzen Sie bitte die Meldung namentlich ab.',
        },
      },
    },
  ];

  closeDialog(): void {
    this.followUpNotificationIdService.closeDialog();
  }

  navigateToWelcomePage() {
    this.closeDialog();
    this.router.navigate(['/welcome']);
  }

  validateNotificationId(id: number): void {
    this.followUpNotificationIdService.validateNotificationId(id);
  }

  isTextInputValid() {
    return !this.form.get(this.key)?.value || this.form.get(this.key).invalid;
  }
}
