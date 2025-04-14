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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SideNavigationStepperComponent } from './side-navigation-stepper.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { RouterModule } from '@angular/router';

describe('SideNavigationStepperComponent', () => {
  let component: SideNavigationStepperComponent;
  let fixture: ComponentFixture<SideNavigationStepperComponent>;
  const index: number = 4;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([]), SideNavigationStepperComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavigationStepperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for inputs', () => {
    expect(component.steps).toEqual([]);
    expect(component.currentStep).toBeUndefined();
    expect(component.model).toBeUndefined();
  });

  it('should return true for isTouchedAndValid when field is valid and touched', () => {
    const field: FormlyFieldConfig = {
      key: 'test',
      formControl: { valid: true, touched: true } as any,
    };
    expect(component.isTouchedAndValid(field)).toBeTrue();
  });

  it('should return false for isTouchedAndValid when field is not valid or not touched', () => {
    const field: FormlyFieldConfig = {
      key: 'test',
      formControl: { valid: false, touched: true } as any,
    };
    expect(component.isTouchedAndValid(field)).toBeFalse();
  });

  it('should return true for isTouchedAndValid when field.key is null and fieldGroup is valid and touched', () => {
    const field: FormlyFieldConfig = {
      key: null,
      fieldGroup: [
        { formControl: { valid: true, touched: true } as any },
        {
          formControl: {
            valid: true,
            touched: true,
          } as any,
        },
      ],
    };
    expect(component.isTouchedAndValid(field)).toBeTrue();
  });

  it('should return true for isTouchedAndValid when field.key is null and fieldGroup is empty', () => {
    const field: FormlyFieldConfig = {
      key: null,
      fieldGroup: [],
    };
    expect(component.isTouchedAndValid(field)).toBeTrue();
  });

  it('should navigate on step change', () => {
    const routerSpy = spyOn(component['router'], 'navigate');
    const event: StepperSelectionEvent = { selectedIndex: 1, previouslySelectedIndex: 0 } as any;
    component.steps = [{ props: { anchor: 'step0' } } as FormlyFieldConfig, { props: { anchor: 'step1' } } as FormlyFieldConfig];
    component.onStepChange(event);
    expect(routerSpy).toHaveBeenCalledWith(['./'], { relativeTo: component['route'], fragment: 'step1' });
  });

  it('should return "disabled_step" for isEditable when pathogenDisplay is null', () => {
    component.model = { notificationCategory: { pathogenDisplay: null } };
    expect(component.isEditable(index)).toBe('disabled_step');
  });

  it('should return null for isEditable when pathogenDisplay is empty', () => {
    component.model = { notificationCategory: { pathogenDisplay: '' } };
    expect(component.isEditable(index)).toBe('disabled_step');
  });

  it('should return null for isEditable when pathogenDisplay is set', () => {
    component.model = { notificationCategory: { pathogenDisplay: 'Influenza' } };
    expect(component.isEditable(index)).toBeNull();
  });

  it('should return step key as ID if key is present', () => {
    const step: FormlyFieldConfig = { key: 'stepKey' } as any;
    const stepId = component.getStepId(step);
    expect(stepId).toBe('stepKey');
  });

  it('should return step label as ID if key is not present', () => {
    const step: FormlyFieldConfig = { props: { label: 'stepLabel' } } as any;
    const stepId = component.getStepId(step);
    expect(stepId).toBe('stepLabel');
  });

  it('should return undefined if neither key nor label is present', () => {
    const step: FormlyFieldConfig = {} as any;
    const stepId = component.getStepId(step);
    expect(stepId).toBe('undefined');
  });
});
