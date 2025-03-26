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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RepeatComponent } from './repeat.component';
import { FieldArrayTypeConfig, FormlyFieldConfig } from '@ngx-formly/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('RepeatComponent', () => {
  let component: RepeatComponent;
  let fixture: ComponentFixture<RepeatComponent>;

  const fieldArrayTypeConfig: FieldArrayTypeConfig = {
    formControl: undefined,
    id: 'addresses',
    key: 'addresses',
    type: 'repeat',
    props: {
      addText: 'Adresse hinzufügen',
    },
    fieldArray: {
      fieldGroupClassName: 'd-flex flex-column',
      fieldGroup: [],
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RepeatComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepeatComponent);
    component = fixture.componentInstance;
    component.field = fieldArrayTypeConfig;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set ID name correctly', () => {
    const formlyField: FormlyFieldConfig = {
      fieldGroup: [{ id: 'test', type: 'input' }],
    } as any;
    const idName = component.setIdName('type', formlyField, 0, 'test');
    expect(idName).toBe('type-test_0');
    expect(formlyField.fieldGroup![0].id).toBe('test_0');
  });

  it('should set ID name correctly without optional id', () => {
    const formlyField: FormlyFieldConfig = {
      fieldGroup: [{ id: 'test', type: 'input' }],
    } as any;
    const idName = component.setIdName('type', formlyField, 0);
    expect(idName).toBe('type-undefined_0');
    expect(formlyField.fieldGroup![0].id).toBe('test_0');
  });

  it('should set add button ID name correctly', () => {
    const buttonName = 'Add Address';
    const buttonId = component.setAddButtonIdName(buttonName);
    expect(buttonId).toBe('btn-add-address');
  });

  it('should identify lonely fields correctly', () => {
    const formlyField = { parent: { model: [1] } } as any;
    expect(component.isLonely(formlyField)).toBeTrue();
  });
});
