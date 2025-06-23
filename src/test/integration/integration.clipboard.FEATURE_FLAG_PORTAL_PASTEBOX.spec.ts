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

import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { lastValueFrom, of } from 'rxjs';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import {
  getAutocomplete,
  getButton,
  getCheckbox,
  getDialog,
  getInput,
  getRadioGroup,
  getSelect,
  selectAutocompleteOption,
  selectRadioOption,
} from '../shared/material-harness-utils';
import {
  ADD_BUTTON_CLIPBOARD,
  ADDRESS_TYPE_ORDINARY,
  ADDRESS_TYPE_OTHER_FACILITY,
  ADDRESS_TYPE_PRIMARY,
  ADDRESS_TYPE_PRIMARYASCURRENT,
  ADDRESS_TYPE_SUBMITTING_FACILITY,
  CLIPBOARD_KEY_CURRENT_TYPE,
  CLIPBOARD_KEY_RESIDENCE_TYPE,
  CLIPBOARD_LABEL_COUNTRY_DE,
  CLIPBOARD_LABEL_COUNTRY_KP,
  CLIPBOARD_VALUE_CITY,
  CLIPBOARD_VALUE_HOUSENR,
  CLIPBOARD_VALUE_INSTITUTION_NAME,
  CLIPBOARD_VALUE_STREET,
  CLIPBOARD_VALUE_ZIP,
  FIELD_COPY_ADDRESS,
  FIELD_CURRENT_ADDRESS_CITY,
  FIELD_CURRENT_ADDRESS_COUNTRY,
  FIELD_CURRENT_ADDRESS_HOUSE_NUMBER,
  FIELD_CURRENT_ADDRESS_INSTITUTION_NAME,
  FIELD_CURRENT_ADDRESS_STREET,
  FIELD_CURRENT_ADDRESS_ZIP,
  FIELD_MATERIAL,
  FIELD_PATHOGEN_DISPLAY,
  FIELD_RESIDENCE_ADDRESS_CITY,
  FIELD_RESIDENCE_ADDRESS_COUNTRY,
  FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER,
  FIELD_RESIDENCE_ADDRESS_STREET,
  FIELD_RESIDENCE_ADDRESS_ZIP,
  VALUE_EMPTY,
} from '../shared/test-constants';
import {
  TEST_DATA,
  TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_FULL,
  TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_SINGLE,
  TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_SINGLE_OTHER_FACILITY,
  TEST_PARAMETER_CLIPBOARD_RESIDENCE_ADDRESS_FULL,
  TEST_PARAMETER_CLIPBOARD_RESIDENCE_ADDRESS_SINGLE_PRIMARY,
} from '../shared/test-data';
import { specimenDTO, TEST_FACILITY, TEST_NOTIFICATION_CATEGORY, TEST_NOTIFIED_PERSON } from '../shared/test-objects';
import { setDiagnosticBasedOnPathogenSelection, setSelectedPathogenCodeDisplay } from '../shared/test-setup-utils';
import {
  buildClipboardString,
  clickNextButton,
  createClipboardStringFromObject,
  switchToPage,
  verifyAutocompleteField,
  verifyInputFieldValues,
  verifyRadioButton,
  verifySelectField,
  verifyStateOfDiagnosticPage,
} from '../shared/test-utils';
import { buildMock, mainConfig, setupIntegrationTests } from './integration.base.spec';

describe('Pathogen - Clipboard Integration Tests with FEATURE_FLAG_PORTAL_PASTEBOX', () => {
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  const testClipboardFieldMappingOfNotifiedPersonAddressFor = parameters => {
    parameters.forEach(({ key, value, addressType, selector }) => {
      it(`for the key: '${key}', and the value: '${value}' and the addressType: '${addressType}' I expect the input field to be '${selector}'`, async () => {
        const isCurrent = addressType !== ADDRESS_TYPE_PRIMARY && addressType !== ADDRESS_TYPE_ORDINARY;
        const radioGroup = await getRadioGroup(loader, isCurrent ? '#currentAddressType' : '#residenceAddressType');
        expect(await radioGroup.getCheckedValue()).toBe(isCurrent ? null : ADDRESS_TYPE_PRIMARY);

        const p = lastValueFrom(of(`URL ${isCurrent ? CLIPBOARD_KEY_CURRENT_TYPE : CLIPBOARD_KEY_RESIDENCE_TYPE}=${addressType}&${key}=${value}`));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);

        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();

        fixture.detectChanges();
        expect(await radioGroup.getCheckedValue()).toBe(addressType);
        const inputField = await getInput(loader, selector);

        expect(await inputField.getValue()).toBe(value);
      });
    });
  };

  beforeEach(async () => await buildMock(true));
  beforeEach(() => {
    const result = setupIntegrationTests({
      ...mainConfig,
      featureFlags: {
        ...mainConfig.featureFlags,
        FEATURE_FLAG_PORTAL_PASTEBOX: true,
      },
    });
    spyOn(window.navigator.clipboard, 'writeText');

    fixture = result.fixture;
    setSelectedPathogenCodeDisplay(null);
    setDiagnosticBasedOnPathogenSelection(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP);
    loader = result.loader;
    fixture.detectChanges();
  });

  describe('Notifier Facility', () => {
    it('should fill all values of notifier facility', async () => {
      const notifierTestFacility = TEST_FACILITY('notifier');
      const clipboardString = createClipboardStringFromObject(notifierTestFacility, 'URL ');
      const p = lastValueFrom(of(clipboardString.concat(clipboardString)));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      fixture.detectChanges();
      await verifyInputFieldValues(loader, [
        {
          selector: notifierTestFacility.institutionName.selector,
          expectedValue: notifierTestFacility.institutionName.clipboardValue,
        },
      ]);
    });
  });

  describe('Submitting Facility', () => {
    it('should fill all values of submitting facility', async () => {
      const submittingTestFacility = TEST_FACILITY('submitter');
      const clipboardString = createClipboardStringFromObject(submittingTestFacility, 'URL ');
      const p = lastValueFrom(of(clipboardString.concat(clipboardString)));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      fixture.detectChanges();
      await clickNextButton(fixture);
      await verifyInputFieldValues(loader, [
        {
          selector: submittingTestFacility.institutionName.selector,
          expectedValue: submittingTestFacility.institutionName.clipboardValue,
        },
      ]);
    });

    describe('Validation of salutation when using clipboard data button', () => {
      let salutationSelect: MatSelectHarness;

      beforeEach(async () => {
        await clickNextButton(fixture);
        salutationSelect = await getSelect(loader, '#salutation');
        expect(await salutationSelect.getValueText()).toBe('Bitte auswählen');
      });

      it('should cause error for invalid salutation', async () => {
        const p = lastValueFrom(of('URL S.salutation=W'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await salutationSelect.getValueText()).toBe('Bitte auswählen');
      });

      it('should set valid female value from clipboard', async () => {
        const p = lastValueFrom(of('URL S.salutation=Mrs'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await salutationSelect.getValueText()).toBe('Frau');
      });

      it('should set valid none value from clipboard', async () => {
        const p = lastValueFrom(of('URL S.salutation=None'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await salutationSelect.getValueText()).toBe('Keine Anrede');
      });
    });

    describe('test checkbox behavior', () => {
      const mockClipboard = async (clipboardData: string) => {
        const p = lastValueFrom(of(clipboardData));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
      };

      const checkCheckboxAndAssertDisabled = async (checkboxSelector: string, inputSelector: string) => {
        const checkbox = await getCheckbox(loader, checkboxSelector);
        await checkbox.check();
        expect(await checkbox.isChecked()).toBe(true);

        const inputField = await getInput(loader, inputSelector);
        expect(await inputField.isDisabled()).toBe(true);
      };

      it('should overwrite checkbox when entering clipboard data that includes submitter data', async () => {
        await clickNextButton(fixture);
        const submitter = TEST_FACILITY('submitter');
        await checkCheckboxAndAssertDisabled(`#${FIELD_COPY_ADDRESS}`, submitter.institutionName.selector);

        const clipboardString = createClipboardStringFromObject(submitter, 'URL ');
        await mockClipboard(clipboardString.concat(clipboardString));
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        const checkbox = await getCheckbox(loader, `#${FIELD_COPY_ADDRESS}`);
        const inputField = await getInput(loader, submitter.institutionName.selector);

        expect(await checkbox.isChecked()).toBe(false);
        expect(await inputField.isDisabled()).toBe(false);
        expect(await inputField.getValue()).toBe(submitter.institutionName.clipboardValue);
      });

      it('should not overwrite checkbox when clipboard data does not include submitter data', async () => {
        await clickNextButton(fixture);
        await checkCheckboxAndAssertDisabled(`#${FIELD_COPY_ADDRESS}`, TEST_FACILITY('submitter').institutionName.selector);

        await mockClipboard('URL P.family=Schulz');
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        const checkbox = await getCheckbox(loader, `#${FIELD_COPY_ADDRESS}`);
        const inputField = await getInput(loader, TEST_FACILITY('submitter').institutionName.selector);

        expect(await checkbox.isChecked()).toBe(true);
        expect(await inputField.isDisabled()).toBe(true);
      });
    });
  });

  describe('Notified Person', () => {
    beforeEach(async () => {
      await clickNextButton(fixture);
      await clickNextButton(fixture);
    });

    it('should fill all values of notified person', async () => {
      const clipboardString = createClipboardStringFromObject(TEST_NOTIFIED_PERSON, 'URL ');
      const p = lastValueFrom(of(clipboardString.concat(clipboardString)));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      fixture.detectChanges();
      await verifyInputFieldValues(loader, [
        {
          selector: TEST_NOTIFIED_PERSON.firstName.selector,
          expectedValue: TEST_NOTIFIED_PERSON.firstName.clipboardValue,
        },
      ]);
    });

    describe('Validation of gender when using clipboard data button', async () => {
      it('should cause error for invalid gender', async () => {
        const genderSelect = await getSelect(loader, '#gender');
        const selectedGender = await genderSelect.getValueText();
        expect(selectedGender).toBe('Bitte auswählen');

        const p = lastValueFrom(of('URL P.gender=W'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await genderSelect.getValueText()).toBe('Bitte auswählen');
      });

      it('should set valid value from clipboard', async () => {
        const genderSelect = await getSelect(loader, '#gender');
        const selectedGender = await genderSelect.getValueText();
        expect(selectedGender).toBe('Bitte auswählen');

        const p = lastValueFrom(of('URL P.gender=Female'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await genderSelect.getValueText()).toBe('Weiblich');
      });
    });

    describe('Validation of residenceAddress when using clipboard data button', () => {
      describe('should map clipboard keys to appropriate fields', () => {
        testClipboardFieldMappingOfNotifiedPersonAddressFor(TEST_PARAMETER_CLIPBOARD_RESIDENCE_ADDRESS_SINGLE_PRIMARY);
      });

      it('primary should be checked', async () => {
        const radioGroup = await getRadioGroup(loader, '#residenceAddressType');
        expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_PRIMARY);
      });

      it('should not reset values when a new residenceAddressType is inserted', async () => {
        const streetInput = await getInput(loader, `#${FIELD_RESIDENCE_ADDRESS_STREET}`);
        await streetInput.setValue(CLIPBOARD_VALUE_STREET);
        await streetInput.blur();
        expect(await streetInput.getValue()).toBe(CLIPBOARD_VALUE_STREET);

        const p = lastValueFrom(of('URL P.r.type=ordinary'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await streetInput.getValue()).toBe(CLIPBOARD_VALUE_STREET);
      });

      it('should insert all fields for ordinary', async () => {
        const clipboardString = buildClipboardString(TEST_PARAMETER_CLIPBOARD_RESIDENCE_ADDRESS_FULL);
        const p = lastValueFrom(of(clipboardString));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);

        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();

        fixture.detectChanges();
        const radioGroup = await getRadioGroup(loader, '#residenceAddressType');
        expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_ORDINARY);

        await verifyInputFieldValues(loader, [
          {
            selector: `#${FIELD_RESIDENCE_ADDRESS_HOUSE_NUMBER}`,
            expectedValue: CLIPBOARD_VALUE_HOUSENR,
          },
          {
            selector: `#${FIELD_RESIDENCE_ADDRESS_STREET}`,
            expectedValue: CLIPBOARD_VALUE_STREET,
          },
          {
            selector: `#${FIELD_RESIDENCE_ADDRESS_ZIP}`,
            expectedValue: CLIPBOARD_VALUE_ZIP,
          },
          {
            selector: `#${FIELD_RESIDENCE_ADDRESS_CITY}`,
            expectedValue: CLIPBOARD_VALUE_CITY,
          },
        ]);

        const residenceCountry = await getSelect(loader, `#${FIELD_RESIDENCE_ADDRESS_COUNTRY}`);
        expect(await residenceCountry.getValueText()).toBe(CLIPBOARD_LABEL_COUNTRY_DE);
      });
    });
    describe('Validation of currentAddress when using clipboard data button', () => {
      describe('should map clipboard keys to appropriate fields', () => {
        testClipboardFieldMappingOfNotifiedPersonAddressFor(TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_SINGLE);
        testClipboardFieldMappingOfNotifiedPersonAddressFor(TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_SINGLE_OTHER_FACILITY);
      });

      it('should check primaryAsCurrent', async () => {
        const radioGroup = await getRadioGroup(loader, '#currentAddressType');
        expect(await radioGroup.getCheckedValue()).toBe(null);
        const p = lastValueFrom(of(`URL P.c.type=${ADDRESS_TYPE_PRIMARYASCURRENT}`));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);

        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();

        fixture.detectChanges();
        expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_PRIMARYASCURRENT);
      });

      it('should reset values when a new currentAddressType is inserted', async () => {
        const radioGroup = await getRadioGroup(loader, '#currentAddressType');
        await selectRadioOption(radioGroup, 'andere Einrichtung / Unterkunft');
        expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_OTHER_FACILITY);

        const streetInput = await getInput(loader, `#${FIELD_CURRENT_ADDRESS_STREET}`);
        await streetInput.setValue(CLIPBOARD_VALUE_STREET);
        await streetInput.blur();
        expect(await streetInput.getValue()).toBe(CLIPBOARD_VALUE_STREET);

        const p = lastValueFrom(of('URL P.c.type=current'));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        fixture.detectChanges();

        expect(await streetInput.getValue()).toBe(VALUE_EMPTY);
      });

      it('should not select type submittingFacility when submittingFacility is empty', async () => {
        const radioGroup = await getRadioGroup(loader, '#currentAddressType');
        expect(await radioGroup.getCheckedValue()).toBe(null);

        const p = lastValueFrom(of(`URL P.c.type=${ADDRESS_TYPE_SUBMITTING_FACILITY}`));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();

        fixture.detectChanges();

        const documentRootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
        const dialog = await getDialog(documentRootLoader, '.mat-mdc-dialog-container');
        expect(dialog).toBeTruthy();

        // Titeltext prüfen
        const title = await dialog.getTitleText();
        expect(title).toMatch(/Fehler bei der Auswahl der Adresse/);

        await (await getButton(documentRootLoader, '#close-btn')).click();
        expect(await radioGroup.getCheckedValue()).toBe(null);
      });

      it('should insert all values for otherFacility', async () => {
        const radioGroup = await getRadioGroup(loader, '#currentAddressType');
        expect(await radioGroup.getCheckedValue()).toBe(null);
        const clipboardString = buildClipboardString(TEST_PARAMETER_CLIPBOARD_CURRENT_ADDRESS_FULL);
        const p = lastValueFrom(of(clipboardString));
        spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);

        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();

        fixture.detectChanges();
        expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_OTHER_FACILITY);

        await verifyInputFieldValues(loader, [
          {
            selector: `#${FIELD_CURRENT_ADDRESS_INSTITUTION_NAME}`,
            expectedValue: CLIPBOARD_VALUE_INSTITUTION_NAME,
          },
          {
            selector: `#${FIELD_CURRENT_ADDRESS_HOUSE_NUMBER}`,
            expectedValue: CLIPBOARD_VALUE_HOUSENR,
          },
          {
            selector: `#${FIELD_CURRENT_ADDRESS_STREET}`,
            expectedValue: CLIPBOARD_VALUE_STREET,
          },
          {
            selector: `#${FIELD_CURRENT_ADDRESS_ZIP}`,
            expectedValue: CLIPBOARD_VALUE_ZIP,
          },
          {
            selector: `#${FIELD_CURRENT_ADDRESS_CITY}`,
            expectedValue: CLIPBOARD_VALUE_CITY,
          },
        ]);

        const currentCountry = await getSelect(loader, `#${FIELD_CURRENT_ADDRESS_COUNTRY}`);
        expect(await currentCountry.getValueText()).toBe(CLIPBOARD_LABEL_COUNTRY_KP);
      });
    });
  });

  describe('NotificationCategory and Diagnostic', () => {
    beforeEach(async () => {
      await switchToPage(4, fixture);
    });

    describe('Clipboard Data Tests', () => {
      it('should fill page 4 & 5 (Meldetatbestand & Diagnostik) with clipboard data', async () => {
        // preparation
        const clipboardStringNotificationCategory = createClipboardStringFromObject(TEST_NOTIFICATION_CATEGORY, 'URL ');
        const clipboardStringSpecimen = createClipboardStringFromObject(specimenDTO, '&');
        const p = lastValueFrom(of(clipboardStringNotificationCategory.concat(clipboardStringSpecimen)));
        const clipboardData = clipboardStringNotificationCategory.concat(clipboardStringSpecimen).replace('undefined=undefined&', '');
        console.log('clipboardData', clipboardData);
        spyOn(window.navigator.clipboard, 'readText').and.resolveTo(clipboardData);
        await verifyStateOfDiagnosticPage(loader, 'disabled_step');
        // set code for influenzavirus due to local storage issue
        setSelectedPathogenCodeDisplay(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.codeDisplay);

        // click Datenübernahme button and switch to page Meldetatbestand
        await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
        await switchToPage(4, fixture);
        fixture.detectChanges();
        // assert that page 4 (notificationCategory) has the correct values from clipboard
        await verifySelectField(loader, {
          expectedValue: TEST_NOTIFICATION_CATEGORY.federalStateCodeDisplay.value,
          selector: TEST_NOTIFICATION_CATEGORY.federalStateCodeDisplay.selector,
        });
        await verifyAutocompleteField(loader, {
          expectedValue: TEST_NOTIFICATION_CATEGORY.pathogenDisplay.value,
          selector: TEST_NOTIFICATION_CATEGORY.pathogenDisplay.selector,
        });
        await verifyAutocompleteField(loader, {
          expectedValue: TEST_NOTIFICATION_CATEGORY.pathogen.value,
          selector: TEST_NOTIFICATION_CATEGORY.pathogen.selector,
        });
        await verifyRadioButton(loader, {
          expectedValue: TEST_NOTIFICATION_CATEGORY.reportStatus.value,
          selector: TEST_NOTIFICATION_CATEGORY.reportStatus.selector,
        });
        await verifyInputFieldValues(loader, [
          {
            expectedValue: TEST_NOTIFICATION_CATEGORY.initialNotificationId.value,
            selector: TEST_NOTIFICATION_CATEGORY.initialNotificationId.selector,
          },
          {
            expectedValue: TEST_NOTIFICATION_CATEGORY.interpretation.value,
            selector: TEST_NOTIFICATION_CATEGORY.interpretation.selector,
          },
        ]);

        // assert that page 5 (specimen) has the correct values from clipboard
        await verifyStateOfDiagnosticPage(loader, null);
        await clickNextButton(fixture);
        await verifyInputFieldValues(loader, [
          {
            expectedValue: specimenDTO.extractionDate.value,
            selector: specimenDTO.extractionDate.selector,
          },
          {
            expectedValue: specimenDTO.receivedDate.value,
            selector: specimenDTO.receivedDate.selector,
          },
          {
            expectedValue: specimenDTO.material.value,
            selector: specimenDTO.material.selector,
          },
        ]);
      });
    });

    it('should overwrite diagnostic data after clipboard with new material', async () => {
      // set code for influenzavirus
      const pathogenDisplay = await getAutocomplete(loader, `#${FIELD_PATHOGEN_DISPLAY}`);
      await selectAutocompleteOption(pathogenDisplay, 'Influenzavirus');
      setSelectedPathogenCodeDisplay(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.codeDisplay);
      fixture.detectChanges();
      expect(await pathogenDisplay.getValue()).toBe(TEST_DATA.pathogenCodeDisplays[0].designations[0].value);

      // go to page 5 and set material
      await switchToPage(5, fixture);
      const material = await getAutocomplete(loader, `#${FIELD_MATERIAL}`);
      await selectAutocompleteOption(material, 'Sputum');
      expect(await material.getValue()).toBe('Sputum');

      // overwrite material with clipboard data
      const p = lastValueFrom(of('URL T.material=123038009'));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      fixture.detectChanges();
      // assert that material was overwritten with clipboard data
      expect(await material.getValue()).toBe('Anderes Untersuchungsmaterial');
    });

    it('should not overwrite diagnostic data after clipboard with empty material', async () => {
      // set code for influenzavirus
      const pathogenDisplay = await getAutocomplete(loader, `#${FIELD_PATHOGEN_DISPLAY}`);
      await selectAutocompleteOption(pathogenDisplay, 'Influenzavirus');
      setSelectedPathogenCodeDisplay(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.codeDisplay);
      fixture.detectChanges();
      expect(await pathogenDisplay.getValue()).toBe(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.codeDisplay.designations[0].value);

      // go to page 5 and set material
      await switchToPage(5, fixture);
      const material = await getAutocomplete(loader, `#${FIELD_MATERIAL}`);
      await selectAutocompleteOption(material, 'Sputum');
      expect(await material.getValue()).toBe('Sputum');

      // insert empty material via clipboard
      const p = lastValueFrom(of('URL T.material='));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      fixture.detectChanges();

      // assert that material was not overwritten or cleared
      expect(await material.getValue()).toBe('Sputum');
    });

    it('should fill all mandatory values on page 4 + 5, clear & overwrite pathogen', async () => {
      const clipboardStringNotificationCategory = createClipboardStringFromObject(TEST_NOTIFICATION_CATEGORY, 'URL ');
      const clipboardStringSpecimen = createClipboardStringFromObject(specimenDTO, '&');
      const p = lastValueFrom(of(clipboardStringNotificationCategory.concat(clipboardStringSpecimen)));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);

      // set code for influenzavirus due to local storage issue
      setSelectedPathogenCodeDisplay(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.codeDisplay);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      await switchToPage(4, fixture);
      fixture.detectChanges();
      await (await getButton(loader, '#clear-pathogen')).click();
      fixture.detectChanges();
      // assert that page 4 (notificationCategory) values are empty
      await verifyAutocompleteField(loader, {
        expectedValue: '',
        selector: TEST_NOTIFICATION_CATEGORY.pathogenDisplay.selector,
      });
      await verifyAutocompleteField(loader, {
        expectedValue: '',
        selector: TEST_NOTIFICATION_CATEGORY.pathogen.selector,
      });
      // assert page 5 cannot be clicked
      await verifyStateOfDiagnosticPage(loader, 'disabled_step');
    });

    it('should fill all mandatory values on page 4 + 5, overwrite subpathogen', async () => {
      const clipboardStringNotificationCategory = createClipboardStringFromObject(TEST_NOTIFICATION_CATEGORY, 'URL ');
      const clipboardStringSpecimen = createClipboardStringFromObject(specimenDTO, '&');
      const p = lastValueFrom(of(clipboardStringNotificationCategory.concat(clipboardStringSpecimen)));
      spyOn(window.navigator.clipboard, 'readText').and.returnValue(p);

      // set code for influenzavirus due to local storage issue
      setSelectedPathogenCodeDisplay(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP.codeDisplay);
      await (await getButton(loader, ADD_BUTTON_CLIPBOARD)).click();
      await switchToPage(4, fixture);
      fixture.detectChanges();
      await (await getButton(loader, '#clear-pathogen')).click();
      fixture.detectChanges();
      // assert that page 4 (notificationCategory) values are empty
      await verifyAutocompleteField(loader, {
        expectedValue: '',
        selector: TEST_NOTIFICATION_CATEGORY.pathogenDisplay.selector,
      });
      await verifyAutocompleteField(loader, {
        expectedValue: '',
        selector: TEST_NOTIFICATION_CATEGORY.pathogen.selector,
      });
      // assert page 5 cannot be clicked
      await verifyStateOfDiagnosticPage(loader, 'disabled_step');
    });

    // overwrite pathogen -> all fields should be empty
    // overwrite subpathogen -> all fields except for subpathogen should be empty (check cross?)
    // overwrite specimenList -> all fields except for specimenList should be empty
  });
});
