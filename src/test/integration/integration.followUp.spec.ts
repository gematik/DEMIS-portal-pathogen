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

import { buildMock, mainConfig, setupIntegrationTests } from './integration.base.spec';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { HarnessLoader } from '@angular/cdk/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { NotificationType } from '../../app/pathogen-notification/common/routing-helper';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { getButton, getDialog, getIcon, getInput } from '../shared/material-harness-utils';
import { waitForStability } from '../shared/test-utils';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

describe('Pathogen - Follow Up Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;
  let fhirService: FhirPathogenNotificationService;

  const initialNotificationIdSelector = '#initialNotificationIdInput';

  beforeEach(() => buildMock(true, NotificationType.FollowUpNotification7_1));

  beforeEach(() => {
    const result = setupIntegrationTests({
      ...mainConfig,
      featureFlags: { ...mainConfig.featureFlags, FEATURE_FLAG_FOLLOW_UP_NOTIFICATION: true },
    });

    fixture = result.fixture;
    component = result.component;
    loader = result.loader;
    fixture.detectChanges();
    fhirService = TestBed.inject(FhirPathogenNotificationService);
  });

  it('should create', () => {
    expect(component).withContext('PathogenNotificationComponent could not be created').toBeTruthy();
  });

  it('should show 7.1 follow up header', () => {
    let textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('Nichtnamentliche Folgemeldung eines Erregernachweises gemäß § 7 Abs. 1 IfSG')).toBeTrue();
  });

  it('should show 7.1 follow up input dialog', async () => {
    const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const dialog = await getDialog(documentRootLoader, '.mat-mdc-dialog-container');
    expect(dialog).toBeTruthy();

    const title = await dialog.getTitleText();
    expect(title).toMatch('Folgemeldung');
  });

  describe('Initial Notification Id Popup Tests', () => {
    it('should have input field for notification ID in dialog', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const input = await getInput(documentRootLoader, initialNotificationIdSelector);
      expect(input).toBeTruthy();
      expect(await input.getPlaceholder()).toBe('Bitte eingeben');
    });

    it('should have "Zurück zur Startseite" button in dialog', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const backButton = await getButton(documentRootLoader, '#btn-back-to-homepage');
      expect(backButton).toBeTruthy();
      expect(await backButton.getText()).toBe('Zurück zur Startseite');
    });

    it('should have "Überprüfen" button in dialog when no valid ID', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const input = await getInput(documentRootLoader, initialNotificationIdSelector);
      await input.setValue('123');

      const checkButton = await getButton(documentRootLoader, '#btn-check-id');
      expect(checkButton).toBeTruthy();
      expect(await checkButton.getText()).toBe('Überprüfen');
    });

    it('should show "Weiter" button when validation is successful', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

      (fhirService.fetchFollowUpNotificationCategory as jasmine.Spy).and.returnValue(of({ notificationCategory: 'invp' }));

      const input = await getInput(documentRootLoader, initialNotificationIdSelector);
      await input.setValue('123');

      const checkButton = await getButton(documentRootLoader, '#btn-check-id');
      await checkButton.click();
      await waitForStability(fixture);

      const validIcon = await getIcon(documentRootLoader, '.icon-valid');
      expect(validIcon).toBeTruthy();

      const nextButton = await getButton(documentRootLoader, '#btn-next');
      expect(nextButton).toBeTruthy();
      expect(await nextButton.getText()).toBe('Weiter');
    });

    it('should show validation error when input is invalid and show warning icon', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

      (fhirService.fetchFollowUpNotificationCategory as jasmine.Spy).and.returnValue(throwError(() => new Error('Not Found')));

      const input = await getInput(documentRootLoader, initialNotificationIdSelector);
      await input.setValue('-1');
      await input.blur();

      const checkButton = await getButton(documentRootLoader, '#btn-check-id');
      await checkButton.click();
      await waitForStability(fixture);

      const dialogContainer = document.querySelector('.mat-mdc-dialog-container');
      expect(dialogContainer).toBeTruthy();

      const errorMessage = dialogContainer.querySelector('mat-error');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Die von Ihnen angegebene ID konnte nicht gefunden werden');

      const invalidIcon = await getIcon(documentRootLoader, '.icon-invalid');
      expect(invalidIcon).toBeTruthy();
    });

    it('should disable "Überprüfen" button & show required error when input is empty', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const input = await getInput(documentRootLoader, initialNotificationIdSelector);
      await input.setValue('');
      await input.blur();

      const dialogContainer = document.querySelector('.mat-mdc-dialog-container');
      expect(dialogContainer).toBeTruthy();
      const errorMessage = dialogContainer.querySelector('mat-error');
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain('Meldungs-ID ist erforderlich');

      const checkButton = await getButton(documentRootLoader, '#btn-check-id');
      expect(await checkButton.isDisabled()).toBeTruthy();
    });
  });
});
