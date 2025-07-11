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

import { TestBed } from '@angular/core/testing';
import { FileService } from './file.service';
import { NotifiedPersonBasicInfo, PathogenTest } from '../../../../api/notification';

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileService);
  });

  it('returns file name for PathogenTest notification type', () => {
    const notification: PathogenTest = {
      notifiedPerson: {
        info: {
          firstname: 'Max',
          lastname: 'Meier',
          birthDate: '05.11.1998',
        } as NotifiedPersonBasicInfo,
      },
    } as PathogenTest;

    const fileName = service.getFileNameByNotificationType(notification);
    expect(fileName).toMatch(/^\d{12} Meier, Max 981105\.pdf$/);
  });

  it('handles empty birth date gracefully', () => {
    const notification: PathogenTest = {
      notifiedPerson: {
        info: {
          firstname: 'Max',
          lastname: 'Meier',
          birthDate: '',
        } as NotifiedPersonBasicInfo,
      },
    } as PathogenTest;

    const fileName = service.getFileNameByNotificationType(notification);
    expect(fileName).toMatch(/^\d{12} Meier, Max\.pdf$/);
  });
});
