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

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { StepNavigation } from '@gematik/demis-portal-core-library';
import { FieldType, FormlyFieldConfig, FormlyForm, FormlyModule } from '@ngx-formly/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathogenConstants } from '../../pathogen-notification/common/constants';
import { NotificationStepFormComponent } from '../notification-step-form/notification-step-form.component';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { SubmittingFacilityComponent } from './submitting-facility.component';

@Component({
  imports: [ReactiveFormsModule],
  template: '<input [formControl]="formControl" />',
})
class SubmittingFacilityInputTestComponent extends FieldType {}

describe('SubmittingFacilityComponent', () => {
  let fixture: ComponentFixture<SubmittingFacilityComponent>;
  let service: {
    submittingFacilityGroup: FormGroup;
    submittingFacilityModel: ReturnType<typeof signal<{ institutionName: string }>>;
    submitterFacilityFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    notifierFacilityGroup: FormGroup;
    notifierFacilityModel: ReturnType<typeof signal<{ institutionName: string }>>;
    notifierFacilityFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    sendData: ReturnType<typeof vi.fn>;
    updateCurrentAddressFromSubmittingFacility: ReturnType<typeof vi.fn>;
    isFormValid: () => boolean;
  };
  const navigation = { next: vi.fn(), canGoToNext: () => true };

  beforeEach(async () => {
    vi.clearAllMocks();
    service = {
      submittingFacilityGroup: new FormGroup({}),
      submittingFacilityModel: signal({ institutionName: 'Submitting facility' }),
      submitterFacilityFields: signal<FormlyFieldConfig[]>([{ key: 'institutionName', type: 'submitting-facility-input-test' }]),
      notifierFacilityGroup: new FormGroup({}),
      notifierFacilityModel: signal({ institutionName: 'Notifier facility' }),
      notifierFacilityFields: signal<FormlyFieldConfig[]>([]),
      sendData: vi.fn(),
      updateCurrentAddressFromSubmittingFacility: vi.fn(),
      isFormValid: () => true,
    };
    await TestBed.configureTestingModule({
      imports: [
        SubmittingFacilityComponent,
        FormlyModule.forRoot({ types: [{ name: 'submitting-facility-input-test', component: SubmittingFacilityInputTestComponent }] }),
      ],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        { provide: StepNavigation, useValue: navigation },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SubmittingFacilityComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates the component and renders the submitting facility title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const form = fixture.debugElement.query(By.directive(NotificationStepFormComponent)).componentInstance as NotificationStepFormComponent;
    expect(form.title()).toBe(PathogenConstants.EINSENDENDE_PERSON);
    expect(fixture.nativeElement.querySelector('#notifier-facility-headline').textContent).toContain(PathogenConstants.EINSENDENDE_PERSON);
  });

  it('binds Formly to the submitting facility rather than the notifier facility', () => {
    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.form).toBe(service.submittingFacilityGroup);
    expect(formly.model).toBe(service.submittingFacilityModel());
    expect(formly.fields).toBe(service.submitterFacilityFields());
    expect(formly.form).not.toBe(service.notifierFacilityGroup);
    expect(formly.model).not.toBe(service.notifierFacilityModel());
    expect(fixture.nativeElement.querySelector('input').value).toBe('Submitting facility');
  });

  it('writes user input only to the submitting facility group and model', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Updated submitting facility';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(service.submittingFacilityGroup.get('institutionName').value).toBe('Updated submitting facility');
    expect(service.submittingFacilityModel().institutionName).toBe('Updated submitting facility');
    expect(service.notifierFacilityModel().institutionName).toBe('Notifier facility');
    expect(service.notifierFacilityGroup.getRawValue()).toEqual({});
    expect(service.updateCurrentAddressFromSubmittingFacility).toHaveBeenCalled();
  });

  it('updates the form when the submitting facility model and fields change', async () => {
    service.submittingFacilityModel.set({ institutionName: 'Replacement facility' });
    service.submitterFacilityFields.set([
      { key: 'institutionName', type: 'submitting-facility-input-test' },
      { key: 'departmentName', type: 'submitting-facility-input-test' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.fields).toBe(service.submitterFacilityFields());
    expect(formly.model).toBe(service.submittingFacilityModel());
    expect(service.submittingFacilityGroup.get('institutionName').value).toBe('Replacement facility');
    expect(service.submittingFacilityGroup.get('departmentName')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
  });

  it('provides only right-hand actions for navigating forward and submitting', () => {
    expect(fixture.componentInstance.actionsLeft()).toBeUndefined();
    const template = fixture.componentInstance.actionsRight();
    expect(template).toBeDefined();
    const actions = template.createEmbeddedView({});
    try {
      actions.detectChanges();
      const container = document.createElement('div');
      actions.rootNodes.forEach(node => container.appendChild(node));
      expect(container.querySelector('#btn-nav-action-back')).toBeNull();
      container.querySelector<HTMLButtonElement>('#btn-nav-action-next').click();
      container.querySelector<HTMLButtonElement>('#btn-send-notification').click();
      expect(navigation.next).toHaveBeenCalledOnce();
      expect(service.sendData).toHaveBeenCalledOnce();
    } finally {
      actions.destroy();
    }
  });
});
