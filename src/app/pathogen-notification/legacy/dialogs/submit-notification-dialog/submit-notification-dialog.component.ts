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

import { Component, Inject, OnInit, SecurityContext, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';
import { Notification, OkResponse } from 'src/api/notification';
import { ErrorResult, MessageType, SuccessResult } from '../../models/ui/message';
import { FhirNotificationService } from '../../services/fhir-notification.service';
import { FileService } from '../../services/file.service';
import { Router } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
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
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export interface SubmitNotificationDialogData {
  notification: Notification;
  fhirService: FhirNotificationService;
}

@Component({
  selector: 'app-submit-notification-dialog',
  templateUrl: './submit-notification-dialog.component.html',
  styleUrls: ['./submit-notification-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatProgressSpinner,
    MatIcon,
    MatDialogActions,
    MatButton,
    MatDialogClose,
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
    NgTemplateOutlet,
  ],
})
export class SubmitNotificationDialogComponent implements OnInit {
  @ViewChild('progress', { static: true }) progressTemplate?: TemplateRef<any>;
  @ViewChild('responseSuccess', { static: true })
  responseSuccessTemplate?: TemplateRef<any>;
  @ViewChild('responseFail', { static: true })
  responseFailTemplate?: TemplateRef<any>;

  notification!: Notification;
  activeTemplate?: TemplateRef<any>;
  result: SuccessResult | ErrorResult | null = null;
  pdfDownload?: SafeUrl;
  displayedColumns: string[] = ['field', 'message'];
  fileName?: string;

  constructor(
    protected fileService: FileService,
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: SubmitNotificationDialogData,
    private logger: NGXLogger,
    private router: Router
  ) {}

  ngOnInit() {
    this.notification = { ...this.data.notification };
    this.submitNotification();
  }

  submitNotification() {
    this.activeTemplate = this.progressTemplate;
    this.data.fhirService.sendNotification(this.notification).subscribe({
      next: response => {
        const content = encodeURIComponent(response.body.content);
        const href = 'data:application/actet-stream;base64,' + content;
        this.pdfDownload = this.sanitizer.bypassSecurityTrustUrl(href);
        if (response.body.status === 'All OK') {
          this.fileName = this.fileService.getFileNameByNotificationType(this.notification);
          this.triggerDownload(href);
          this.buildSuccessResult(response.body);
          this.activeTemplate = this.responseSuccessTemplate;
        } else {
          this.setResultToError(response);
          this.activeTemplate = this.responseFailTemplate;
        }
      },
      error: error => {
        this.logger.error('error', error);
        this.setResultToError(error.error);
        this.activeTemplate = this.responseFailTemplate;
      },
      complete: () => {
        this.logger.log('complete');
      },
    });
  }

  private buildSuccessResult(response: OkResponse) {
    this.result = {
      type: MessageType.SUCCESS,
      status: response.status,
      timestamp: response.timestamp,
      authorName: response.authorName,
      authorEmail: response.authorEmail,
      receiptContentType: response.contentType,
      receiptContent: response.content,
      message: response.title,
      notificationId: response.notificationId,
    } as SuccessResult;
  }

  private setResultToError(response: any) {
    this.result = {
      type: MessageType.ERROR,
      message: 'Es ist ein Fehler aufgetreten.',
      messageDetails: response?.message,
      locations: [],
      validationErrors: response?.validationErrors,
    } as ErrorResult;
  }

  private triggerDownload(url: string) {
    const downloadLink = document.createElement('a');
    const href: string | null = this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, this.sanitizer.bypassSecurityTrustResourceUrl(url));
    if (href && this.fileName) {
      downloadLink.href = href;
      downloadLink.download = this.fileName;
      downloadLink.click();
    }
  }

  navigateToWelcomePage() {
    // workaround because routerLink="/" didn't work, fix if better solution is found
    this.router.navigate(['']).then(() => this.router.navigate(['/welcome']));
  }
}
