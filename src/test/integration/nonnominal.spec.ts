/*
    Copyright (c) 2026 gematik GmbH
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

import { beforeEach, describe, expect, it } from 'vitest';
import { buildMock, IntegrationFixture, mainConfig, setupCoreSidenavIntegrationTests, setupIntegrationTests } from './base';
import { HarnessLoader } from '@angular/cdk/testing';
import { switchToPage } from '../shared/test-utils';
import { NotificationType } from '../../app/pathogen-notification/common/routing-helper';

describe.each([false, true])('Pathogen - Nonnominal Integration Tests (FEATURE_FLAG_CORE_SIDENAV: %s)', featureFlagCoreSidenav => {
  let loader: HarnessLoader;
  let fixture: IntegrationFixture;

  beforeEach(() => buildMock(true, NotificationType.NonNominalNotification7_3, featureFlagCoreSidenav));

  beforeEach(async () => {
    const config = {
      ...mainConfig,
      featureFlags: { ...mainConfig.featureFlags, FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: true },
    };
    const result = featureFlagCoreSidenav ? setupCoreSidenavIntegrationTests(config) : setupIntegrationTests(config);

    fixture = result.fixture;
    loader = result.loader;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-pathogen-notification-new') !== null).toBe(featureFlagCoreSidenav);
  });

  it('should show 7.3 header', () => {
    const textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('§ 7 Abs. 3 IfSG')).toBe(true);
    expect(textContent.includes('Erregernachweis (§ 7 Abs. 1 IfSG)')).toBe(false);
  });

  it('should show favorites', async () => {
    await switchToPage(4, fixture);
    const textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('Favoriten')).toBe(true);
  });

  it('should not show federalState select', async () => {
    await switchToPage(4, fixture);
    const federalStateSelect = fixture.nativeElement.querySelector('[id="federalState"]');
    const notifiablePathogenSelect = fixture.nativeElement.querySelector('[id="notifiablePathogen"]');

    expect(federalStateSelect, 'federalStateSelect should not be present but was found').toBeNull();
    expect(notifiablePathogenSelect, 'notifiablePathogenSelect could not be found').toBeTruthy();
  });

  it('should show the default disclaimer text on notified person page', async () => {
    await switchToPage(3, fixture);
    expect(fixture.nativeElement.textContent).toContain(
      'Sie möchten eine nichtnamentliche Meldung nach § 7 Abs. 3 IfSG absetzen. Die hier erforderlichen Angaben zur betroffenen Person werden ausschließlich zur Bildung des Pseudonyms verwendet und nach der Pseudonymisierung verworfen. Das Pseudonym dient der Zuordnung zusammengehöriger Meldungen. Benutzen Sie bitte korrekte Personendaten, um dies zu gewährleisten. Mehr Informationen finden Sie hier.'
    );
  });
});
