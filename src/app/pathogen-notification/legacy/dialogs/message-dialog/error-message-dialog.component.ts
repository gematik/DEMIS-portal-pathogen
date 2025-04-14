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

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { DialogNotificationData, ErrorResult, MessageType } from '../../models/ui/message';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton } from '@angular/material/button';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-message-dialog',
  templateUrl: './error-message-dialog.component.html',
  styleUrls: ['./error-message-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatIcon,
    MatDialogContent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    RouterLink,
    RouterLinkActive,
  ],
})
export class ErrorMessageDialogComponent {
  displayedColumns: string[] = ['field', 'message'];

  constructor(@Inject(MAT_DIALOG_DATA) public error: ErrorResult) {}

  static getErrorDialogRedirect(error, message) {
    return {
      maxWidth: '40vw',
      minHeight: '30vh',
      panelClass: 'app-submit-notification-dialog-panel',
      disableClose: true,
      data: {
        type: MessageType.ERROR,
        title: 'Fehler:',
        message: message,
        messageDetails: error.error ? error?.error?.message : error.message,
        statusCode: error.error ? error?.error?.statusCode : null,
        validationErrors: error.error ? error.error?.validationErrors : null,
        actions: [{ value: 'home', label: 'Zurück zur Hauptseite' }],
      } as DialogNotificationData,
    };
  }

  static getErrorDialogClose(details: { title: string; message: string; messageDetails?: string; type: MessageType; error? }) {
    return {
      maxWidth: '40vw',
      minHeight: '20vh',
      panelClass: 'app-close-notification-dialog-panel',
      disableClose: true,
      data: {
        type: details.type,
        title: details.title,
        message: details.message,
        messageDetails: details.messageDetails ? details.messageDetails : details.error?.error ? details.error?.error?.message : details.error?.message,
        statusCode: details.error?.error ? details.error?.error?.statusCode : null,
        validationErrors: details.error?.error ? details.error.error?.validationErrors : null,
        actions: [{ value: 'close', label: 'Schließen' }],
      } as DialogNotificationData,
    };
  }

  isError(messageType: MessageType) {
    return messageType === MessageType.ERROR;
  }
}
