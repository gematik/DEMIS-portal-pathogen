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

import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MockedComponentFixture, MockProvider } from 'ng-mocks';
import { getAllButtonsWithSameSelector, getButton, getMultipleInputFieldsWithSameSelector } from '../shared/material-harness-utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { overrides, PATHOGEN_NOTIFICATION_IMPORTS } from '../shared/test-setup-utils';
import { selectPageByNumber } from '../shared/test-utils';
import { ClipboardDataService } from '../../app/pathogen-notification/services/clipboard-data.service';
import { setupIntegrationTests } from './integration.base.spec';
import { MatButtonHarness } from '@angular/material/button/testing';

describe('Pathogen - Notifier Facility Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  beforeEach(
    async () =>
      await TestBed.configureTestingModule({
        imports: PATHOGEN_NOTIFICATION_IMPORTS,
        providers: [
          provideHttpClient(withInterceptorsFromDi()),
          MockProvider(FhirPathogenNotificationService, overrides.fhirPathogenNotificationService),
          MockProvider(PathogenNotificationStorageService, overrides.pathogenNotificationStorageService),
          [ClipboardDataService],
        ],
      }).compileComponents()
  );

  beforeEach(async () => {
    const result = setupIntegrationTests();
    fixture = result.fixture;
    component = result.component;
    loader = result.loader;
    fixture.detectChanges();
  });

  describe('contacts works as expected', () => {
    let getPhoneFieldsCount: () => Promise<number>;
    let getEmailFieldsCount: () => Promise<number>;
    let getDeletePhoneButtons: () => Promise<MatButtonHarness[]>;
    let getDeleteEmailButtons: () => Promise<MatButtonHarness[]>;
    let getAddPhoneButton: () => Promise<MatButtonHarness>;
    let getAddEmailButton: () => Promise<MatButtonHarness>;

    beforeEach(async () => {
      await selectPageByNumber(loader, fixture, 1);
      getPhoneFieldsCount = async () => (await getMultipleInputFieldsWithSameSelector(loader, '[data-cy="phoneNo"]')).length;
      getEmailFieldsCount = async () => (await getMultipleInputFieldsWithSameSelector(loader, '[data-cy="email"]')).length;
      getDeletePhoneButtons = async () => getAllButtonsWithSameSelector(loader, '[data-testid^="phoneNumbers-delete-button"]');
      getDeleteEmailButtons = async () => getAllButtonsWithSameSelector(loader, '[data-testid^="emailAddresses-delete-button"]');
      getAddPhoneButton = async () => getButton(loader, '[data-testid="phoneNumbers-add-button"]');
      getAddEmailButton = async () => getButton(loader, '[data-testid="emailAddresses-add-button"]');
    });

    it('it is possible to add phone and email', async () => {
      expect(await getPhoneFieldsCount()).toBe(1);
      await (await getAddPhoneButton()).click();
      fixture.detectChanges();
      expect(await getPhoneFieldsCount()).toBe(2);

      expect(await getEmailFieldsCount()).toBe(1);
      await (await getAddEmailButton()).click();
      fixture.detectChanges();
      expect(await getEmailFieldsCount()).toBe(2);
    });

    it('At start both email and phone fields should be visible and both are deletable', async () => {
      expect(await getPhoneFieldsCount()).toBe(1);
      expect(await getEmailFieldsCount()).toBe(1);

      expect((await getDeletePhoneButtons()).length).toBe(1);
      expect((await getDeleteEmailButtons()).length).toBe(1);
    });

    it('phone deletable except if it is the last contact field', async () => {
      expect(await getPhoneFieldsCount()).toBe(1);
      expect(await getEmailFieldsCount()).toBe(1);

      const deleteEmailButtons = await getDeleteEmailButtons();
      expect(deleteEmailButtons.length).toBe(1);
      await deleteEmailButtons[0].click();
      expect(await getEmailFieldsCount()).toBe(0);

      expect(await getPhoneFieldsCount()).toBe(1);
      expect((await getDeletePhoneButtons()).length).toBe(0);
    });

    it('email deletable except if it is the last contact field', async () => {
      expect(await getPhoneFieldsCount()).toBe(1);
      expect(await getEmailFieldsCount()).toBe(1);

      const deletePhoneButtons = await getDeletePhoneButtons();
      expect(deletePhoneButtons.length).toBe(1);
      await deletePhoneButtons[0].click();
      expect(await getPhoneFieldsCount()).toBe(0);

      expect(await getEmailFieldsCount()).toBe(1);
      expect((await getDeleteEmailButtons()).length).toBe(0);
    });
  });
});
