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
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { CodeDisplay, Notification, PathogenData, PathogenTest } from '../../../api/notification';
import { environment } from '../../../environments/environment';
import { toFhirDateFormat } from '../legacy/common-utils';

import { SubmitNotificationDialogComponent } from '../legacy/dialogs/submit-notification-dialog/submit-notification-dialog.component';
import { FhirNotificationService } from '../legacy/services/fhir-notification.service';
import { catchError } from 'rxjs/operators';
import { ErrorDialogService } from './error-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { cloneObject, MessageDialogService } from '@gematik/demis-portal-core-library';
import NotificationTypeEnum = Notification.NotificationTypeEnum;

@Injectable({
  providedIn: 'root',
})
export class FhirPathogenNotificationService extends FhirNotificationService {
  constructor(
    protected http: HttpClient,
    protected override logger: NGXLogger,
    private errorDialogService: ErrorDialogService,
    private messageDialogService: MessageDialogService,
    private dialog: MatDialog
  ) {
    super(http, logger);
  }

  private static setFhirSpecificsDateFormat(testResults: PathogenTest): PathogenTest {
    if (!!testResults?.notifiedPerson?.info?.birthDate) {
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

  fetchDiagnosticsBasedOnPathogenSelection(PathogenCode: string): Observable<PathogenData> {
    const path = `${environment.pathToFuts}/laboratory/federalState/pathogenData/${PathogenCode}`;
    return this.httpClient
      .get<PathogenData>(path, {
        headers: environment.headers,
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

  fetchPathogenCodeDisplaysForFederalState(federalStateCode: string): Observable<CodeDisplay[]> {
    const path = `${environment.pathToFuts}/laboratory/federalState/${federalStateCode}`;
    return this.httpClient
      .get<CodeDisplay[]>(path, {
        headers: environment.headers,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching pathogen code displays', error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, 'Meldetatbestände konnten nicht abgerufen werden.');
          throw error;
        })
      );
  }

  fetchFederalStateCodeDisplays = (): Observable<Array<CodeDisplay>> => {
    const path = `${environment.pathToFuts}/laboratory/federalStates`;
    return this.httpClient
      .get<Array<CodeDisplay>>(path, {
        headers: environment.headers,
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
    const path = `${environment.pathToFuts}/utils/countryCodes`;
    return this.httpClient
      .get<Array<CodeDisplay>>(path, {
        headers: environment.headers,
      })
      .pipe(
        catchError(error => {
          this.logger.error('Error fetching country code displays', error);
          this.errorDialogService.openErrorDialogAndRedirectToHome(error, 'Ländercodes konnten nicht abgerufen werden.');
          throw error;
        })
      );
  };

  openSubmitDialog(pathogenTest: PathogenTest): void {
    this.dialog.open(SubmitNotificationDialogComponent, {
      disableClose: true,
      maxWidth: '50vw',
      minHeight: '40vh',
      panelClass: 'app-submit-notification-dialog-panel',
      data: {
        notification: {
          notificationType: NotificationTypeEnum.PathogenTest,
          pathogenTest: pathogenTest,
        } as Notification,
        fhirService: this,
      },
    });
  }

  override sendNotification(notification: Notification) {
    let clonedNotificationObject: Notification = cloneObject(notification);

    clonedNotificationObject.pathogenTest = this.removeUnusedFormlyFields(clonedNotificationObject.pathogenTest);
    clonedNotificationObject.pathogenTest = FhirPathogenNotificationService.setFhirSpecificsDateFormat(clonedNotificationObject.pathogenTest);

    return super.sendNotification(clonedNotificationObject);
  }

  private removeUnusedFormlyFields(testResults: PathogenTest) {
    delete testResults.notificationCategory['federalStateCodeDisplay'];
    delete testResults.notificationCategory['pathogenDisplay'];
    delete testResults.submittingFacility['copyAddressCheckBox'];
    return testResults;
  }
}
