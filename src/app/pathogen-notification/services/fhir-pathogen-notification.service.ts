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

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable, of } from 'rxjs';
import { CodeDisplay, PathogenData, PathogenTest } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { toFhirDateFormat } from '../legacy/common-utils';

import { SubmitNotificationDialogComponent } from '../legacy/dialogs/submit-notification-dialog/submit-notification-dialog.component';
import { FhirNotificationService } from '../legacy/services/fhir-notification.service';
import { catchError } from 'rxjs/operators';
import { ErrorDialogService } from './error-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { cloneObject } from '@gematik/demis-portal-core-library';
import { isNonNominalNotificationEnabled } from '../utils/pathogen-notification-mapper';
import { NotificationType } from '../common/routing-helper';

@Injectable({
  providedIn: 'root',
})
export class FhirPathogenNotificationService extends FhirNotificationService {
  protected http: HttpClient;
  protected override logger: NGXLogger;
  private readonly errorDialogService = inject(ErrorDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly futsHeaders = environment.futsHeaders;

  constructor() {
    const http = inject(HttpClient);
    const logger = inject(NGXLogger);

    super(http, logger);

    this.http = http;
    this.logger = logger;
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

  override sendNotification(notification: PathogenTest, type: NotificationType) {
    let clonedNotificationObject: PathogenTest = cloneObject(notification);

    clonedNotificationObject = this.removeUnusedFormlyFields(clonedNotificationObject);
    if (!environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER) {
      clonedNotificationObject = FhirPathogenNotificationService.setFhirSpecificsDateFormat(clonedNotificationObject);
    }
    return super.sendNotification(clonedNotificationObject, type);
  }

  private removeUnusedFormlyFields(testResults: PathogenTest) {
    delete testResults.notificationCategory['federalStateCodeDisplay'];
    delete testResults.notificationCategory['pathogenDisplay'];
    delete testResults.submittingFacility['copyAddressCheckBox'];
    return testResults;
  }
}
