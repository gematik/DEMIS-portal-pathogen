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

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MockService } from 'ng-mocks';
import { beforeEach, describe, expect, it } from 'vitest';
import { PathogenConstants } from '../pathogen-notification/common/constants';
import { PathogenNotificationService } from './pathogen-notification.service';
import { getStepData } from './step-data';

describe('getStepData', () => {
  let service: PathogenNotificationService;
  const stepMappings = [
    { key: 'notifierFacility', label: PathogenConstants.MELDENDE_PERSON, group: 'notifierFacilityGroup' },
    { key: 'submittingFacility', label: PathogenConstants.EINSENDENDE_PERSON, group: 'submittingFacilityGroup' },
    { key: 'notifiedPerson', label: PathogenConstants.BETROFFENE_PERSON, group: 'notifiedPersonGroup' },
    { key: 'notificationCategory', label: PathogenConstants.MELDETATBESTAND, group: 'notificationCategoryGroup' },
    { key: 'pathogenDTO', label: PathogenConstants.DIAGNOSTIK, group: 'pathogenDTOGroup' },
  ] as const;

  beforeEach(() => {
    service = MockService(PathogenNotificationService, {
      notifierFacilityGroup: new FormGroup({}),
      submittingFacilityGroup: new FormGroup({}),
      notifiedPersonGroup: new FormGroup({}),
      notificationCategoryGroup: new FormGroup({}),
      pathogenDTOGroup: new FormGroup({}),
    });
  });

  it('returns all five steps in workflow order with the correct labels and controls', () => {
    const steps = getStepData(service);

    expect(steps).toEqual(stepMappings.map(({ key, label, group }) => ({ key, label, control: service[group] })));
    expect(new Set(steps.map(step => step.key)).size).toBe(5);
    expect(new Set(steps.map(step => step.control)).size).toBe(5);
  });

  for (const { key, group } of stepMappings) {
    it(`uses the original ${group} so validation and touched state remain available to ${key}`, () => {
      const steps = getStepData(service);
      const step = steps.find(candidate => candidate.key === key);
      const control = new FormControl('', { nonNullable: true, validators: Validators.required });
      service[group].addControl('requiredField', control);
      service[group].markAsTouched();

      expect(step.control).toBe(service[group]);
      expect(step.control.invalid).toBe(true);
      expect(step.control.touched).toBe(true);

      control.setValue('Completed');

      expect(step.control.valid).toBe(true);
      expect(steps.filter(candidate => candidate.key !== key).every(candidate => candidate.control.valid && candidate.control.untouched)).toBe(true);
    });
  }

  it('returns fresh step definitions without modifying the service groups', () => {
    const firstSteps = getStepData(service);
    firstSteps[0].label = 'Changed label';
    firstSteps.pop();

    const secondSteps = getStepData(service);

    expect(secondSteps).toHaveLength(5);
    expect(secondSteps[0].label).toBe(PathogenConstants.MELDENDE_PERSON);
    expect(secondSteps[0]).not.toBe(firstSteps[0]);
    expect(secondSteps[0].control).toBe(service.notifierFacilityGroup);
    expect(service.notifierFacilityGroup.getRawValue()).toEqual({});
  });
});
