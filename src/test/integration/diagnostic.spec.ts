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

import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { TestBed } from '@angular/core/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { getHtmlButtonElement } from '../shared/html-element-utils';
import { getAutocomplete, getButton, getInput, getRadioGroup, getSelect, selectAutocompleteOption, selectRadioOption } from '../shared/material-harness-utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { setDiagnosticBasedOnPathogenSelection, setSelectedPathogenCodeDisplay } from '../shared/test-setup-utils';
import {
  checkDescribingError,
  clickAddDiagnosticButton,
  clickAddSpecimenButton,
  clickDeleteButton,
  getStepHeader,
  setInputFieldValue,
  switchToPage,
} from '../shared/test-utils';
import {
  ERROR_EXTRACTION_DATE,
  FIELD_EXTRACTION_DATE,
  FIELD_FEDERAL_STATE,
  FIELD_INIT_NOTIFICATION_ID,
  FIELD_INTERPRETATION,
  FIELD_MATERIAL,
  FIELD_METHOD,
  FIELD_METHOD_0,
  FIELD_PATHOGEN,
  FIELD_PATHOGEN_DISPLAY,
  FIELD_RECEIVED_DATE,
  FIELD_REPORT_STATUS,
  FIELD_RESULT,
  MATERIAL_VALUE_INVP,
  METHOD_VALUE_2_INVP,
  METHOD_VALUE_INVP,
  PATHOGEN_DISPLAY,
  SPECIMEN_TITLE,
  VALID_DATE_AFTER,
  VALID_DATE_BEFORE,
  VALUE_EMPTY,
} from '../shared/test-constants';
import { TEST_DATA, TEST_PARAMETER_VALIDATION } from '../shared/test-data';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MethodPathogenDTO } from '../../api/notification';
import { RESULT_OPTION_LIST } from '../../app/pathogen-notification/legacy/formly-options-lists';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { buildMock, mainConfig, setupIntegrationTests } from './base';
import ResultEnum = MethodPathogenDTO.ResultEnum;

describe('Pathogen - Diagnostic Integration Tests', () => {
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

  const testValidationForAutocomplete = parameters => {
    parameters.forEach(({ field, value, expectedResult }) => {
      it(`for the field: '${field}', the value: '${value}' should throw the error: '${expectedResult}'`, async () => {
        const autocomplete = await getAutocomplete(loader, `#${field}`);
        await setInputFieldValue(loader, `#${field}`, value, fixture);
        await checkDescribingError(fixture, autocomplete, expectedResult);
      });
    });
  };

  beforeEach(async () => await buildMock(true));
  beforeEach(() => {
    const result = setupIntegrationTests();

    fixture = result.fixture;
    component = result.component;
    loader = result.loader;

    fetchCountryCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchCountryCodeDisplays as jasmine.Spy;
    fetchFederalStateCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchFederalStateCodeDisplays as jasmine.Spy;
    fetchPathogenCodeDisplaysByTypeAndStateSpy = TestBed.inject(FhirPathogenNotificationService).fetchPathogenCodeDisplaysByTypeAndState as jasmine.Spy;
    getNotifierFacilitySpy = TestBed.inject(PathogenNotificationStorageService).getNotifierFacility as jasmine.Spy;
    getSelectedPathogenCodeDisplaySpy = TestBed.inject(PathogenNotificationStorageService).getSelectedPathogenCodeDisplay as jasmine.Spy;
    fetchDiagnosticsBasedOnPathogenSelectionSpy = TestBed.inject(FhirPathogenNotificationService).fetchDiagnosticsBasedOnPathogenSelection as jasmine.Spy;
    setSelectedPathogenCodeDisplay(null);
    setDiagnosticBasedOnPathogenSelection(TEST_DATA.diagnosticBasedOnPathogenSelectionINVP);

    fixture.detectChanges();
  });

  describe('NotificationCategory and Diagnostic', () => {
    // Meldetatbestand
    let federalStateCodeDisplay: MatSelectHarness;
    let pathogenDisplay: MatAutocompleteHarness;
    let pathogen: MatAutocompleteHarness;
    let reportStatus: MatRadioGroupHarness;
    let initialNotificationId: MatInputHarness;
    let laboratoryOrderId: MatInputHarness;
    let interpretation: MatInputHarness;

    // Diagnostik
    let extractionDate: MatInputHarness;
    let receivedDate: MatInputHarness;
    let material: MatAutocompleteHarness;
    let method: MatAutocompleteHarness;
    let result: MatRadioGroupHarness;

    beforeEach(async () => {
      await switchToPage(4, fixture);
      federalStateCodeDisplay = await getSelect(loader, `#${FIELD_FEDERAL_STATE}`);
      pathogenDisplay = await getAutocomplete(loader, `#${FIELD_PATHOGEN_DISPLAY}`);
      pathogen = await getAutocomplete(loader, `#${FIELD_PATHOGEN}`);
      reportStatus = await getRadioGroup(loader, `#${FIELD_REPORT_STATUS}`);
      initialNotificationId = await getInput(loader, `#${FIELD_INIT_NOTIFICATION_ID}`);
      laboratoryOrderId = await getInput(loader, `#${FIELD_INIT_NOTIFICATION_ID}`);
      interpretation = await getInput(loader, `#${FIELD_INTERPRETATION}`);
    });

    it('should check default values on Meldetatbestands Page', async () => {
      expect(getStepHeader(fixture)).toBe(' Schritt 4 von 5 ');

      expect(await federalStateCodeDisplay.getValueText()).toBe('Baden-Württemberg');
      expect(await federalStateCodeDisplay.isDisabled()).toBe(false);

      expect(await pathogenDisplay.getValue()).toBe(VALUE_EMPTY);
      expect(await pathogenDisplay.isDisabled()).toBe(false);

      expect(await pathogen.getValue()).toBe(VALUE_EMPTY);
      expect(await pathogen.isDisabled()).toBe(true);

      expect(await reportStatus.getCheckedValue()).toBe(null);

      expect(await initialNotificationId.getValue()).toBe(VALUE_EMPTY);
      expect(await initialNotificationId.isDisabled()).toBe(true);

      expect(await laboratoryOrderId.getValue()).toBe(VALUE_EMPTY);
      expect(await laboratoryOrderId.isDisabled()).toBe(true);

      expect(await interpretation.getValue()).toBe(VALUE_EMPTY);
      expect(await interpretation.isDisabled()).toBe(true);
    });

    describe('Diagnostic only', () => {
      beforeEach(async () => {
        await setInputFieldValue(loader, `#${FIELD_PATHOGEN_DISPLAY}`, PATHOGEN_DISPLAY, fixture);
        await switchToPage(5, fixture);
        expect(getStepHeader(fixture)).toBe(' Schritt 5 von 5 ');
        expect(await getButton(loader, '#btn-weitere-probe-hinzufügen')).toBeTruthy();
        extractionDate = await getInput(loader, `#${FIELD_EXTRACTION_DATE}`);
        receivedDate = await getInput(loader, `#${FIELD_RECEIVED_DATE}`);
        material = await getAutocomplete(loader, `#${FIELD_MATERIAL}`);
        method = await getAutocomplete(loader, `#${FIELD_METHOD}_0`);
        result = await getRadioGroup(loader, `#${FIELD_RESULT}_0`);
      });

      async function checkDiagnosticPage(
        extractionDateValue: string,
        receivedDateValue: string,
        materialValue: string,
        methodValue: string,
        resultValue: string
      ) {
        expect(await extractionDate.getValue()).toBe(extractionDateValue);
        expect(await receivedDate.getValue()).toBe(receivedDateValue);
        expect(await material.getValue()).toBe(materialValue);
        expect(await method.getValue()).toBe(methodValue);
        expect(await result.getCheckedValue()).toBe(resultValue);
      }

      async function fillFirstSpecimen() {
        await extractionDate.setValue(VALID_DATE_BEFORE);
        await receivedDate.setValue(VALID_DATE_AFTER);
        await setInputFieldValue(loader, `#${FIELD_MATERIAL}`, MATERIAL_VALUE_INVP, fixture);
        await setInputFieldValue(loader, `#${FIELD_METHOD_0}`, METHOD_VALUE_INVP, fixture);
        await selectRadioOption(result, RESULT_OPTION_LIST[0].label);
      }

      async function checkPanels(numberOfPanels: number, titles: string[]) {
        const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
        expect(panels.length).toBe(numberOfPanels);
        for (let i = 0; i < titles.length; i++) {
          expect(await panels[i].getTitle()).toBe(titles[i]);
        }
        return panels;
      }

      it('should check default values on Diagnostic Page', async () => {
        await checkDiagnosticPage(VALUE_EMPTY, VALUE_EMPTY, VALUE_EMPTY, VALUE_EMPTY, null);
        await checkPanels(1, [SPECIMEN_TITLE]);
      });

      it('should fill out values on Diagnostic Page for first specimen', async () => {
        await checkPanels(1, [SPECIMEN_TITLE]);
        await fillFirstSpecimen();
        await checkPanels(1, ['Diagnostik aus ' + MATERIAL_VALUE_INVP + ' vom ' + VALID_DATE_AFTER]);
        await checkDiagnosticPage(VALID_DATE_BEFORE, VALID_DATE_AFTER, MATERIAL_VALUE_INVP, METHOD_VALUE_INVP, ResultEnum.Pos);
      });

      it('should add diagnostic on button click and remove it', async () => {
        await fillFirstSpecimen();
        await clickAddDiagnosticButton(fixture);
        const result1 = await getRadioGroup(loader, `#${FIELD_RESULT}_1`);
        await setInputFieldValue(loader, `#${FIELD_METHOD}_1`, METHOD_VALUE_2_INVP, fixture);
        await selectRadioOption(result1, RESULT_OPTION_LIST[1].label);
        await clickDeleteButton(fixture, 'methodPathogenList_1');
      });

      it('should add second specimen and check titles and delete button', async () => {
        const disabledButtonCssClass = 'disabled-button';
        await fillFirstSpecimen();
        await checkPanels(1, ['Diagnostik aus ' + MATERIAL_VALUE_INVP + ' vom ' + VALID_DATE_AFTER]);
        await clickAddSpecimenButton(fixture);
        const panels = await checkPanels(2, [SPECIMEN_TITLE, 'Diagnostik aus ' + MATERIAL_VALUE_INVP + ' vom ' + VALID_DATE_AFTER]);
        const deleteButtonOne = getHtmlButtonElement(fixture.nativeElement, `#btn-delete-addSpecimen_0`);
        const deleteButtonTwo = getHtmlButtonElement(fixture.nativeElement, `#btn-delete-addSpecimen_1`);
        expect(deleteButtonTwo.classList.contains(disabledButtonCssClass)).toBe(true);
        expect(deleteButtonOne.classList.contains(disabledButtonCssClass)).toBe(false);
        await panels[1].expand();
        expect(deleteButtonTwo.classList.contains(disabledButtonCssClass)).toBe(false);
        expect(deleteButtonOne.classList.contains(disabledButtonCssClass)).toBe(true);
        await clickDeleteButton(fixture, 'addSpecimen_1');
        await checkPanels(1, [SPECIMEN_TITLE]);
      });

      it('should add sequence of specimen and check that only first is expanded; deletes panels afterwards', async () => {
        const titleArray = [];
        for (let i = 1; i < 10; i++) {
          await clickAddSpecimenButton(fixture);
          titleArray.push(SPECIMEN_TITLE);
          const panels = await checkPanels(i + 1, titleArray);
          expect(await panels[0].isExpanded()).toBe(true);
          for (let j = 1; j < panels.length; j++) {
            expect(await panels[j].isExpanded()).toBe(false);
          }
        }
        for (let i = 1; i < 10; i++) {
          await clickDeleteButton(fixture, 'addSpecimen_1');
        }
        await checkPanels(1, [SPECIMEN_TITLE]);
      });

      describe('should test validation', async () => {
        it('should check that extraction date is after received date', async () => {
          await extractionDate.setValue(VALID_DATE_AFTER);
          await receivedDate.setValue(VALID_DATE_BEFORE);
          await receivedDate.blur();
          await checkDescribingError(fixture, receivedDate, ERROR_EXTRACTION_DATE);
        });
        testValidationFor(TEST_PARAMETER_VALIDATION.diagnostic.receivedDate);
        testValidationFor(TEST_PARAMETER_VALIDATION.diagnostic.extractionDate);
        testValidationForAutocomplete(TEST_PARAMETER_VALIDATION.diagnostic.material);
        testValidationForAutocomplete(TEST_PARAMETER_VALIDATION.diagnostic.method);
      });
    });
  });
});
