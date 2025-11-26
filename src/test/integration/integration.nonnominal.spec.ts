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

import { buildMock, mainConfig, setupIntegrationTests } from './integration.base.spec';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { HarnessLoader } from '@angular/cdk/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { switchToPage } from '../shared/test-utils';
import { NotificationType } from '../../app/pathogen-notification/common/routing-helper';

describe('Pathogen - Nonnominal Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  beforeEach(() => buildMock(true, NotificationType.NonNominalNotification7_3));

  beforeEach(() => {
    const result = setupIntegrationTests({
      ...mainConfig,
      featureFlags: { ...mainConfig.featureFlags, FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: true },
    });

    fixture = result.fixture;
    component = result.component;
    loader = result.loader;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).withContext('PathogenNotificationComponent could not be created').toBeTruthy();
  });

  it('should show 7.3 header', () => {
    let textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('§ 7 Abs. 3 IfSG')).toBeTrue();
    expect(textContent.includes('Erregernachweis (§ 7 Abs. 1 IfSG)')).toBeFalse();
  });

  it('should show favorites', async () => {
    await switchToPage(4, fixture);
    let textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('Favoriten')).toBeTrue();
  });

  it('should not show federalState select', async () => {
    await switchToPage(4, fixture);
    const federalStateSelect = fixture.nativeElement.querySelector('[id="federalStateCodeDisplay"]');
    const pathogenDisplaySelect = fixture.nativeElement.querySelector('[id="pathogenDisplay"]');

    expect(federalStateSelect).withContext('federalStateSelect should not be present but was found').toBeNull();
    expect(pathogenDisplaySelect).withContext('pathogenDisplaySelect could not be found').toBeTruthy();
  });
});
