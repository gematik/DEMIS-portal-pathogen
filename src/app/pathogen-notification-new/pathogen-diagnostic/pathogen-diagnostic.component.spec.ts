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
import { FieldType, FieldTypeConfig, FormlyFieldConfig, FormlyForm, FormlyModule } from '@ngx-formly/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathogenConstants } from '../../pathogen-notification/common/constants';
import { NotificationStepFormComponent } from '../notification-step-form/notification-step-form.component';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { PathogenDiagnosticComponent } from './pathogen-diagnostic.component';

@Component({
  imports: [ReactiveFormsModule],
  template: '<input [formControl]="formControl" />',
})
class DiagnosticInputTestComponent extends FieldType<FieldTypeConfig> {}

describe('PathogenDiagnosticComponent', () => {
  let fixture: ComponentFixture<PathogenDiagnosticComponent>;
  let service: {
    pathogenDTOGroup: FormGroup;
    pathogenModel: ReturnType<typeof signal<{ specimen: { material: string } }>>;
    diagnosticFormFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    sendData: ReturnType<typeof vi.fn>;
    isFormValid: ReturnType<typeof vi.fn>;
  };
  const navigation = {
    previous: vi.fn(),
    canGoToPrevious: () => true,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    service = {
      pathogenDTOGroup: new FormGroup({}),
      pathogenModel: signal({ specimen: { material: 'Initial material' } }),
      diagnosticFormFields: signal<FormlyFieldConfig[]>([{ key: 'specimen', fieldGroup: [{ key: 'material', type: 'diagnostic-input-test' }] }]),
      sendData: vi.fn(),
      isFormValid: vi.fn().mockReturnValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [PathogenDiagnosticComponent, FormlyModule.forRoot({ types: [{ name: 'diagnostic-input-test', component: DiagnosticInputTestComponent }] })],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        { provide: StepNavigation, useValue: navigation },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PathogenDiagnosticComponent);
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

  it('renders the diagnostic title and step-specific header IDs', () => {
    expect(fixture.componentInstance).toBeTruthy();
    const form = fixture.debugElement.query(By.directive(NotificationStepFormComponent)).componentInstance as NotificationStepFormComponent;
    expect(form.title()).toBe(PathogenConstants.DIAGNOSTIK);
    expect(fixture.nativeElement.querySelector('#pathogen-diagnostic-section-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#pathogen-diagnostic-headline').textContent).toContain(PathogenConstants.DIAGNOSTIK);
  });

  it('passes the diagnostic group, model and fields to Formly', () => {
    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.form).toBe(service.pathogenDTOGroup);
    expect(formly.model).toBe(service.pathogenModel());
    expect(formly.fields).toBe(service.diagnosticFormFields());
    expect(service.pathogenDTOGroup.get('specimen.material').value).toBe('Initial material');
    expect(fixture.nativeElement.querySelector('input').value).toBe('Initial material');
  });

  it('writes user input to the nested diagnostic control and model', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Updated material';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(service.pathogenDTOGroup.get('specimen.material').value).toBe('Updated material');
    expect(service.pathogenModel().specimen.material).toBe('Updated material');
  });

  it('renders updated diagnostic fields and model signals', async () => {
    service.pathogenModel.set({ specimen: { material: 'Replacement material' } });
    service.diagnosticFormFields.set([
      {
        key: 'specimen',
        fieldGroup: [
          { key: 'material', type: 'diagnostic-input-test' },
          { key: 'method', type: 'diagnostic-input-test' },
        ],
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const formly = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
    expect(formly.fields).toBe(service.diagnosticFormFields());
    expect(formly.model).toBe(service.pathogenModel());
    expect(service.pathogenDTOGroup.get('specimen.material').value).toBe('Replacement material');
    expect(service.pathogenDTOGroup.get('specimen.method')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
  });

  it('provides a back action that navigates to the previous step', () => {
    expect(fixture.componentInstance.actionsLeft()).toBeDefined();
    withActions(fixture.componentInstance.actionsLeft(), container => {
      container.querySelector<HTMLButtonElement>('#btn-nav-action-back').click();
      expect(navigation.previous).toHaveBeenCalledOnce();
      expect(container.querySelector('#btn-send-notification')).toBeNull();
    });
  });

  it('provides only submit on the right because diagnostics is the last step', () => {
    expect(fixture.componentInstance.actionsRight()).toBeDefined();
    withActions(fixture.componentInstance.actionsRight(), container => {
      expect(container.querySelector('#btn-nav-action-next')).toBeNull();
      expect(container.querySelector('#btn-nav-action-back')).toBeNull();
      expect(container.querySelectorAll('button')).toHaveLength(1);
      container.querySelector<HTMLButtonElement>('#btn-send-notification').click();
      expect(service.sendData).toHaveBeenCalledOnce();
    });
  });

  it('blocks submission while the notification is invalid', () => {
    service.isFormValid.mockReturnValue(false);
    withActions(fixture.componentInstance.actionsRight(), container => {
      const submit = container.querySelector<HTMLButtonElement>('#btn-send-notification');
      expect(submit.getAttribute('aria-disabled')).toBe('true');
      submit.click();
      expect(service.sendData).not.toHaveBeenCalled();
    });
  });
});
