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

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { finalize, Observable, of } from 'rxjs';
import { CodeDisplay, PathogenData, PathogenTest, ValidationError } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { toFhirDateFormat } from '../legacy/common-utils';

import { SubmitNotificationDialogComponent } from '../legacy/dialogs/submit-notification-dialog/submit-notification-dialog.component';
import { FhirNotificationService } from '../legacy/services/fhir-notification.service';
import { catchError } from 'rxjs/operators';
import { ErrorDialogService } from './error-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { cloneObject, MessageDialogService, SubmitDialogProps, trimStrings } from '@gematik/demis-portal-core-library';
import { isNonNominalNotificationEnabled } from '../utils/pathogen-notification-mapper';
import { NotificationType } from '../common/routing-helper';
import { FileService } from '../legacy/services/file.service';

@Injectable({
  providedIn: 'root',
})
export class FhirPathogenNotificationService extends FhirNotificationService {
  protected http: HttpClient;
  protected override logger: NGXLogger;
  private readonly errorDialogService = inject(ErrorDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly futsHeaders = environment.futsHeaders;
  private readonly messageDialogService = inject(MessageDialogService);
  private readonly fileService = inject(FileService);

  constructor() {
    const http = inject(HttpClient);
    const logger = inject(NGXLogger);

    super(http, logger);

    this.http = http;
    this.logger = logger;
  }

  private static getEnvironmentHeaders(): HttpHeaders {
    return environment.headers;
  }

  private static setFhirSpecificsDateFormat(testResults: PathogenTest): PathogenTest {
    if (testResults?.notifiedPerson?.info?.birthDate) {
      testResults.notifiedPerson.info.birthDate = toFhirDateFormat(testResults.notifiedPerson.info.birthDate);
    }
    if (testResults?.pathogenDTO?.specimenList?.length > 0) {
      for (let specimen of testResults.pathogenDTO.specimenList) {
        specimen.receivedDate = toFhirDateFormat(specimen.receivedDate);
        if (specimen.extractionDate) {
          specimen.extractionDate = toFhirDateFormat(specimen.extractionDate);
        }
      }
    }
    return testResults;
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

  fetchPathogenCodeDisplays(type: NotificationType, federalStateCode?: string): Observable<CodeDisplay[]> {
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
          this.logger.error('Error fetching pathogen code displays', error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, 'Meldetatbestände konnten nicht abgerufen werden.');
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

  /**
   * @deprecated Use {@link submitNotification} instead, once FEATURE_FLAG_PORTAL_SUBMIT will be removed
   */
  openSubmitDialog(pathogenTest: PathogenTest, notificationType: NotificationType): void {
    this.dialog.open(SubmitNotificationDialogComponent, {
      disableClose: true,
      maxWidth: '50vw',
      minHeight: '40vh',
      panelClass: 'app-submit-notification-dialog-panel',
      data: {
        notification: pathogenTest,
        fhirService: this,
        notificationType: notificationType,
      },
    });
  }

  submitNotification(notification: PathogenTest, notificationType: NotificationType) {
    this.messageDialogService.showSpinnerDialog({ message: 'Meldung wird gesendet' });

    notification = this.prepareNotification(notification);
    let fullUrl = this.getNotificationUrl(notificationType);
    this.httpClient
      .post(fullUrl, JSON.stringify(notification), {
        headers: FhirPathogenNotificationService.getEnvironmentHeaders(),
        observe: 'response',
      })
      .pipe(
        finalize(() => {
          this.messageDialogService.closeSpinnerDialog();
        })
      )
      .subscribe({
        next: (response: HttpResponse<any>) => {
          const submitDialogData: SubmitDialogProps = this.createSubmitDialogData(response, notification, notificationType);
          this.messageDialogService.showSubmitDialog(submitDialogData);
        },
        error: err => {
          this.logger.error('error', err);
          const errors = this.extractErrorDetails(err);
          this.messageDialogService.showErrorDialog({
            errorTitle: 'Meldung konnte nicht zugestellt werden!',
            errors,
          });
        },
      });
  }

  private prepareNotification(notification: PathogenTest): PathogenTest {
    const trimmedNotification: PathogenTest = trimStrings(notification);
    let clonedNotificationObject: PathogenTest = cloneObject(trimmedNotification);
    clonedNotificationObject = this.removeUnusedFormlyFields(clonedNotificationObject);

    if (!environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER) {
      clonedNotificationObject = FhirPathogenNotificationService.setFhirSpecificsDateFormat(clonedNotificationObject);
    }
    return clonedNotificationObject;
  }

  private createSubmitDialogData(response: HttpResponse<any>, notification: PathogenTest, notificationType: NotificationType): SubmitDialogProps {
    const content = encodeURIComponent(response.body.content);
    const href = 'data:application/actet-stream;base64,' + content;
    return {
      authorEmail: response.body.authorEmail,
      fileName: this.fileService.getFileNameByNotificationType(notification, notificationType, response.body.notificationId),
      href: href,
      notificationId: response.body.notificationId,
      timestamp: response.body.timestamp,
    };
  }

  override sendNotification(notification: PathogenTest, type: NotificationType) {
    let clonedNotificationObject: PathogenTest = cloneObject(notification);

    clonedNotificationObject = this.removeUnusedFormlyFields(clonedNotificationObject);
    if (!environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER) {
      clonedNotificationObject = FhirPathogenNotificationService.setFhirSpecificsDateFormat(clonedNotificationObject);
    }
    return super.sendNotification(clonedNotificationObject, type);
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
}
