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

import { buildMock, mainConfig, setupIntegrationTests } from './base';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { HarnessLoader } from '@angular/cdk/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { NotificationType } from '../../app/pathogen-notification/common/routing-helper';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { getButton, getDialog, getIcon, getInput, getSelect } from '../shared/material-harness-utils';
import { clickNextButton, waitForStability } from '../shared/test-utils';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { TestBed } from '@angular/core/testing';
import { FollowUpNotificationIdService, ValidationStatus } from '@gematik/demis-portal-core-library';
import { setDiagnosticBasedOnPathogenSelection } from '../shared/test-setup-utils';
import { lastValueFrom, of } from 'rxjs';
import { ADD_BUTTON_CLIPBOARD } from '../shared/test-constants';

describe('Pathogen - Follow Up Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;
  let fhirService: FhirPathogenNotificationService;
  let followUpService: FollowUpNotificationIdService;

  const initialNotificationIdSelector = '#initialNotificationIdInput';

  beforeEach(() => buildMock(true, NotificationType.FollowUpNotification7_1));

  beforeEach(() => {
    const result = setupIntegrationTests({
      ...mainConfig,
      featureFlags: { ...mainConfig.featureFlags, FEATURE_FLAG_FOLLOW_UP_NOTIFICATION_PORTAL_PATHOGEN: true },
    });

    fixture = result.fixture;
    component = result.component;
    loader = result.loader;
    fixture.detectChanges();
    fhirService = TestBed.inject(FhirPathogenNotificationService);
    followUpService = TestBed.inject(FollowUpNotificationIdService);
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

    it('should show validation error when input is invalid and show warning icon', async () => {
      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);

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
  describe('Tests after positive Pop-Up Validation', () => {
    beforeEach(async () => {
      setDiagnosticBasedOnPathogenSelection({
        materials: [],
        methods: [],
        answerSet: [],
        resistanceGenes: [],
        resistances: [],
        substances: [],
        header: '',
        subheader: '',
      });

      spyOn(followUpService, 'validateNotificationId').and.callFake((id: string, path: string) => {
        followUpService.validatedNotificationId.set('123');
        followUpService.validationStatus.set(ValidationStatus.VALID);
        followUpService.hasValidNotificationId.set(true);
        followUpService.followUpNotificationCategory.set('invp');
      });

      const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const input = await getInput(documentRootLoader, initialNotificationIdSelector);
      await input.setValue('123');

      const checkButton = await getButton(documentRootLoader, '#btn-check-id');
      await checkButton.click();
      await waitForStability(fixture);

      const nextButton = await getButton(documentRootLoader, '#btn-next');
      await nextButton.click();
      await waitForStability(fixture);

      expect(document.querySelector('.mat-mdc-dialog-container')).toBeNull();
    });
    describe('clipboard tests', () => {
      it('should insert correct values for notified person', async () => {
        await clickNextButton(fixture);
        await clickNextButton(fixture);

        const gender = await getSelect(loader, '#gender');
        expect(await gender.getValueText()).toBe('Bitte auswählen');

        const birthDate = await getInput(loader, '#birthDate-datepicker-input-field');
        expect(await birthDate.getValue()).toBe('');

        const zip = await getInput(loader, '#residence-address-zip');
        expect(await zip.getValue()).toBe('');

        const country = await getSelect(loader, '#residence-address-country');
        expect(await country.getValueText()).toBe('Deutschland');

        const p = lastValueFrom(of('URL P.gender=MALE&P.birthDate=01.01.2023&P.r.zip=12345&P.r.country=KP'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        spyOn(window.navigator.clipboard, 'writeText');
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await gender.getValueText()).toBe('Männlich');
        expect(await birthDate.getValue()).toBe('01.2023');
        expect(await zip.getValue()).toBe('123');
        expect(await country.getValueText()).toBe('Demokratische Volksrepublik Korea');
      });
    });
  });
});
