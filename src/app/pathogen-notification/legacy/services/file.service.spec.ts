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

import { TestBed } from '@angular/core/testing';
import { FileService } from './file.service';
import { Notification, NotifiedPersonBasicInfo } from '../../../../api/notification';
import NotificationTypeEnum = Notification.NotificationTypeEnum;

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileService);
  });

  it('returns file name for PathogenTest notification type', () => {
    const notification: Notification = {
      notificationType: NotificationTypeEnum.PathogenTest,
      pathogenTest: {
        notifiedPerson: {
          info: {
            firstname: 'Max',
            lastname: 'Meier',
            birthDate: '05.11.1998',
          } as NotifiedPersonBasicInfo,
        },
      },
    } as Notification;

    const fileName = service.getFileNameByNotificationType(notification);
    expect(fileName).toMatch(/^\d{12} Meier, Max 981105\.pdf$/);
  });

  it('returns file name with current time for non-PathogenTest notification type', () => {
    const notification: Notification = {
      notificationType: NotificationTypeEnum.BedOccupancy,
    } as Notification;

    const fileName = service.getFileNameByNotificationType(notification);
    expect(fileName).toMatch(/^\d{12}\.pdf$/);
  });

  it('handles empty birth date gracefully', () => {
    const notification: Notification = {
      notificationType: NotificationTypeEnum.PathogenTest,
      pathogenTest: {
        notifiedPerson: {
          info: {
            firstname: 'Max',
            lastname: 'Meier',
            birthDate: '',
          } as NotifiedPersonBasicInfo,
        },
      },
    } as Notification;

    const fileName = service.getFileNameByNotificationType(notification);
    expect(fileName).toMatch(/^\d{12} Meier, Max\.pdf$/);
  });
});
