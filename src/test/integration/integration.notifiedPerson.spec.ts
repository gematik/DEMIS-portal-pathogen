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
import { getButton, getInput, getRadioGroup, selectRadioOption } from '../shared/material-harness-utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { overrides, PATHOGEN_NOTIFICATION_IMPORTS, setDiagnosticBasedOnPathogenSelection, setSelectedPathogenCodeDisplay } from '../shared/test-setup-utils';
import {
  checkDescribingError,
  selectAndVerifySubmittingFacilityAsCurrentAddress,
  selectPageByNumber,
  setCheckboxTo,
  setInputFieldValue,
  setTextFieldValuesFor,
  verifyInputFieldValues,
  waitForStability,
} from '../shared/test-utils';
import { environment } from '../../environments/environment';
import { ADDRESS_TYPE_OTHER_FACILITY, FIELD_COPY_ADDRESS, FIELD_EMAIL_CY, FIELD_PHONE_NUMBER_CY } from '../shared/test-constants';
import { TEST_DATA, TEST_PARAMETER_SET_NOTIFIER, TEST_PARAMETER_VALIDATION } from '../shared/test-data';
import { ClipboardDataService } from '../../app/pathogen-notification/services/clipboard-data.service';
import { TEST_FACILITY, TEST_NOTIFIED_PERSON } from '../shared/test-objects';
import { mainConfig } from './integration.base.spec';

describe('Pathogen - Notified Person Integration Tests', () => {
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
    environment.pathogenConfig = mainConfig;

    await TestBed.configureTestingModule({
      imports: PATHOGEN_NOTIFICATION_IMPORTS,
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

  describe('Notified Person', () => {
    beforeEach(async () => {
      await selectPageByNumber(loader, fixture, 2);
    });

    it('should be at notified person form', async () => {
      expect(fixture.nativeElement.textContent).toContain('Wohnsitz');
    });

    describe('Validation of notifiedPerson ', () => {
      testValidationFor(TEST_PARAMETER_VALIDATION.notifiedPerson);
    });

    describe('Validation of residenceAddress', () => {
      testValidationFor(TEST_PARAMETER_VALIDATION.residenceAddress);
    });

    describe('Validation of currentAddress', () => {
      beforeEach(async () => {
        const radioGroup = await getRadioGroup(loader, '#currentAddressType');
        await selectRadioOption(radioGroup, 'andere Einrichtung / Unterkunft');
        expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_OTHER_FACILITY);
      });

      testValidationFor(TEST_PARAMETER_VALIDATION.currentAddress);
    });
    describe('Validation of email', () => {
      testContactValidationFor(TEST_PARAMETER_VALIDATION.email, true, true);
    });
    describe('Validation of phone number', () => {
      testContactValidationFor(TEST_PARAMETER_VALIDATION.phone, false, true);
    });
  });

  describe('Notified Person - CurrentAddress type submitting facility is selected', () => {
    const facility = TEST_FACILITY('notifier');

    // prep: check notifier is filled and move to submitter
    beforeEach(async () => {
      // data is coming from localstorage
      await waitForStability(fixture);
      await verifyInputFieldValues(loader, [
        {
          selector: facility.institutionName.selector,
          expectedValue: TEST_DATA.notifierFacility.facilityInfo.institutionName,
        },
      ]);
      await selectPageByNumber(loader, fixture, 1);
    });

    it('When submitting facility address is changed, this currentAddress should also change', async () => {
      // preparation: set address values for submitter
      await setInputFieldValue(loader, facility.institutionName.selector, TEST_PARAMETER_SET_NOTIFIER.facilityInfo[0].value, fixture);
      await setTextFieldValuesFor(TEST_PARAMETER_SET_NOTIFIER.address, loader);
      // select submitting facility type as currentAddressType
      await selectPageByNumber(loader, fixture, 2);
      await selectAndVerifySubmittingFacilityAsCurrentAddress(loader, fixture);
      // go back to submitting facility and change value
      await selectPageByNumber(loader, fixture, 1);
      await setInputFieldValue(loader, facility.institutionName.selector, facility.institutionName.value, fixture);
      await setInputFieldValue(loader, facility.zip.selector, facility.zip.value, fixture);

      // assertion: go to notifiedPerson and assert values have changed
      await selectPageByNumber(loader, fixture, 2);
      await verifyInputFieldValues(loader, [
        {
          selector: TEST_NOTIFIED_PERSON.currentName.selector,
          expectedValue: facility.institutionName.value,
        },
        {
          selector: TEST_NOTIFIED_PERSON.currentZip.selector,
          expectedValue: facility.zip.value,
        },
      ]);
    });

    it('When submitting facility copy checkbox is checked and data in notifier facility is changed, this address should also change', async () => {
      // preparation: enable checkbox in submittingFacility and go to notifiedPerson to select submittingFacility as currentAddressType
      await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);

      await selectPageByNumber(loader, fixture, 2);

      await selectAndVerifySubmittingFacilityAsCurrentAddress(loader, fixture);

      // go back to notifierFacility and change value
      await selectPageByNumber(loader, fixture, 0);
      await setInputFieldValue(loader, facility.institutionName.selector, facility.institutionName.value, fixture);
      await waitForStability(fixture);

      // go to notifiedPerson and assert value has changed
      await selectPageByNumber(loader, fixture, 2);
      await verifyInputFieldValues(loader, [
        {
          selector: TEST_NOTIFIED_PERSON.currentName.selector,
          expectedValue: facility.institutionName.value,
        },
      ]);
    });

    //flaky test
    xit('When submitting facility copy checkbox is checked and unchecked again, then the radio button type should be null', async () => {
      // preparation: enable checkbox in submittingFacility and go to notifiedPerson to select submittingFacility as currentAddressType
      await setCheckboxTo(true, FIELD_COPY_ADDRESS, fixture, loader);
      await verifyInputFieldValues(loader, [
        {
          selector: facility.institutionName.selector,
          expectedValue: TEST_DATA.notifierFacility.facilityInfo.institutionName,
        },
      ]);
      await selectPageByNumber(loader, fixture, 2);
      await waitForStability(fixture);
      await selectAndVerifySubmittingFacilityAsCurrentAddress(loader, fixture);
      // change: go back to submitting facility and disable checkbox
      await selectPageByNumber(loader, fixture, 1);
      await setCheckboxTo(false, FIELD_COPY_ADDRESS, fixture, loader);
      // assertion: no currentAddressType should be selected
      await selectPageByNumber(loader, fixture, 2);
      await waitForStability(fixture);
      const radioGroup = await getRadioGroup(loader, '#currentAddressType');
      expect(await radioGroup.getCheckedValue()).toBe(null);
    });
  });
});
