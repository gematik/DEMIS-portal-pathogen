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
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { PathogenTest } from '../../../../api/notification';
import { trimStrings } from '@gematik/demis-portal-core-library';
import { environment } from '../../../../environments/environment';
import { isNonNominalNotificationEnabled } from '../../utils/pathogen-notification-mapper';
import { NotificationType } from '../../common/routing-helper';

/**
 * @deprecated Can be removed as soon as feature flag "FEATURE_FLAG_PORTAL_SUBMIT" is active on all stages
 */
@Injectable({
  providedIn: 'root',
})
export abstract class FhirNotificationService {
  url: string;

  constructor(
    protected httpClient: HttpClient,
    protected logger: NGXLogger
  ) {
    this.url = environment.pathToGateway;
  }

  private static getHeaders(): HttpHeaders {
    return environment.headers;
  }

  /**
   * @deprecated Use {@link submitNotification} instead, once FEATURE_FLAG_PORTAL_SUBMIT will be removed
   */
  sendNotification(notification: PathogenTest, notificationType: NotificationType) {
    // https://service.gematik.de/browse/DSC2-4453  Anforderung 2
    const trimmedNotification: PathogenTest = trimStrings(notification);

    return this.confirmSendPathogenNotification(trimmedNotification, notificationType);
  }

  getNotificationUrl(type: NotificationType): string {
    if (!isNonNominalNotificationEnabled()) {
      return this.url + environment.pathToPathogen;
    }
    switch (type) {
      case NotificationType.NonNominalNotification7_3:
        return this.url + environment.pathToPathogen_7_3_nonNominal;
      case NotificationType.NominalNotification7_1:
        return this.url + environment.pathToPathogen_7_1;
      default:
        return this.url + environment.pathToPathogen;
    }
  }

  /**
   * @deprecated Use {@link submitNotification} instead, once FEATURE_FLAG_PORTAL_SUBMIT will be removed
   */
  private confirmSendPathogenNotification(pathogenTest: PathogenTest, notificationType: NotificationType): Observable<HttpResponse<any>> {
    let fullUrl = this.getNotificationUrl(notificationType);
    return this.httpClient.post(fullUrl, JSON.stringify(pathogenTest), {
      headers: FhirNotificationService.getHeaders(),
      observe: 'response',
    });
  }
}
