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
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { finalize, Observable, of } from 'rxjs';
import { CodeDisplay, PathogenData, PathogenTest, ValidationError } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { toFhirDateFormat } from '../legacy/common-utils';
import { catchError } from 'rxjs/operators';
import { ErrorDialogService } from './error-dialog.service';
import { cloneObject, MessageDialogService, SubmitDialogProps, trimStrings } from '@gematik/demis-portal-core-library';
import { isNonNominalNotificationEnabled } from '../utils/pathogen-notification-mapper';
import { NotificationType } from '../common/routing-helper';
import { FileService } from '../legacy/services/file.service';

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
    if (isNonNominalNotificationEnabled()) {
      switch (type) {
        case NotificationType.NonNominalNotification7_3:
          path = `${environment.laboratoryDataForSpecificCode_7_3}${pathogenCode}`;
          break;
        case NotificationType.NominalNotification7_1:
          path = `${environment.laboratoryDataForSpecificCode_7_1}${pathogenCode}`;
          break;
        default:
          path = `${environment.laboratoryDataForSpecificCode_7_1}${pathogenCode}`;
      }
    } else {
      path = `${environment.pathToFuts}/laboratory/federalState/pathogenData/${pathogenCode}`;
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
    let path: string;
    if (isNonNominalNotificationEnabled()) {
      switch (type) {
        case NotificationType.NonNominalNotification7_3:
          path = environment.notificationCategories_7_3;
          break;
        case NotificationType.NominalNotification7_1:
          path = `${environment.notificationCategoriesForFederalState_7_1}${federalStateCode}`;
          break;
        default:
          path = `${environment.notificationCategoriesForFederalState_7_1}${federalStateCode}`;
      }
    } else {
      path = `${environment.pathToFuts}/laboratory/federalState/${federalStateCode}`;
    }
    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          const federalStateInfo = federalStateCode ? ` and federal state: ${federalStateCode}` : '';
          this.logger.error(`Error fetching pathogen code displays for notification type ${type}${federalStateInfo}`, error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, 'Meldetatbestände konnten nicht abgerufen werden.');
          throw error;
        })
      );
  }

  fetchAllPathogenCodeDisplays7_1(): Observable<CodeDisplay[]> {
    const path = `${environment.pathToFuts}/laboratory/7.1`;
    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching §7.1 pathogen code displays', error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, '§7.1 Meldetatbestände konnten nicht abgerufen werden.');
          throw error;
        })
      );
  }

  fetchFederalStateCodeDisplays = (type: NotificationType): Observable<Array<CodeDisplay>> => {
    if (type === NotificationType.NonNominalNotification7_3) {
      return of([]);
    }
    let path = environment.pathToFederalStates_7_1;
    if (!isNonNominalNotificationEnabled()) {
      path = `${environment.pathToFuts}/laboratory/federalStates`;
    }
    return this.httpClient
      .get<Array<CodeDisplay>>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching federal state code displays', error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, 'Bundesländer konnten nicht abgerufen werden.');
          throw error;
        })
      );
  };

  fetchCountryCodeDisplays = (): Observable<Array<CodeDisplay>> => {
    const path = environment.countryCodes;
    return this.httpClient
      .get<Array<CodeDisplay>>(path, {
        headers: this.futsHeaders,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching country code displays', error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, 'Ländercodes konnten nicht abgerufen werden.');
          throw error;
        })
      );
  };

  submitNotification(notification: PathogenTest, notificationType: NotificationType) {
    this.messageDialogService.showSpinnerDialog({ message: 'Meldung wird gesendet' });

    notification = this.prepareNotification(notification);
    let fullUrl = this.getNotificationUrl(notificationType);
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

  private extractErrorDetails(err: any): { text: string; queryString: string }[] {
    const response = err?.error ?? err;
    const errorMessage = this.messageDialogService.extractMessageFromError(response);
    const validationErrors = response?.validationErrors || [];
    if (validationErrors.length > 0) {
      return validationErrors.map((ve: ValidationError) => ({
        text: ve.message,
        queryString: ve.message || '',
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
    const url = environment.pathToGateway;

    if (!isNonNominalNotificationEnabled()) {
      return url + environment.pathToPathogen;
    }
    switch (type) {
      case NotificationType.NonNominalNotification7_3:
        return url + environment.pathToPathogen_7_3_nonNominal;
      case NotificationType.NominalNotification7_1:
        return url + environment.pathToPathogen_7_1;
      default:
        return url + environment.pathToPathogen;
    }
  }
}
