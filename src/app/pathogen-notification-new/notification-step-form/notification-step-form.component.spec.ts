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

import { signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { StepContentComponent, StepNavigation } from '@gematik/demis-portal-core-library';
import { FormlyFieldConfig, FormlyForm, FormlyModule } from '@ngx-formly/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathogenConstants } from '../../pathogen-notification/common/constants';
import { NotifiedPersonComponent } from '../notified-person/notified-person.component';
import { NotifierFacilityComponent } from '../notifier-facility/notifier-facility.component';
import { PathogenDiagnosticComponent } from '../pathogen-diagnostic/pathogen-diagnostic.component';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { SubmittingFacilityComponent } from '../submitting-facility/submitting-facility.component';
import { NotificationStepFormComponent } from './notification-step-form.component';

describe('Shared notification step templates', () => {
  const cases = [
    {
      component: NotifierFacilityComponent,
      group: 'notifierFacilityGroup',
      model: 'notifierFacilityModel',
      title: PathogenConstants.MELDENDE_PERSON,
      back: false,
      next: true,
    },
    {
      component: SubmittingFacilityComponent,
      group: 'submittingFacilityGroup',
      model: 'submittingFacilityModel',
      title: PathogenConstants.EINSENDENDE_PERSON,
      back: false,
      next: true,
    },
    {
      component: NotifiedPersonComponent,
      group: 'notifiedPersonGroup',
      model: 'notifiedPersonModel',
      title: PathogenConstants.BETROFFENE_PERSON,
      back: true,
      next: true,
    },
    { component: PathogenDiagnosticComponent, group: 'pathogenDTOGroup', model: 'pathogenModel', title: PathogenConstants.DIAGNOSTIK, back: true, next: false },
  ] as const;

  const navigation = {
    previous: vi.fn(),
    next: vi.fn(),
    canGoToPrevious: () => true,
    canGoToNext: () => true,
  };
  let service: {
    notifierFacilityGroup: FormGroup;
    submittingFacilityGroup: FormGroup;
    notifiedPersonGroup: FormGroup;
    pathogenDTOGroup: FormGroup;
    notifierFacilityModel: ReturnType<typeof signal<object>>;
    submittingFacilityModel: ReturnType<typeof signal<object>>;
    notifiedPersonModel: ReturnType<typeof signal<object>>;
    pathogenModel: ReturnType<typeof signal<object>>;
    notifierFacilityFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    submitterFacilityFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    notifiedPersonFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    diagnosticFormFields: ReturnType<typeof signal<FormlyFieldConfig[]>>;
    sendData: ReturnType<typeof vi.fn>;
    isFormValid: () => boolean;
  };

  beforeEach(async () => {
    service = {
      notifierFacilityGroup: new FormGroup({}),
      submittingFacilityGroup: new FormGroup({}),
      notifiedPersonGroup: new FormGroup({}),
      pathogenDTOGroup: new FormGroup({}),
      notifierFacilityModel: signal({}),
      submittingFacilityModel: signal({}),
      notifiedPersonModel: signal({}),
      pathogenModel: signal({}),
      notifierFacilityFields: signal<FormlyFieldConfig[]>([]),
      submitterFacilityFields: signal<FormlyFieldConfig[]>([]),
      notifiedPersonFields: signal<FormlyFieldConfig[]>([]),
      diagnosticFormFields: signal<FormlyFieldConfig[]>([]),
      sendData: vi.fn(),
      isFormValid: () => true,
    };
    await TestBed.configureTestingModule({
      imports: [...cases.map(testCase => testCase.component), FormlyModule.forRoot()],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        { provide: StepNavigation, useValue: navigation },
      ],
    }).compileComponents();
  });

  for (const testCase of cases) {
    it(`preserves form bindings and action templates for ${testCase.component.name}`, () => {
      const fixture = TestBed.createComponent(testCase.component as Type<StepContentComponent<void>>);
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.directive(FormlyForm)).componentInstance as FormlyForm;
      const wrapper = fixture.debugElement.query(By.directive(NotificationStepFormComponent)).componentInstance as NotificationStepFormComponent;
      expect(form.form).toBe(service[testCase.group]);
      expect(form.model).toBe(service[testCase.model]());
      expect(wrapper.title()).toBe(testCase.title);
      expect(Boolean(fixture.componentInstance.actionsLeft())).toBe(testCase.back);

      const actions = fixture.componentInstance.actionsRight().createEmbeddedView({});
      actions.detectChanges();
      const container = document.createElement('div');
      actions.rootNodes.forEach(node => container.appendChild(node));
      expect(Boolean(container.querySelector('#btn-nav-action-next'))).toBe(testCase.next);
      const submit = container.querySelector<HTMLButtonElement>('#btn-send-notification');
      expect(submit).not.toBeNull();
      submit.click();
      expect(service.sendData).toHaveBeenCalledOnce();
      actions.destroy();
      fixture.destroy();
    });
  }
});
