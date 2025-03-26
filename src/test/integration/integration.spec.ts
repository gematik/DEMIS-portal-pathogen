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

import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { getHtmlButtonElement } from '../shared/html-element-utils';
import { getButton, getCheckbox, getDialog, getInput, getStepper } from '../shared/material-harness-utils';
import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { overrides, PATHOGEN_NOTIFICATION_IMPORTS, setDiagnosticBasedOnPathogenSelection, setSelectedPathogenCodeDisplay } from '../shared/test-setup-utils';
import {
  checkDescribingError,
  clickNextButton,
  selectPageByNumber,
  setCheckboxTo,
  setInputFieldValue,
  setTextFieldValuesFor,
  verifyInputFieldValues,
  waitForStability,
} from '../shared/test-utils';
import { environment } from '../../environments/environment';
import {
  FIELD_COPY_ADDRESS,
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
  VALUE_EMPTY,
} from '../shared/test-constants';
import { TEST_DATA, TEST_PARAMETER_SET_NOTIFIER, TEST_PARAMETER_VALIDATION } from '../shared/test-data';
import { ClipboardDataService } from '../../app/pathogen-notification/services/clipboard-data.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TEST_FACILITY } from '../shared/test-objects';
import { lastValueFrom, of } from 'rxjs';

describe('Pathogen - Integration Tests', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  let fetchCountryCodeDisplaysSpy: jasmine.Spy;
  let fetchFederalStateCodeDisplaysSpy: jasmine.Spy;
  let fetchPathogenCodeDisplaysSpy: jasmine.Spy;
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
        if (openContactField) await (await getButton(loader, isMail ? '#btn-email-adresse-hinzufügen' : '#btn-telefonnummer-hinzufügen')).click();
        const inputField = await getInput(loader, `[data-cy=${isMail ? FIELD_EMAIL_CY : FIELD_PHONE_NUMBER_CY}]`);
        await inputField.setValue(value);
        await inputField.blur();
        await checkDescribingError(fixture, inputField, expectedResult);
      });
    });
  };

  beforeEach(async () => {
    environment.pathogenConfig = {
      featureFlags: {
        FEATURE_FLAG_COPY_CHECKBOX_FOR_NOTIFIER_DATA: true,
      },
      gatewayPaths: {
        pathogen: '/api/ng/notification/pathogen',
      },
      ngxLoggerConfig: {
        serverLogLevel: 1,
        disableConsoleLogging: true,
        level: 1,
      },
      pathToGateway: '../gateway/notification',
      production: false,
    };

    await TestBed.configureTestingModule({
      imports: [PATHOGEN_NOTIFICATION_IMPORTS, NoopAnimationsModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        MockProvider(FhirPathogenNotificationService, overrides.fhirPathogenNotificationService),
        MockProvider(PathogenNotificationStorageService, overrides.pathogenNotificationStorageService),
        [ClipboardDataService],
      ],
    }).compileComponents();

    fixture = MockRender(PathogenNotificationComponent);
    fetchCountryCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchCountryCodeDisplays as jasmine.Spy;
    fetchFederalStateCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchFederalStateCodeDisplays as jasmine.Spy;
    fetchPathogenCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchPathogenCodeDisplaysForFederalState as jasmine.Spy;
    getNotifierFacilitySpy = TestBed.inject(PathogenNotificationStorageService).getNotifierFacility as jasmine.Spy;
    getSelectedPathogenCodeDisplaySpy = TestBed.inject(PathogenNotificationStorageService).getSelectedPathogenCodeDisplay as jasmine.Spy;
    fetchDiagnosticsBasedOnPathogenSelectionSpy = TestBed.inject(FhirPathogenNotificationService).fetchDiagnosticsBasedOnPathogenSelection as jasmine.Spy;
    setSelectedPathogenCodeDisplay(null);
    setDiagnosticBasedOnPathogenSelection(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP);
    component = fixture.point.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
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

  describe('Notifier Facility', () => {
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
  });

  describe('Submitting Facility', () => {
    describe('Validation submitting facility text fields', () => {
      beforeEach(async () => {
        await clickNextButton(fixture);
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
        await selectPageByNumber(loader, fixture, 1);
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
        await selectPageByNumber(loader, fixture, 0);
        // adapt data in notifier
        await waitForStability(fixture);
        const notifierTestFacility = TEST_FACILITY('notifier');
        await setInputFieldValue(loader, notifierTestFacility.institutionName.selector, notifierTestFacility.institutionName.value, fixture);
        await waitForStability(fixture);
        await setInputFieldValue(loader, notifierTestFacility.zip.selector, notifierTestFacility.zip.value, fixture);
        await waitForStability(fixture);
        await setInputFieldValue(loader, notifierTestFacility.email.selector, notifierTestFacility.email.value, fixture);
        await waitForStability(fixture);
        await (await getButton(loader, '#btn-email-adresse-hinzufügen')).click();
        await setInputFieldValue(loader, `#${FIELD_EMAIL_2}`, 'myemail@test.de', fixture);

        // assertion: data should have been changed in submitter as well
        await selectPageByNumber(loader, fixture, 1);
        await waitForStability(fixture);
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
            expectedValue: 'myemail@test.de',
          },
        ]);
      });

      it('should reset all values after using clipboard when checkbox is unchecked', async () => {
        const facilitynameInput = await getInput(loader, `#${FIELD_INSTITUTIONAME}`);

        const p = lastValueFrom(of('URL S.name=Ein Name'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, '#btn-fill-form')).click();
        fixture.detectChanges();
        expect(await facilitynameInput.getValue()).toBe('Ein Name');

        await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);
        expect(await facilitynameInput.getValue()).toBe(NOTIFIER_VALUE_INSTITUTION_NAME);

        await setCheckboxTo(false, FIELD_COPY_ADDRESS, fixture, loader);
        expect(await facilitynameInput.getValue()).toBe('');
      });
    });

    describe('Validation of empty mandatory field in notifierFacility when using copyAddressCheckBox', () => {
      it('should throw error when street in notifier facility is empty', async () => {
        const streetInput = await getInput(loader, `#${FIELD_NOTIFIER_FACILITY_ADDRESS_STREET}`);
        await streetInput.setValue(VALUE_EMPTY);
        await streetInput.blur();
        expect(await streetInput.getValue()).toBe(VALUE_EMPTY);

        await clickNextButton(fixture);

        const checkbox = await getCheckbox(loader, `#${FIELD_COPY_ADDRESS}`);
        await checkbox.check();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(await checkbox.isChecked()).toBe(false);

        const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
        const dialog = await getDialog(documentRootLoader, '.mat-mdc-dialog-container');
        const dialogText = await dialog.getText();
        expect(dialogText).toContain('error Fehler bei der Auswahl Bitte geben Sie die Daten für die Meldende Person zunächst vollständig an.');

        const noButton = await getButton(documentRootLoader, '#btn-conf-dialog-no');
        await noButton.click();

        expect(await checkbox.isChecked()).toBe(false);
      });
    });
  });
});
