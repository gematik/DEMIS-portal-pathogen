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

import { Injectable, signal, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { toObservable } from '@angular/core/rxjs-interop';
import { FollowUpNotificationIdDialogComponent } from '../components/follow-up-notification-id-dialog/follow-up-notification-id-dialog.component';

export interface DialogResult {
  validatedId?: number;
  isValid?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FollowUpNotificationIdService {
  private readonly dialog = inject(MatDialog);

  readonly validatedNotificationId = signal<number | undefined>(undefined);
  readonly validationStatus = signal<boolean | undefined>(undefined);
  readonly hasValidNotificationId = signal<boolean | undefined>(false);

  readonly hasValidNotificationId$ = toObservable(this.hasValidNotificationId);

  private dialogRef: MatDialogRef<FollowUpNotificationIdDialogComponent> | null = null;

  openDialog(): void {
    if (this.dialog.openDialogs.length === 0) {
      this.dialogRef = this.dialog.open(FollowUpNotificationIdDialogComponent, {
        disableClose: true,
      });

      this.dialogRef.afterClosed().subscribe(() => {
        if (this.validationStatus() && this.validatedNotificationId()) {
          this.hasValidNotificationId.set(true);
        }
        this.dialogRef = null;
      });
    }
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  validateNotificationId(id: number): void {
    //TODO: implement backend validation here
    this.validationStatus.set(undefined);
    if (id < 0) {
      this.validationStatus.set(false);
      this.validatedNotificationId.set(undefined);
      return;
    }
    this.validatedNotificationId.set(id);
    this.validationStatus.set(true);
  }

  resetState(): void {
    this.validatedNotificationId.set(undefined);
    this.validationStatus.set(undefined);
  }
}
