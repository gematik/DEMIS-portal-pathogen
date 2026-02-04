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

import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageDialogService } from '@gematik/demis-portal-core-library';

@Injectable({
  providedIn: 'root',
})
export class ErrorDialogService {
  dialog = inject(MatDialog);
  private readonly messageDialogService = inject(MessageDialogService);

  /**
   * Help method to display a closable error-dialog with only one error.
   */
  public showBasicClosableErrorDialog(message: string, dialogTitle?: string): void {
    this.messageDialogService.showErrorDialog({
      errorTitle: dialogTitle ?? null,
      errors: [
        {
          text: message,
        },
      ],
    });
  }

  /**
   * Help method to display an error-dialog with redirect to homepage and only one error.
   */
  public showBasicErrorDialogWithRedirect(message: string, dialogTitle?: string): void {
    this.messageDialogService.showErrorDialog({
      redirectToHome: true,
      errorTitle: dialogTitle ?? null,
      errors: [
        {
          text: message,
        },
      ],
    });
  }
}
