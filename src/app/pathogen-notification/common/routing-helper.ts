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

export enum NotificationType {
  NominalNotification7_1,
  NonNominalNotification7_3,
  AnonymousNotification7_3,
}

interface AllowedRoutes {
  [key: string]: string;
}

export const allowedRoutes: AllowedRoutes = {
  nominal: 'pathogen-notification/7_1',
  nonNominal: 'pathogen-notification/7_3/non-nominal',
  anonymous: 'pathogen-notification/7_3/anonymous',
  main: 'pathogen-notification',
};

export const getNotificationTypeByRouterUrl = (url: string): NotificationType => {
  if (url.includes(allowedRoutes.nonNominal)) {
    return NotificationType.NonNominalNotification7_3;
  } else {
    return NotificationType.NominalNotification7_1;
  }
};
