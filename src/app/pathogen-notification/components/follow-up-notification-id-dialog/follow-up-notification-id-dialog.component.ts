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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FollowUpNotificationIdService } from '../../services/follow-up-notification-id.service';
import { MatError, MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { NgClass, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'follow-up-notification-id-dialog',
  imports: [
    MatDialogTitle,
    MatButton,
    MatDialogActions,
    ReactiveFormsModule,
    RouterLink,
    MatFormField,
    MatLabel,
    MatError,
    NgClass,
    NgIf,
    MatInput,
    MatIcon,
    MatSuffix,
  ],
  templateUrl: './follow-up-notification-id-dialog.component.html',
  styleUrl: './follow-up-notification-id-dialog.component.scss',
  standalone: true,
})
export class FollowUpNotificationIdDialogComponent {
  private readonly router = inject(Router);
  private readonly followUpNotificationIdService = inject(FollowUpNotificationIdService);
  protected readonly key: string = 'initialNotificationIdInput';

  readonly validationStatus = this.followUpNotificationIdService.validationStatus;

  initialNotificationIdControl = new FormControl('', [Validators.required]);

  constructor() {
    effect(() => {
      const isValid = this.validationStatus();
      if (!isValid) {
        this.initialNotificationIdControl.setErrors({ invalid: true });
      } else {
        this.initialNotificationIdControl.setErrors(null);
      }
    });
  }

  getValidationStyle() {
    const status = this.validationStatus();
    if (status === true) {
      return 'valid';
    } else if (status === null || !this.initialNotificationIdControl.errors) {
      return 'notvalidated';
    } else if (status === false) {
      return 'invalid';
    }
    return '';
  }

  getInputClass(): string {
    return 'initial-notification-id-input-field-' + this.getValidationStyle();
  }

  validateNotificationId(id: string): void {
    this.followUpNotificationIdService.validateNotificationId(id);
  }

  isTextInputValid() {
    const c = this.initialNotificationIdControl;
    return !!c && c.valid && (c.touched || c.dirty);
  }

  closeDialog(): void {
    this.followUpNotificationIdService.closeDialog();
  }

  navigateToWelcomePage() {
    this.closeDialog();
    this.router.navigate(['']).then(() => this.router.navigate(['/welcome']));
  }
}
