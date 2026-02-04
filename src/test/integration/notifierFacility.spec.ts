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

import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { MockedComponentFixture } from 'ng-mocks';
import { getAllButtonsWithSameSelector, getButton, getInput, getMultipleInputFieldsWithSameSelector } from '../shared/material-harness-utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { checkDescribingError } from '../shared/test-utils';
import { buildMock, setupIntegrationTests } from './base';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ADD_BUTTON_EMAIL, ADD_BUTTON_PHONE, FIELD_EMAIL_1, FIELD_EMAIL, FIELD_PHONE_1, FIELD_PHONE } from '../shared/test-constants';
import { TEST_PARAMETER_VALIDATION } from '../shared/test-data';

describe('Pathogen - Notifier Facility Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  const testValidationFor = parameters => {
    parameters.forEach(({ field, value, expectedResult }) => {
      it(`for the field: '${field}', the value: '${value}' should throw the error: '${expectedResult}'`, async () => {
        const input = await getInput(loader, `#${field}`);
        await input.setValue(value);
        await input.blur();
        await checkDescribingError(fixture, input, expectedResult);
      });
    });
  };

  const testContactValidationFor = (parameters: any, isMail: boolean, openContactField?: boolean) => {
    parameters.forEach(({ value, expectedResult }) => {
      it(`for the ${isMail ? 'email' : 'phone number'}, the value: '${value}' should throw the error: '${expectedResult}'`, async () => {
        if (openContactField)
          await (await getButton(loader, isMail ? '[data-testid="emailAddresses-add-button"]' : '[data-testid="phoneNumbers-add-button"]')).click();
        const inputField = await getInput(loader, `#${isMail ? FIELD_EMAIL_1 : FIELD_PHONE_1}`);
        await inputField.setValue(value);
        await inputField.blur();
        await checkDescribingError(fixture, inputField, expectedResult);
      });
    });
  };

  beforeEach(async () => await buildMock());

  beforeEach(async () => {
    const result = setupIntegrationTests();
    fixture = result.fixture;
    component = result.component;
    loader = result.loader;
    fixture.detectChanges();
  });
  it('should be at notifier facility form', async () => {
    expect(fixture.nativeElement.textContent).toContain('Ansprechperson (Melder)');
  });
  describe('Validation of facilityInfo', () => {
    testValidationFor(TEST_PARAMETER_VALIDATION.facilityInfo);
  });
  describe('Validation of address', () => {
    testValidationFor(TEST_PARAMETER_VALIDATION.notifierFacilityAddress);
  });
  describe('Validation of contactPerson', () => {
    testValidationFor(TEST_PARAMETER_VALIDATION.contactPerson);
  });
  describe('Validation of email', () => {
    testContactValidationFor(TEST_PARAMETER_VALIDATION.email, true);
  });
  describe('Validation of phone number', () => {
    testContactValidationFor(TEST_PARAMETER_VALIDATION.phone, false);
  });
  describe('contacts works as expected', () => {
    let getPhoneFieldsCount: () => Promise<number>;
    let getEmailFieldsCount: () => Promise<number>;
    let getDeletePhoneButtons: () => Promise<MatButtonHarness[]>;
    let getDeleteEmailButtons: () => Promise<MatButtonHarness[]>;
    let getAddPhoneButton: () => Promise<MatButtonHarness>;
    let getAddEmailButton: () => Promise<MatButtonHarness>;

    beforeEach(async () => {
      getPhoneFieldsCount = async () => (await getMultipleInputFieldsWithSameSelector(loader, `[id^="${FIELD_PHONE}-"]`)).length;
      getEmailFieldsCount = async () => (await getMultipleInputFieldsWithSameSelector(loader, `[id^="${FIELD_EMAIL}-"]`)).length;
      getDeletePhoneButtons = async () => getAllButtonsWithSameSelector(loader, '[id^="phoneNumbers-delete-button"]');
      getDeleteEmailButtons = async () => getAllButtonsWithSameSelector(loader, '[id^="emailAddresses-delete-button"]');
      getAddPhoneButton = async () => getButton(loader, ADD_BUTTON_PHONE);
      getAddEmailButton = async () => getButton(loader, ADD_BUTTON_EMAIL);
    });

    it('At start both email and phone fields should be visible and both are deletable', async () => {
      expect(await getPhoneFieldsCount()).toBe(1);
      expect(await getEmailFieldsCount()).toBe(1);

      expect((await getDeletePhoneButtons()).length).toBe(1);
      expect((await getDeleteEmailButtons()).length).toBe(1);
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

      // reset state
      const deleteEmailButtons = await getDeleteEmailButtons();
      const deletePhoneButtons = await getDeletePhoneButtons();
      await deleteEmailButtons[0].click();
      await deletePhoneButtons[0].click();
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

      // reset state
      await (await getAddEmailButton()).click();
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

      // reset state
      await (await getAddPhoneButton()).click();
    });
  });
});
