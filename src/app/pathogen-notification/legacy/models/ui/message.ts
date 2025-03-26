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

export interface SuccessResult extends DialogNotificationData {
  receiptContentType: string;
  receiptContent: string;
  authorName: string;
  authorEmail: string;
  timestamp: string;
  status: string;
  notificationId: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export enum MessageType {
  INFO = 'Info',
  ERROR = 'Fehler',
  WARNING = 'Warnung',
  SUCCESS = 'Erfolg',
}

export interface DialogNotificationData {
  type?: MessageType;
  title?: string;
  message: string;
  path?: string;
  statusCode?: string;
  messageDetails?: string;
  locations?: string[];
  actions?: { value: any; label: string }[];
}

export interface ErrorResult extends DialogNotificationData {
  validationErrors?: ValidationError[];
}
