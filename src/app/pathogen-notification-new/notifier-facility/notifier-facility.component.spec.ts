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
import { NotifierFacilityComponent } from './notifier-facility.component';

@Component({
  imports: [ReactiveFormsModule],
  template: '<input [formControl]="formControl" />',
})
class NotifierInputTestComponent extends FieldType {}

describe('NotifierFacilityComponent', () => {
  let fixture: ComponentFixture<NotifierFacilityComponent>;
  let service: {
    notifierFacilityGroup: FormGroup;
    notifierFacilityModel: ReturnType<typeof signal<{ institutionName: string }>>;
    notifierFacilityFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    sendData: ReturnType<typeof vi.fn>;
    handleNotifierFacilityChange: ReturnType<typeof vi.fn>;
    isFormValid: () => boolean;
  };

  beforeEach(async () => {
    service = {
      notifierFacilityGroup: new FormGroup({}),
      notifierFacilityModel: signal({ institutionName: 'Initial facility' }),
      notifierFacilityFields: signal<FormlyFieldConfig[]>([{ key: 'institutionName', type: 'notifier-input-test' }]),
      sendData: vi.fn(),
      handleNotifierFacilityChange: vi.fn(),
      isFormValid: () => true,
    };
    await TestBed.configureTestingModule({
      imports: [NotifierFacilityComponent, FormlyModule.forRoot({ types: [{ name: 'notifier-input-test', component: NotifierInputTestComponent }] })],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        {
          provide: StepNavigation,
          useValue: { next: vi.fn(), canGoToNext: () => true },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotifierFacilityComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates the component and renders the notifier facility title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const stepForm = fixture.debugElement.query(By.directive(NotificationStepFormComponent)).componentInstance as NotificationStepFormComponent;
    expect(stepForm.title()).toBe(PathogenConstants.MELDENDE_PERSON);
    expect(fixture.nativeElement.querySelector('#notifier-facility-headline').textContent).toContain(PathogenConstants.MELDENDE_PERSON);
  });

  it('passes the notifier group, model and fields to Formly', () => {
    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.form).toBe(service.notifierFacilityGroup);
    expect(formly.model).toBe(service.notifierFacilityModel());
    expect(formly.fields).toBe(service.notifierFacilityFields());
    expect(service.notifierFacilityGroup.get('institutionName').value).toBe('Initial facility');
    expect(fixture.nativeElement.querySelector('input').value).toBe('Initial facility');
  });

  it('writes user input to the notifier group and model', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Updated facility';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(service.notifierFacilityGroup.get('institutionName').value).toBe('Updated facility');
    expect(service.notifierFacilityModel().institutionName).toBe('Updated facility');
    expect(service.handleNotifierFacilityChange).toHaveBeenCalled();
  });

  it('renders updated field and model signals', async () => {
    service.notifierFacilityModel.set({ institutionName: 'Replacement facility' });
    service.notifierFacilityFields.set([
      { key: 'institutionName', type: 'notifier-input-test' },
      { key: 'departmentName', type: 'notifier-input-test' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.fields).toBe(service.notifierFacilityFields());
    expect(formly.model).toBe(service.notifierFacilityModel());
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
    expect(service.notifierFacilityGroup.get('institutionName').value).toBe('Replacement facility');
    expect(service.notifierFacilityGroup.get('departmentName')).not.toBeNull();
  });

  it('exposes only right-hand actions with next and submit enabled for this step', () => {
    expect(fixture.componentInstance.actionsLeft()).toBeUndefined();
    const template = fixture.componentInstance.actionsRight();
    expect(template).toBeDefined();
    const actions = template.createEmbeddedView({});
    try {
      actions.detectChanges();
      const container = document.createElement('div');
      actions.rootNodes.forEach(node => container.appendChild(node));
      expect(container.querySelector('app-notification-step-actions')).not.toBeNull();
      expect(container.querySelector('#btn-nav-action-back')).toBeNull();
      expect(container.querySelector('#btn-nav-action-next')).not.toBeNull();
      container.querySelector<HTMLButtonElement>('#btn-send-notification').click();
      expect(service.sendData).toHaveBeenCalledOnce();
    } finally {
      actions.destroy();
    }
  });
});
