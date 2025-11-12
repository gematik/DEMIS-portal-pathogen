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

import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { MockedComponentFixture } from 'ng-mocks';
import { getHtmlButtonElement } from '../shared/html-element-utils';
import { getButton, getCheckbox, getDialog, getInput, getStepper } from '../shared/material-harness-utils';
import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  checkDescribingError,
  clickBackButton,
  clickNextButton,
  setCheckboxTo,
  setInputFieldValue,
  setTextFieldValuesFor,
  switchToPage,
  verifyInputFieldValues,
  waitForStability,
} from '../shared/test-utils';
import {
  ADD_BUTTON_CLIPBOARD,
  ADD_BUTTON_EMAIL,
  ADD_BUTTON_PHONE,
  FIELD_COPY_ADDRESS,
  FIELD_DEPARTMENTNAME,
  FIELD_EMAIL_2,
  FIELD_EMAIL_CY,
  FIELD_FIRST_NAME,
  FIELD_INSTITUTIONAME,
  FIELD_LAST_NAME,
  FIELD_NOTIFIER_FACILITY_ADDRESS_STREET,
  FIELD_NOTIFIER_FACILITY_FIRSTNAME,
  FIELD_NOTIFIER_FACILITY_LASTNAME,
  FIELD_PHONE_NUMBER_CY,
  FIELD_SUBMITTING_FACILITY_ADDRESS_CITY,
  FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER,
  FIELD_SUBMITTING_FACILITY_ADDRESS_STREET,
  FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP,
  NOTIFIER_VALUE_CITY,
  NOTIFIER_VALUE_HOUSENR,
  NOTIFIER_VALUE_INSTITUTION_NAME,
  NOTIFIER_VALUE_STREET,
  NOTIFIER_VALUE_ZIP,
  SUBMITTING_VALUE_DEPARTMENT_NAME,
  VALUE_EMPTY,
} from '../shared/test-constants';
import { TEST_PARAMETER_SET_NOTIFIER, TEST_PARAMETER_VALIDATION } from '../shared/test-data';
import { TEST_FACILITY } from '../shared/test-objects';
import { lastValueFrom, of } from 'rxjs';
import { buildMock, setupIntegrationTests } from './integration.base.spec';

describe('Pathogen - Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  let fetchCountryCodeDisplaysSpy: jasmine.Spy;
  let fetchFederalStateCodeDisplaysSpy: jasmine.Spy;
  let fetchPathogenCodeDisplaysByTypeAndStateSpy: jasmine.Spy;
  let getNotifierFacilitySpy: jasmine.Spy;
  let fetchDiagnosticsBasedOnPathogenSelectionSpy: jasmine.Spy;
  let getSelectedPathogenCodeDisplaySpy: jasmine.Spy;

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
        if (openContactField) await (await getButton(loader, isMail ? ADD_BUTTON_EMAIL : ADD_BUTTON_PHONE)).click();
        const inputField = await getInput(loader, `[data-cy=${isMail ? FIELD_EMAIL_CY : FIELD_PHONE_NUMBER_CY}]`);
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

  it('should show 7.1 header', async () => {
    let textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('Erregernachweis (§7.1)')).toBeTrue();
  });

  it('should not send, when nothing is inserted', async () => {
    const submitButton = getHtmlButtonElement(fixture.nativeElement, '#btn-send-notification');
    expect(submitButton).toBeTruthy();
    expect(submitButton.disabled).toBeTrue();
  });

  it('should switch to next formular when clicking nextButton', async () => {
    let textContent = fixture.nativeElement.textContent;
    expect(textContent.includes('Ansprechperson (Einsender)')).toBeFalse();
    expect(textContent).toContain('Ansprechperson (Melder)');

    await clickNextButton(fixture);

    textContent = fixture.nativeElement.textContent;
    expect(textContent).toContain('Ansprechperson (Einsender)');
  });

  describe('should test mat stepper', async () => {
    it('should test default', async () => {
      const stepper = await getStepper(loader);
      const steps = await stepper.getSteps();
      expect(steps.length).toEqual(5);

      expect(await parallel(() => steps.map(step => step.isSelected()))).toEqual([true, false, false, false, false]);

      const reportStep = steps[3];
      await reportStep.select();

      expect(await parallel(() => steps.map(step => step.isSelected()))).toEqual([false, false, false, true, false]);
    });
  });

  describe('Submitting Facility', () => {
    describe('Validation submitting facility text fields', () => {
      beforeEach(async () => {
        await clickNextButton(fixture);
        await waitForStability(fixture);
      });
      it('should be at submitting facility form', async () => {
        expect(fixture.nativeElement.textContent).toContain('Ansprechperson (Einsender)');
      });
      describe('Validation of submittingFacilityName ', () => {
        testValidationFor(TEST_PARAMETER_VALIDATION.submittingFacilityInfo);
      });
      describe('Validation of submittingFacilityAddress', () => {
        testValidationFor(TEST_PARAMETER_VALIDATION.submittingFacilityAddress);
      });
      describe('Validation of submittingFacilityNofifier', () => {
        testValidationFor(TEST_PARAMETER_VALIDATION.contactPerson);
      });
      describe('Validation of email', () => {
        testContactValidationFor(TEST_PARAMETER_VALIDATION.email, true);
      });
      describe('Validation of phone number', () => {
        testContactValidationFor(TEST_PARAMETER_VALIDATION.phone, false);
      });
    });

    describe('Validation of copyAddressCheckBox', () => {
      beforeEach(async () => {
        await setTextFieldValuesFor(TEST_PARAMETER_SET_NOTIFIER.facilityInfo, loader);
        await setTextFieldValuesFor(TEST_PARAMETER_SET_NOTIFIER.address, loader);
        await setTextFieldValuesFor(TEST_PARAMETER_SET_NOTIFIER.contactPerson, loader);
        await setTextFieldValuesFor(TEST_PARAMETER_SET_NOTIFIER.contacts.phoneNumbers, loader);
        await setTextFieldValuesFor(TEST_PARAMETER_SET_NOTIFIER.contacts.emailAddresses, loader);
        // selectPageByNumber method is flaky, so we use switchToPage instead
        // await selectPageByNumber(loader, fixture, 1);
        await switchToPage(2, fixture);
      });

      it('should copy all data of notifier when checkbox is checked', async () => {
        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);
        await verifyInputFieldValues(loader, [
          {
            selector: `#${FIELD_INSTITUTIONAME}`,
            expectedValue: NOTIFIER_VALUE_INSTITUTION_NAME,
          },
          {
            selector: `#${FIELD_SUBMITTING_FACILITY_ADDRESS_STREET}`,
            expectedValue: NOTIFIER_VALUE_STREET,
          },
          {
            selector: `#${FIELD_SUBMITTING_FACILITY_ADDRESS_HOUSE_NUMBER}`,
            expectedValue: NOTIFIER_VALUE_HOUSENR,
          },
          {
            selector: `#${FIELD_SUBMITTING_FACILITY_ADDRESS_CITY}`,
            expectedValue: NOTIFIER_VALUE_CITY,
          },
          {
            selector: `#${FIELD_SUBMITTING_FACILITY_ADDRESS_ZIP}`,
            expectedValue: NOTIFIER_VALUE_ZIP,
          },
          {
            selector: `#${FIELD_FIRST_NAME}`,
            expectedValue: FIELD_NOTIFIER_FACILITY_FIRSTNAME,
          },
          {
            selector: `#${FIELD_LAST_NAME}`,
            expectedValue: FIELD_NOTIFIER_FACILITY_LASTNAME,
          },
        ]);
      });

      it('should not disable department name', async () => {
        await fixture.whenStable();
        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);
        const departmentNameInput = await getInput(loader, `#${FIELD_DEPARTMENTNAME}`);
        expect(await departmentNameInput.isDisabled()).toBeFalse();
        await departmentNameInput.setValue(SUBMITTING_VALUE_DEPARTMENT_NAME);
        expect(await departmentNameInput.isDisabled()).toBeFalse();
        expect(await departmentNameInput.getValue()).toBe(SUBMITTING_VALUE_DEPARTMENT_NAME);
      });

      it('should reset all values when checkbox is unchecked', async () => {
        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);

        const facilityNameInput = await getInput(loader, `#${FIELD_INSTITUTIONAME}`);
        expect(await facilityNameInput.getValue()).toBe(NOTIFIER_VALUE_INSTITUTION_NAME);

        const facilityAddressInput = await getInput(loader, `#${FIELD_SUBMITTING_FACILITY_ADDRESS_STREET}`);
        expect(await facilityAddressInput.getValue()).toBe(NOTIFIER_VALUE_STREET);

        await setCheckboxTo(false, FIELD_COPY_ADDRESS, fixture, loader);

        expect(await facilityNameInput.getValue()).toBe(VALUE_EMPTY);
        expect(await facilityAddressInput.getValue()).toBe(VALUE_EMPTY);
      });

      it('should update values when checkbox is checked and data in notifierFacility is changed', async () => {
        // prep: select checkbox in submitter
        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);
        await waitForStability(fixture);
        await verifyInputFieldValues(loader, [
          {
            selector: TEST_FACILITY('submitter').institutionName.selector,
            expectedValue: TEST_PARAMETER_SET_NOTIFIER.facilityInfo[0].value,
          },
        ]);
        await clickBackButton(fixture);
        // adapt data in notifier
        const notifierTestFacility = TEST_FACILITY('notifier');
        await setInputFieldValue(loader, notifierTestFacility.institutionName.selector, notifierTestFacility.institutionName.value, fixture);
        await waitForStability(fixture);
        await setInputFieldValue(loader, notifierTestFacility.zip.selector, notifierTestFacility.zip.value, fixture);
        await waitForStability(fixture);
        await setInputFieldValue(loader, notifierTestFacility.email.selector, notifierTestFacility.email.value, fixture);
        await waitForStability(fixture);
        await (await getButton(loader, ADD_BUTTON_EMAIL)).click();
        const testEmail = 'myemail@test.de';
        await setInputFieldValue(loader, `#${FIELD_EMAIL_2}`, testEmail, fixture);

        // assertion: data should have been changed in submitter as well
        await clickNextButton(fixture);
        await verifyInputFieldValues(loader, [
          {
            selector: notifierTestFacility.institutionName.selector,
            expectedValue: notifierTestFacility.institutionName.value,
          },
          {
            selector: notifierTestFacility.zip.selector,
            expectedValue: notifierTestFacility.zip.value,
          },
          {
            selector: notifierTestFacility.email.selector,
            expectedValue: notifierTestFacility.email.value,
          },
          {
            selector: `#${FIELD_EMAIL_2}`,
            expectedValue: testEmail,
          },
        ]);
      });

      it('should reset all values after using clipboard when checkbox is unchecked', async () => {
        const facilitynameInput = await getInput(loader, `#${FIELD_INSTITUTIONAME}`);

        const p = lastValueFrom(of('URL S.name=Ein Name'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();
        expect(await facilitynameInput.getValue()).toBe('Ein Name');

        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);
        expect(await facilitynameInput.getValue()).toBe(NOTIFIER_VALUE_INSTITUTION_NAME);

        await setCheckboxTo(false, FIELD_COPY_ADDRESS, fixture, loader);
        expect(await facilitynameInput.getValue()).toBe('');
      });
    });

    describe('Validation of empty mandatory field in notifierFacility when using copyAddressCheckBox', () => {
      const prepareMandatoryFieldEmpty = async (selector: string) => {
        const input = await getInput(loader, selector);
        await input.setValue(VALUE_EMPTY);
        await input.blur();
        expect(await input.getValue()).toBe(VALUE_EMPTY);
      };

      const assertCheckboxUnchecked = async (checkboxSelector: string) => {
        const checkbox = await getCheckbox(loader, checkboxSelector);
        expect(await checkbox.isChecked()).toBe(false);
      };

      it('should throw error when street in notifier facility is empty', async () => {
        // preparation
        await prepareMandatoryFieldEmpty(`#${FIELD_NOTIFIER_FACILITY_ADDRESS_STREET}`);
        await clickNextButton(fixture);

        //assertion
        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader, false);
        const dialog = await getDialog(TestbedHarnessEnvironment.documentRootLoader(fixture), '.mat-mdc-dialog-container');
        const dialogText = await dialog.getText();
        expect(dialogText).toContain('Fehler bei der Auswahl');
        expect(dialogText).toContain('Bitte geben Sie die Daten für die Meldende Person zunächst vollständig an.');
        const noButton = await getButton(TestbedHarnessEnvironment.documentRootLoader(fixture), '#close-btn');
        await noButton.click();

        await assertCheckboxUnchecked(`#${FIELD_COPY_ADDRESS}`);
      });

      it('should not overwrite existing input fields when street in notifier facility is empty', async () => {
        // preparation
        await prepareMandatoryFieldEmpty(`#${FIELD_NOTIFIER_FACILITY_ADDRESS_STREET}`);
        await clickNextButton(fixture);

        const submitter = TEST_FACILITY('submitter');
        const submittingFacilityAddressInput = await getInput(loader, submitter.institutionName.selector);
        await submittingFacilityAddressInput.setValue(submitter.institutionName.value);
        await submittingFacilityAddressInput.blur();

        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader, false);

        //assertion
        await assertCheckboxUnchecked(`#${FIELD_COPY_ADDRESS}`);
        expect(await submittingFacilityAddressInput.getValue()).toBe(submitter.institutionName.value);
        const submitterStreetInput = await getInput(loader, submitter.street.selector);
        expect(await submitterStreetInput.getValue()).toBe(VALUE_EMPTY);
      });
    });
  });
});
