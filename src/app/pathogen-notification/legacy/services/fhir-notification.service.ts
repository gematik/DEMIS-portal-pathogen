/*
 Copyright (c) 2025 gematik GmbH
 Licensed under the EUPL, Version 1.2 or - as soon they will be approved by
 the European Commission - subsequent versions of the EUPL (the "Licence");
 You may not use this work except in compliance with the Licence.
    You may obtain a copy of the Licence at:
    https://joinup.ec.europa.eu/software/page/eupl
        Unless required by applicable law or agreed to in writing, software
 distributed under the Licence is distributed on an "AS IS" basis,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the Licence for the specific language governing permissions and
 limitations under the Licence.
 */

import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
import { Notification, PathogenTest } from '../../../../api/notification';
import { trimStrings } from '@gematik/demis-portal-core-library';
import { environment } from '../../../../environments/environment';
import NotificationTypeEnum = Notification.NotificationTypeEnum;

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

  sendBundle(bundle: any) {
    return this.httpClient.post(this.url, bundle, {
      headers: FhirNotificationService.getHeaders(),
      observe: 'response',
    });
  }

  sendNotification(notification: Notification) {
    // https://service.gematik.de/browse/DSC2-4453  Anforderung 2
    const trimmedNotification: Notification = trimStrings(notification);

    if (trimmedNotification.notificationType === NotificationTypeEnum.PathogenTest) {
      return this.confirmSendPathogenNotification(trimmedNotification.pathogenTest);
    } else {
      this.logger.error('Unbekannter Meldungstyp: ', trimmedNotification);
      throw new Error('Unknown notification type: ' + JSON.stringify(trimmedNotification));
    }
  }

  private confirmSendPathogenNotification(pathogenTest: PathogenTest): Observable<HttpResponse<any>> {
    const fullUrl = this.url + environment.pathToPathogen;
    return this.httpClient.post(fullUrl, JSON.stringify(pathogenTest), {
      headers: FhirNotificationService.getHeaders(),
      observe: 'response',
    });
  }
}
