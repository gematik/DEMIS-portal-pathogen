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

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { finalize, Observable, of } from 'rxjs';
import { CodeDisplay, PathogenData, PathogenTest, ValidationError } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { ErrorDialogService } from './error-dialog.service';
import { cloneObject, ErrorMessage, MessageDialogService, SubmitDialogProps, trimStrings } from '@gematik/demis-portal-core-library';
import { NotificationType } from '../common/routing-helper';
import { FileService } from '../legacy/services/file.service';
import { isFollowUpNotification, isNonNominalNotification } from '../utils/pathogen-notification-mapper';

@Injectable({
  providedIn: 'root',
})
export class FhirPathogenNotificationService {
  protected httpClient: HttpClient;
  protected logger: NGXLogger;
  private readonly errorDialogService = inject(ErrorDialogService);
  private readonly futsHeaders = environment.futsHeaders;
  private readonly messageDialogService = inject(MessageDialogService);
  private readonly fileService = inject(FileService);
  private readonly ngZone = inject(NgZone); // ensure we can force change detection

  constructor() {
    const http = inject(HttpClient);
    const logger = inject(NGXLogger);

    this.httpClient = http;
    this.logger = logger;
  }

  private static getEnvironmentHeaders(): HttpHeaders {
    return environment.headers;
  }

  fetchDiagnosticsBasedOnPathogenSelection(pathogenCode: string, type: NotificationType): Observable<PathogenData> {
    let path: string;
    switch (type) {
      case NotificationType.NonNominalNotification7_3:
        path = `${environment.laboratoryDataForSpecificCode_7_3}${pathogenCode}`;
        break;
      case NotificationType.NominalNotification7_1:
        path = `${environment.laboratoryDataForSpecificCode_7_1}${pathogenCode}`;
        break;
      default:
        path = `${environment.notificationCategoriesForSpecificCodeDefault}${pathogenCode}`;
    }
    return this.httpClient
      .get<PathogenData>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching diagnostic', error);
          this.errorDialogService.showBasicClosableErrorDialog(
            'Aktuell kann dieser Meldetatbestand nicht über das Portal gemeldet werden.' +
              ' Bitte senden Sie die Meldung z.B. per Fax an das zuständige Gesundheitsamt.',
            'Fehler bei der Abfrage des ausgewählten Erregers'
          );
          throw error;
        })
      );
  }

  fetchPathogenCodeDisplaysByTypeAndState(type: NotificationType, federalStateCode?: string): Observable<CodeDisplay[]> {
    if (isFollowUpNotification(type)) {
      // only §7.1 nominal needs federal states
      return of([]);
    }
    const pathToCodeDisplaysByNotificationType = this.getCodeDisplaysByNotificationType(type, federalStateCode);
    return this.httpClient
      .get<CodeDisplay[]>(pathToCodeDisplaysByNotificationType, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          const federalStateInfo = federalStateCode ? ` and federal state: ${federalStateCode}` : '';
          this.logger.error(`Error fetching pathogen code displays for notification type ${type}${federalStateInfo}`, error);
          this.errorDialogService.showBasicErrorDialogWithRedirect(error, 'Meldetatbestände konnten nicht abgerufen werden.');
          throw error;
        })
      );
  }

  private getCodeDisplaysByNotificationType(type: NotificationType, federalStateCode: string) {
    switch (type) {
      case NotificationType.NonNominalNotification7_3:
      case NotificationType.AnonymousNotification7_3:
        return environment.notificationCategories_7_3;
      default:
        return `${environment.notificationCategoriesForFederalState_7_1}${federalStateCode}`;
    }
  }

  fetchAllPathogenCodeDisplays(paragraph: '7.1' | '7.3'): Observable<CodeDisplay[]> {
    const path = paragraph === '7.1' ? environment.notificationCategories_7_1 : environment.notificationCategories_7_3;
    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error(`Error fetching §${paragraph} pathogen code displays`, error);
          this.errorDialogService.showBasicErrorDialogWithRedirect(error, `§${paragraph} Meldetatbestände konnten nicht abgerufen werden.`);
          throw error;
        })
      );
  }

  fetchFederalStateCodeDisplays = (type: NotificationType): Observable<CodeDisplay[]> => {
    if (type !== NotificationType.NominalNotification7_1) {
      return of([]);
    }
    const path = environment.pathToFederalStates_7_1;
    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching federal state code displays', error);
          this.errorDialogService.showBasicErrorDialogWithRedirect(error, 'Bundesländer konnten nicht abgerufen werden.');
          throw error;
        })
      );
  };

  fetchCountryCodeDisplays = (): Observable<CodeDisplay[]> => {
    const path = environment.countryCodes;
    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching country code displays', error);
          this.errorDialogService.showBasicErrorDialogWithRedirect(error, 'Ländercodes konnten nicht abgerufen werden.');
          throw error;
        })
      );
  };

  fetchFollowUpCode = (notificationCategory: string, notificationType: NotificationType): Observable<CodeDisplay[]> => {
    const is7_1 = notificationType === NotificationType.FollowUpNotification7_1;
    const path = is7_1
      ? `${environment.notificationCategory_FollowUp_7_1}${notificationCategory}`
      : `${environment.notificationCategory_FollowUp_7_3}${notificationCategory}`;

    const paragraph = isNonNominalNotification(notificationType) ? '§ 7 Abs. 3 IfSG' : '§ 7 Abs. 1 IfSG';
    const errorMessage = `Diese Meldekategorie wird für diese Meldungsart nicht unterstützt. Bitte stellen Sie sicher, dass Sie auf eine Meldung nach ${paragraph} referenzieren.`;

    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching follow up code', error);
          this.errorDialogService.showBasicErrorDialogWithRedirect(errorMessage, 'Fehler');
          throw error;
        })
      );
  };

  submitNotification(notification: PathogenTest, notificationType: NotificationType) {
    this.ngZone.run(() => this.messageDialogService.showSpinnerDialog({ message: 'Meldung wird gesendet' }));
    notification = this.prepareNotification(notification);
    const fullUrl = this.getNotificationUrl(notificationType);
    this.httpClient
      .post(fullUrl, JSON.stringify(notification), {
        headers: FhirPathogenNotificationService.getEnvironmentHeaders(),
        observe: 'response',
      })
      //DEMIS-4242, ngZone fixes issue where change detection didn't work for 7.3 notifications
      .pipe(
        finalize(() => {
          this.ngZone.run(() => this.messageDialogService.closeSpinnerDialog());
        })
      )
      .subscribe({
        next: (response: HttpResponse<any>) => {
          this.ngZone.run(() => {
            const submitDialogData: SubmitDialogProps = this.createSubmitDialogData(response, notification, notificationType);
            this.messageDialogService.showSubmitDialog(submitDialogData);
          });
        },
        error: err => {
          this.ngZone.run(() => {
            this.logger.error('error', err);
            const errors = this.extractErrorDetails(err);
            this.messageDialogService.showErrorDialog({
              errorTitle: 'Meldung konnte nicht zugestellt werden!',
              errors,
              logFilteringEnabled: environment.featureFlags?.FEATURE_FLAG_PORTAL_ERROR_DIALOG_FILTERING,
            });
          });
        },
      });
  }

  private prepareNotification(notification: PathogenTest): PathogenTest {
    const trimmedNotification: PathogenTest = trimStrings(notification);
    let clonedNotificationObject: PathogenTest = cloneObject(trimmedNotification);
    clonedNotificationObject = this.removeUnusedFormlyFields(clonedNotificationObject);

    return clonedNotificationObject;
  }

  private createSubmitDialogData(response: HttpResponse<any>, notification: PathogenTest, notificationType: NotificationType): SubmitDialogProps {
    const content = encodeURIComponent(response.body.content);
    const href = 'data:application/octet-stream;base64,' + content;
    return {
      authorEmail: response.body.authorEmail,
      fileName: this.fileService.getFileNameByNotificationType(notification, notificationType, response.body.notificationId),
      href: href,
      notificationId: response.body.notificationId,
      timestamp: response.body.timestamp,
    };
  }

  private extractErrorDetails(err: any): ErrorMessage[] {
    const response = err?.error ?? err;
    const errorMessage = this.messageDialogService.extractMessageFromError(response);
    const validationErrors = response?.validationErrors || [];
    if (validationErrors.length > 0) {
      return validationErrors.map((ve: ValidationError) => ({
        text: ve.message,
        queryString: ve.message || '',
        severity: ve.severity,
      }));
    } else {
      return [
        {
          text: errorMessage,
          queryString: errorMessage || '',
        },
      ];
    }
  }

  private removeUnusedFormlyFields(testResults: PathogenTest) {
    delete testResults.notificationCategory['federalStateCodeDisplay'];
    delete testResults.notificationCategory['pathogenDisplay'];
    delete testResults.submittingFacility['copyAddressCheckBox'];
    return testResults;
  }

  getNotificationUrl(type: NotificationType): string {
    const pathToGateway = environment.pathToGateway;

    switch (type) {
      case NotificationType.NominalNotification7_1:
      case NotificationType.FollowUpNotification7_1:
        return pathToGateway + environment.pathToPathogen_7_1;
      case NotificationType.NonNominalNotification7_3:
      case NotificationType.FollowUpNotification7_3:
        return pathToGateway + environment.pathToPathogen_7_3_nonNominal;
      case NotificationType.AnonymousNotification7_3:
        return pathToGateway + environment.pathToPathogen_7_3_anonymous;

      default:
        return pathToGateway + environment.pathToPathogen;
    }
  }
}
