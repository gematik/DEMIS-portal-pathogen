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

import { Component, ChangeDetectorRef, SecurityContext, TemplateRef, ViewChild, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';
import { OkResponse, PathogenTest, ValidationError } from 'src/api/notification';
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
import { NotificationType } from '../../../common/routing-helper';
import { environment } from '../../../../../environments/environment';
import { MessageDialogService } from '@gematik/demis-portal-core-library';

export interface SubmitNotificationDialogData {
  notification: PathogenTest;
  fhirService: FhirNotificationService;
  notificationType: NotificationType;
}

/**
 * @deprecated Can be removed as soon as feature flag "FEATURE_FLAG_PORTAL_SUBMIT" is active on all stages
 */
@Component({
  selector: 'app-submit-notification-dialog',
  templateUrl: './submit-notification-dialog.component.html',
  styleUrls: ['./submit-notification-dialog.component.scss'],
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
export class SubmitNotificationDialogComponent {
  protected fileService = inject(FileService);
  private readonly sanitizer = inject(DomSanitizer);
  data = inject<SubmitNotificationDialogData>(MAT_DIALOG_DATA);
  private readonly logger = inject(NGXLogger);
  private readonly router = inject(Router);

  @ViewChild('progress', { static: true }) progressTemplate?: TemplateRef<any>;
  @ViewChild('responseSuccess', { static: true })
  responseSuccessTemplate?: TemplateRef<any>;
  @ViewChild('responseFail', { static: true })
  responseFailTemplate?: TemplateRef<any>;

  notification!: PathogenTest;
  activeTemplate?: TemplateRef<any>;
  result: SuccessResult | ErrorResult | null = null;
  pdfDownload?: SafeUrl;
  displayedColumns: string[] = ['field', 'message'];
  fileName?: string;
  notificationType: NotificationType;
  dialogRef = inject(MatDialogRef<SubmitNotificationDialogComponent>);
  messageDialogService = inject(MessageDialogService);

  constructor(private readonly cdr: ChangeDetectorRef) {
    // Hotfix for DEMIS-3774s
    // TODO fix finally with DEMIS-2758
    setTimeout(() => {
      this.initialize();
    });
  }

  initialize() {
    this.notification = { ...this.data.notification };
    this.notificationType = this.data.notificationType;
    this.activeTemplate = this.progressTemplate;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.submitNotification();
  }

  submitNotification() {
    this.data.fhirService.sendNotification(this.notification, this.notificationType).subscribe({
      next: response => {
        const content = encodeURIComponent(response.body.content);
        const href = 'data:application/octet-stream;base64,' + content;
        this.pdfDownload = this.sanitizer.bypassSecurityTrustUrl(href);
        if (response.body.status === 'All OK') {
          this.fileName = this.fileService.getFileNameByNotificationType(this.notification, this.notificationType, response.body?.notificationId);
          this.triggerDownload(href);
          this.buildSuccessResult(response.body);
          this.activeTemplate = this.responseSuccessTemplate;
          this.cdr.detectChanges();
        } else {
          this.setResultToError(response);
          this.activeTemplate = this.responseFailTemplate;
          this.cdr.detectChanges();
        }
      },
      error: error => {
        this.logger.error('error', error);
        this.setResultToError(error.error);
        this.activeTemplate = this.responseFailTemplate;
        this.cdr.detectChanges();
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
    if (environment.featureFlags?.FEATURE_FLAG_PORTAL_ERROR_DIALOG_ON_SUBMIT) {
      const errorMessage = this.messageDialogService.extractMessageFromError(response);
      this.dialogRef.close(); //closes the underlying dialog "Meldung wird gesendet"
      const validationErrors = response.validationErrors || [];
      let errors;
      if (validationErrors.length > 0) {
        errors = validationErrors.map((ve: ValidationError) => ({
          text: ve.message,
          queryString: ve.message || '',
        }));
      } else {
        errors = [
          {
            text: errorMessage,
            queryString: errorMessage || '',
          },
        ];
      }

      this.messageDialogService.showErrorDialog({
        errorTitle: 'Meldung konnte nicht zugestellt werden!',
        errors,
      });
    } else {
      this.result = {
        type: MessageType.ERROR,
        message: 'Es ist ein Fehler aufgetreten.',
        messageDetails: response?.message,
        locations: [],
        validationErrors: response?.validationErrors,
      } as ErrorResult;
    }
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
