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

import { MatInputHarness } from '@angular/material/input/testing';
import { ComponentFixture } from '@angular/core/testing';
import { getHtmlButtonElement } from './html-element-utils';
import { HarnessLoader } from '@angular/cdk/testing';
import { getAutocomplete, getCheckbox, getInput, getRadioGroup, getSelect, getStepper, selectRadioOption } from './material-harness-utils';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { TestDataDiagnosticPage, TestDataFacilityPage, TestDataNotificationCategoryPage, TestDataNotifiedPersonPage } from './test-objects';
import { MatStepHarness } from '@angular/material/stepper/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { ADDRESS_TYPE_PRIMARYASCURRENT, ADDRESS_TYPE_SUBMITTING_FACILITY } from './test-constants';

export async function checkDescribingError(fixture: ComponentFixture<any>, input: MatInputHarness | MatAutocompleteHarness, expectedResult: string) {
  fixture.detectChanges();
  const describedby = await (await input.host()).getAttribute('aria-describedby');
  expect(describedby).withContext('input should have a describedby attribute').toBeTruthy();
  const errorElement = fixture.nativeElement.querySelector(`mat-error#${describedby}`);
  expect(errorElement).withContext('error element should be present').toBeTruthy();
  //errror is generally displayed in the formly-validation-message component
  // but in some cases it is displayed directly in the mat-error element
  if (errorElement.textContent) {
    expect(errorElement.textContent).withContext('expected message found directly inside mat-error').toContain(expectedResult);
    return;
  }
  const formlyError = errorElement.querySelector('formly-validation-message');
  expect(formlyError).withContext('formly-validation-message should be present').toBeTruthy();
  expect(formlyError.textContent).withContext('expected message inside formly-validation-message').toContain(expectedResult);
}

export async function clickAddSpecimenButton(fixture: ComponentFixture<any>) {
  const addSpecimenButton = getHtmlButtonElement(fixture.nativeElement, '#btn-weitere-probe-hinzufügen');
  await clickButton(addSpecimenButton, fixture);
}

export async function clickBackButton(fixture: ComponentFixture<any>) {
  const nextButton = getHtmlButtonElement(fixture.nativeElement, '#btn-nav-action-back');
  await clickButton(nextButton, fixture);
}

export async function clickNextButton(fixture: ComponentFixture<any>) {
  const nextButton = getHtmlButtonElement(fixture.nativeElement, '#btn-nav-action-next');
  await clickButton(nextButton, fixture);
}

export async function clickAddDiagnosticButton(fixture: ComponentFixture<any>) {
  const addDiagnosticButton = getHtmlButtonElement(fixture.nativeElement, '#btn-weitere-diagnostik-mit-derselben-probe-hinzufügen');
  await clickButton(addDiagnosticButton, fixture);
}

export async function clickDeleteButton(fixture: ComponentFixture<any>, selector: string) {
  const deleteButton = getHtmlButtonElement(fixture.nativeElement, `#btn-delete-${selector}`);
  await clickButton(deleteButton, fixture);
}

async function clickButton(button: HTMLButtonElement, fixture: ComponentFixture<any>) {
  expect(button).toBeTruthy();
  button.click();
  fixture.detectChanges();

  await fixture.whenStable(); // Wait for all async operations to complete
}

export async function setCheckboxTo(state: boolean, checkboxId: string, fixture: ComponentFixture<any>, loader: HarnessLoader, expectedState = state) {
  const checkbox = await getCheckbox(loader, `#${checkboxId}`);
  await (state ? checkbox.check() : checkbox.uncheck());
  expect(await checkbox.isChecked()).toBe(expectedState);
}

export async function verifyInputFieldValues(
  loader: HarnessLoader,
  fields: {
    selector: string;
    expectedValue: string;
  }[]
) {
  for (const { selector, expectedValue } of fields) {
    const input = await getInput(loader, selector);
    expect(await input.getValue()).toBe(expectedValue);
  }
}

export async function verifySelectField(
  loader: HarnessLoader,
  field: {
    selector: string;
    expectedValue: string;
  }
) {
  const selectField = await getSelect(loader, field.selector);
  expect(await selectField.getValueText()).toBe(field.expectedValue);
}

export async function verifyAutocompleteField(
  loader: HarnessLoader,
  field: {
    selector: string;
    expectedValue: string;
  }
) {
  const autocompleteField = await getAutocomplete(loader, field.selector);
  expect(await autocompleteField.getValue()).toBe(field.expectedValue);
}

export async function verifyRadioButton(
  loader: HarnessLoader,
  field: {
    selector: string;
    expectedValue: string;
  }
) {
  const radioButton = await getRadioGroup(loader, field.selector);
  expect(await radioButton.getCheckedValue()).toBe(field.expectedValue);
}

export async function setTextFieldValuesFor(parameters: { field: string; value: string }[], loader) {
  for (const { field, value } of parameters) {
    const input = await getInput(loader, `#${field}`);
    await input.setValue(value);
    await input.blur();
    expect(await input.getValue()).toBe(value);
  }
}

export async function setInputFieldValue(loader: HarnessLoader, selector: string, expectedValue: string, fixture: ComponentFixture<any>) {
  const input = await getInput(loader, selector);
  await input.setValue(expectedValue);
  await input.blur();
  fixture.detectChanges();
  expect(await input.getValue()).toBe(expectedValue);
}

export const buildClipboardString = (params: string[][]) => {
  let startString = 'URL ';
  for (const [key, value] of params) {
    startString = startString.concat(key + '=' + value + '&');
  }
  startString = startString.slice(0, -1);
  return startString;
};

export async function waitForStability(fixture: ComponentFixture<any>, timeout = 50) {
  await fixture.whenStable();
  fixture.detectChanges();
  // Add a small delay to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, timeout));
  fixture.detectChanges();
}

export async function selectPageByNumber(loader: HarnessLoader, fixture: ComponentFixture<any>, number: number) {
  const stepper = await getStepper(loader);
  const steps = await stepper.getSteps();
  await steps[number].select();
  await expectAsync(steps[number].isSelected()).toBeResolvedTo(true);
}

export async function switchToPage(pageNumber: number, fixture: ComponentFixture<any>) {
  const currentPage = 1;
  const clicksNeeded = pageNumber - currentPage;

  for (let i = 0; i < clicksNeeded; i++) {
    await clickNextButton(fixture);
  }
}

export function getStepHeader(fixture: ComponentFixture<any>): string {
  return fixture.nativeElement.querySelector('.oval-label').textContent;
}

export function createClipboardStringFromObject(
  myObject: TestDataDiagnosticPage | TestDataNotificationCategoryPage | TestDataFacilityPage | TestDataNotifiedPersonPage,
  start: string
) {
  return (
    start +
    Object.values(myObject)
      .map(property => `${property.clipboardDataKey}=${property.clipboardValue}`)
      .join('&')
  );
}

export async function verifyStateOfDiagnosticPage(loader: HarnessLoader, expectedState: string) {
  const steps = await loader.getAllHarnesses(MatStepHarness);
  expect(await steps[4].getAriaLabelledby()).toBe(expectedState);
}

export async function selectAndVerifySubmittingFacilityAsCurrentAddress(loader: HarnessLoader, fixture: MockedComponentFixture<PathogenNotificationComponent>) {
  await waitForStability(fixture, 100);
  const radioGroup = await getRadioGroup(loader, '#currentAddressType');
  await selectRadioOption(radioGroup, 'Wohnsitz');
  expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_PRIMARYASCURRENT);
  await waitForStability(fixture, 100);
  await selectRadioOption(radioGroup, 'Adresse der Einsender-Einrichtung');
  expect(await radioGroup.getCheckedValue()).toBe(ADDRESS_TYPE_SUBMITTING_FACILITY);
  await waitForStability(fixture);
}
