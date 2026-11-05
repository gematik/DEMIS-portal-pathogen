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

import { Component, signal, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { StepNavigation } from '@gematik/demis-portal-core-library';
import { FieldType, FormlyFieldConfig, FormlyForm, FormlyModule } from '@ngx-formly/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathogenConstants } from '../../pathogen-notification/common/constants';
import { NotificationStepFormComponent } from '../notification-step-form/notification-step-form.component';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { NotifiedPersonComponent } from './notified-person.component';

@Component({
  imports: [ReactiveFormsModule],
  template: '<input [formControl]="formControl" />',
})
class NotifiedPersonInputTestComponent extends FieldType {}

describe('NotifiedPersonComponent', () => {
  let fixture: ComponentFixture<NotifiedPersonComponent>;
  let service: {
    notifiedPersonGroup: FormGroup;
    notifiedPersonModel: ReturnType<typeof signal<{ firstName: string }>>;
    notifiedPersonFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    sendData: ReturnType<typeof vi.fn>;
    updateCurrentAddressFromSubmittingFacility: ReturnType<typeof vi.fn>;
    isFormValid: () => boolean;
  };
  const navigation = {
    previous: vi.fn(),
    next: vi.fn(),
    canGoToPrevious: vi.fn(),
    canGoToNext: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    navigation.canGoToPrevious.mockReturnValue(true);
    navigation.canGoToNext.mockReturnValue(true);
    service = {
      notifiedPersonGroup: new FormGroup({}),
      notifiedPersonModel: signal({ firstName: 'Initial name' }),
      notifiedPersonFields: signal<FormlyFieldConfig[]>([{ key: 'firstName', type: 'notified-person-input-test' }]),
      sendData: vi.fn(),
      updateCurrentAddressFromSubmittingFacility: vi.fn(),
      isFormValid: () => true,
    };
    await TestBed.configureTestingModule({
      imports: [
        NotifiedPersonComponent,
        FormlyModule.forRoot({ types: [{ name: 'notified-person-input-test', component: NotifiedPersonInputTestComponent }] }),
      ],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        { provide: StepNavigation, useValue: navigation },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotifiedPersonComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function withActions(template: TemplateRef<unknown>, assertions: (container: HTMLDivElement) => void) {
    const view = template.createEmbeddedView({});
    try {
      view.detectChanges();
      const container = document.createElement('div');
      view.rootNodes.forEach(node => container.appendChild(node));
      assertions(container);
    } finally {
      view.destroy();
    }
  }

  it('creates the component and renders the affected person title', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const form = fixture.debugElement.query(By.directive(NotificationStepFormComponent)).componentInstance as NotificationStepFormComponent;
    expect(form.title()).toBe(PathogenConstants.BETROFFENE_PERSON);
    expect(fixture.nativeElement.querySelector('#notifier-facility-headline').textContent).toContain(PathogenConstants.BETROFFENE_PERSON);
  });

  it('binds Formly to the notified person group, model and fields', () => {
    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.form).toBe(service.notifiedPersonGroup);
    expect(formly.model).toBe(service.notifiedPersonModel());
    expect(formly.fields).toBe(service.notifiedPersonFields());
    expect(service.notifiedPersonGroup.get('firstName').value).toBe('Initial name');
    expect(fixture.nativeElement.querySelector('input').value).toBe('Initial name');
  });

  it('writes user input to the notified person group and model', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Updated name';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(service.notifiedPersonGroup.get('firstName').value).toBe('Updated name');
    expect(service.notifiedPersonModel().firstName).toBe('Updated name');
    expect(service.updateCurrentAddressFromSubmittingFacility).toHaveBeenCalled();
  });

  it('updates the form when the model and field signals change', async () => {
    service.notifiedPersonModel.set({ firstName: 'Replacement name' });
    service.notifiedPersonFields.set([
      { key: 'firstName', type: 'notified-person-input-test' },
      { key: 'lastName', type: 'notified-person-input-test' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.model).toBe(service.notifiedPersonModel());
    expect(formly.fields).toBe(service.notifiedPersonFields());
    expect(service.notifiedPersonGroup.get('firstName').value).toBe('Replacement name');
    expect(service.notifiedPersonGroup.get('lastName')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
  });

  it('provides a left action template that navigates to the previous step', () => {
    expect(fixture.componentInstance.actionsLeft()).toBeDefined();
    withActions(fixture.componentInstance.actionsLeft(), container => {
      const back = container.querySelector<HTMLButtonElement>('#btn-nav-action-back');
      expect(back).not.toBeNull();
      expect(container.querySelector('#btn-nav-action-next')).toBeNull();
      expect(container.querySelector('#btn-send-notification')).toBeNull();
      back.click();
      expect(navigation.previous).toHaveBeenCalledOnce();
    });
  });

  it('provides right action templates for navigating forward and submitting', () => {
    expect(fixture.componentInstance.actionsRight()).toBeDefined();
    withActions(fixture.componentInstance.actionsRight(), container => {
      expect(container.querySelector('#btn-nav-action-back')).toBeNull();
      container.querySelector<HTMLButtonElement>('#btn-nav-action-next').click();
      container.querySelector<HTMLButtonElement>('#btn-send-notification').click();
      expect(navigation.next).toHaveBeenCalledOnce();
      expect(service.sendData).toHaveBeenCalledOnce();
    });
  });
});
