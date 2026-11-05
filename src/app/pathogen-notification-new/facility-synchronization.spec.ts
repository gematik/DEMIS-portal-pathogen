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

import { Component, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FollowUpNotificationIdService, StepNavigation } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddressType } from '../../api/notification';
import { environment } from '../../environments/environment';
import { NotificationType } from '../pathogen-notification/common/routing-helper';
import { PathogenFormValidationConfig } from '../pathogen-notification/common/pathogen-formly-validation-module';
import { PathogenFormlyConfig } from '../pathogen-notification/formly/configs/formly-app-config';
import { NotificationFormValidationConfig } from '../pathogen-notification/legacy/notification-form-validation-module';
import { ErrorDialogService } from '../pathogen-notification/services/error-dialog.service';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { NotifiedPersonComponent } from './notified-person/notified-person.component';
import { NotifierFacilityComponent } from './notifier-facility/notifier-facility.component';
import { PathogenNotificationService } from './pathogen-notification.service';
import { SubmittingFacilityComponent } from './submitting-facility/submitting-facility.component';

// TODO can be replaced by integration tests
@Component({
  imports: [NotifierFacilityComponent, SubmittingFacilityComponent, NotifiedPersonComponent],
  template: `
    @switch (step()) {
      @case (0) {
        <app-notifier-facility />
      }
      @case (1) {
        <app-submitting-facility />
      }
      @case (2) {
        <app-notified-person />
      }
    }
  `,
})
class FacilityStepsTestComponent {
  readonly service = inject(PathogenNotificationService);
  readonly step = signal(0);
}

function findField(fields: FormlyFieldConfig[], key: string): FormlyFieldConfig {
  for (const field of fields) {
    if (field.key === key) return field;
    const child = findField(field.fieldGroup ?? [], key);
    if (child) return child;
  }
  return undefined;
}

describe('Facility synchronization across rendered steps', () => {
  let fixture: ComponentFixture<FacilityStepsTestComponent>;
  let service: PathogenNotificationService;

  async function showStep(step: number) {
    fixture.componentInstance.step.set(step);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function edit(fields: FormlyFieldConfig[], key: string, value: string) {
    const field = findField(fields, key);
    const input = fixture.nativeElement.querySelector(`[id="${field.id}"]`) as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: true });
    await TestBed.configureTestingModule({
      imports: [
        FacilityStepsTestComponent,
        FormlyMaterialModule,
        FormlyModule.forRoot({
          ...PathogenFormlyConfig,
          validators: [...NotificationFormValidationConfig.validators, ...PathogenFormValidationConfig.validators],
          extras: NotificationFormValidationConfig.extras,
        }),
      ],
      providers: [
        { provide: FollowUpNotificationIdService, useValue: { openDialog: vi.fn() } },
        {
          provide: FhirPathogenNotificationService,
          useValue: {
            fetchCountryCodeDisplays: () => of([{ code: 'DE', display: 'Deutschland', designations: [] }]),
            fetchFederalStateCodeDisplays: () => of([]),
            fetchPathogenCodeDisplaysByTypeAndState: () => of([]),
          },
        },
        {
          provide: PathogenNotificationStorageService,
          useValue: {
            getNotifierFacilityModel: vi.fn(),
            setNotifierFacilityModel: vi.fn(),
            getFederalStateCode: () => 'DE-BW',
            setFederalStateCode: vi.fn(),
            removeSelectedPathogenCodeDisplay: vi.fn(),
            getSelectedPathogenCodeDisplay: () => ({ code: 'test', display: 'Test', designations: [] }),
          },
        },
        { provide: ErrorDialogService, useValue: { showBasicClosableErrorDialog: vi.fn() } },
        { provide: NGXLogger, useValue: { error: vi.fn() } },
        { provide: StepNavigation, useValue: { canGoToNext: () => true, canGoToPrevious: () => true } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FacilityStepsTestComponent);
    service = fixture.componentInstance.service;
    service.initialize(NotificationType.NominalNotification7_1);
    service.notifierFacilityModel.set({
      facilityInfo: { institutionName: 'Laboratory', existsBsnr: false },
      address: { street: 'Teststrasse', houseNumber: '1', zip: '10115', city: 'Berlin', country: 'DE' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: {
        phoneNumbers: [
          { contactType: 'phone', value: '030123456' },
          { contactType: 'phone', value: '030654321' },
        ],
        emailAddresses: [{ contactType: 'email', value: 'laboratory@example.org' }],
      },
    });
    service.notifiedPersonModel.set({ currentAddressType: AddressType.SubmittingFacility });
    const notifiedPersonGroup: FormGroup = service.notifiedPersonGroup;
    notifiedPersonGroup.patchValue(service.notifiedPersonModel());
    await showStep(0);
  });

  it('persists edits without copying and does not reload storage when returning to the step', async () => {
    const storage = TestBed.inject(PathogenNotificationStorageService);
    await edit(service.notifierFacilityFields(), 'institutionName', 'Persisted laboratory');

    expect(storage.setNotifierFacilityModel).toHaveBeenLastCalledWith(
      expect.objectContaining({ facilityInfo: expect.objectContaining({ institutionName: 'Persisted laboratory' }) })
    );
    expect(service.submittingFacilityModel().copyAddressCheckBox).toBeFalsy();
    await showStep(1);
    await showStep(0);

    expect(storage.getNotifierFacilityModel).toHaveBeenCalledTimes(1);
    expect(service.notifierFacilityModel()).toMatchObject({ facilityInfo: { institutionName: 'Persisted laboratory' } });
  });

  it('validates required fields in every step before those steps are rendered', () => {
    service.setPathogenData({
      codeDisplay: { code: 'test', display: 'Test', designations: [] },
      header: 'Test diagnostics',
      materials: [],
      methods: [],
      answerSet: [],
    });

    expect(service.formsInitialized()).toBe(true);
    expect(service.notifierFacilityGroup.valid).toBe(true);
    expect(service.submittingFacilityGroup.invalid).toBe(true);
    expect(service.notifiedPersonGroup.invalid).toBe(true);
    expect(service.notificationCategoryGroup.invalid).toBe(true);
    expect(service.pathogenDTOGroup.invalid).toBe(true);
    expect(service.isFormValid()).toBe(false);
    expect(service.submittingFacilityGroup.get('facilityInfo.institutionName').hasError('required')).toBe(true);
    expect(service.pathogenDTOGroup.get('specimenList.0.specimenDTO.receivedDate').hasError('required')).toBe(true);
  });

  it('copies all shared fields and updates the current address after destroying and recreating steps', async () => {
    expect(service.notifierFacilityGroup.valid).toBe(true);
    await showStep(1);
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector('input[type="checkbox"]');
    checkbox.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.submittingFacilityModel()).toMatchObject({
      copyAddressCheckBox: true,
      facilityInfo: { institutionName: 'Laboratory' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: { phoneNumbers: [{ value: '030123456' }, { value: '030654321' }], emailAddresses: [{ value: 'laboratory@example.org' }] },
    });

    await showStep(0);
    await edit(service.notifierFacilityFields(), 'institutionName', 'Updated laboratory');
    await edit(service.notifierFacilityFields(), 'street', 'Updated street');
    await edit(service.notifierFacilityFields(), 'firstname', 'Grace');
    const phones = findField(service.notifierFacilityFields(), 'phoneNumbers');
    phones.props.setFieldCount(1);
    await edit([phones], 'value', '030987654');
    const emails = findField(service.notifierFacilityFields(), 'emailAddresses');
    await edit([emails], 'value', 'updated@example.org');
    expect(service.submittingFacilityModel()).toMatchObject({
      facilityInfo: { institutionName: 'Updated laboratory' },
      address: { street: 'Updated street' },
      contact: { firstname: 'Grace' },
      contacts: { phoneNumbers: [{ value: '030987654' }], emailAddresses: [{ value: 'updated@example.org' }] },
    });
    expect(Array.isArray(service.submittingFacilityModel().contacts)).toBe(false);
    expect(service.notifiedPersonModel()).toMatchObject({
      currentAddress: { street: 'Updated street', additionalInfo: 'Updated laboratory' },
    });
    await showStep(1);
    expect(service.submittingFacilityGroup.getRawValue()).toMatchObject({
      facilityInfo: { institutionName: 'Updated laboratory' },
      address: { street: 'Updated street' },
      contact: { firstname: 'Grace' },
      contacts: { phoneNumbers: [{ value: '030987654' }], emailAddresses: [{ value: 'updated@example.org' }] },
    });
    expect(service.submittingFacilityGroup.get('facilityInfo.institutionName').disabled).toBe(true);
    expect(service.submittingFacilityGroup.get('facilityInfo.departmentName').enabled).toBe(true);
    expect(service.submittingFacilityGroup.get('copyAddressCheckBox').enabled).toBe(true);
    expect(service.submittingFacilityGroup.get('contacts.phoneNumbers').getRawValue()).toHaveLength(1);
    await showStep(2);
    expect(service.notifiedPersonGroup.getRawValue()).toMatchObject({
      currentAddress: { street: 'Updated street', additionalInfo: 'Updated laboratory' },
    });

    await showStep(1);
    fixture.nativeElement.querySelector('input[type="checkbox"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.submittingFacilityModel()).toMatchObject({
      copyAddressCheckBox: false,
      address: { country: 'DE' },
      contacts: { phoneNumbers: [{ contactType: 'phone', value: '' }], emailAddresses: [{ contactType: 'email', value: '' }] },
    });
    expect(service.submittingFacilityGroup.get('facilityInfo.institutionName').enabled).toBe(true);
    await showStep(0);
    await edit(service.notifierFacilityFields(), 'institutionName', 'Not copied');
    expect(service.submittingFacilityModel().facilityInfo.institutionName).toBeUndefined();
  });

  it('updates only the current address when the submitting facility is edited manually', async () => {
    await showStep(1);
    await edit(service.submitterFacilityFields(), 'institutionName', 'Hospital');
    await edit(service.submitterFacilityFields(), 'street', 'Hospital street');
    expect(service.notifiedPersonModel()).toMatchObject({
      currentAddress: { street: 'Hospital street', additionalInfo: 'Hospital' },
    });
    expect(service.notifierFacilityModel().facilityInfo.institutionName).toBe('Laboratory');
    service.notifiedPersonModel.set({ currentAddressType: AddressType.Current });
    const notifiedPersonGroup: FormGroup = service.notifiedPersonGroup;
    notifiedPersonGroup.patchValue(service.notifiedPersonModel());
    service.updateCurrentAddressFromSubmittingFacility();
    service.notifiedPersonModel.set({ currentAddressType: AddressType.Current, currentAddress: { street: 'Private address' } });
    notifiedPersonGroup.patchValue(service.notifiedPersonModel());
    await edit(service.submitterFacilityFields(), 'street', 'Another hospital street');
    expect(service.notifiedPersonModel()).toMatchObject({ currentAddress: { street: 'Private address' } });
  });

  it.each([AddressType.Current, AddressType.OtherFacility, AddressType.PrimaryAsCurrent])(
    'clears the copied address when switching from submitting facility to %s',
    async addressType => {
      await showStep(1);
      await edit(service.submitterFacilityFields(), 'institutionName', 'Hospital');
      await edit(service.submitterFacilityFields(), 'street', 'Hospital street');
      await showStep(2);
      expect(service.notifiedPersonGroup.getRawValue()).toMatchObject({
        currentAddress: { street: 'Hospital street' },
      });

      const radio: HTMLInputElement = fixture.nativeElement.querySelector(`input[type="radio"][value="${addressType}"]`);
      expect(radio).not.toBeNull();
      radio.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(service.notifiedPersonModel()).toMatchObject({ currentAddressType: addressType });
      expect(TestBed.inject(ErrorDialogService).showBasicClosableErrorDialog).not.toHaveBeenCalled();
      const person = service.notifiedPersonModel();
      if (!('currentAddress' in person)) {
        throw new Error('Expected a nominal notified person with a current address.');
      }
      expect(person.currentAddress?.street).toBeFalsy();
      expect(person.currentAddress?.additionalInfo).toBeFalsy();
      expect(service.submittingFacilityModel().address.street).toBe('Hospital street');

      if (addressType !== AddressType.PrimaryAsCurrent) {
        await edit([findField(service.notifiedPersonFields(), 'currentAddress')], 'street', 'Private street');
        await showStep(1);
        await edit(service.submitterFacilityFields(), 'street', 'Changed hospital street');
        await showStep(2);
        expect(service.notifiedPersonGroup.getRawValue()).toMatchObject({
          currentAddress: { street: 'Private street' },
        });
      }
    }
  );

  it.each(
    [AddressType.SubmittingFacility].flatMap(addressType =>
      [
        {},
        { street: 'Home street', houseNumber: '', zip: '10115', city: 'Berlin', country: 'DE' },
        { street: 'Home street', houseNumber: '2', zip: 'invalid', city: 'Berlin', country: 'DE' },
        { street: 'Home street', houseNumber: '2', zip: '10115', city: '   ', country: 'DE' },
      ].map(address => ({ addressType, address }))
    )
  )('rejects selecting $addressType with source $address and allows retry after completion', async ({ addressType, address: incompleteAddress }) => {
    service.notifiedPersonModel.set({ currentAddressType: AddressType.Current });
    const group: FormGroup = service.notifiedPersonGroup;
    group.patchValue({ currentAddressType: AddressType.Current });
    const facilityGroup: FormGroup = service.submittingFacilityGroup;
    facilityGroup.patchValue({ address: incompleteAddress, facilityInfo: { institutionName: 'Hospital' } });
    service.submittingFacilityModel.set({ address: incompleteAddress, facilityInfo: { institutionName: 'Hospital' } });
    await showStep(2);
    const dialog = TestBed.inject(ErrorDialogService);
    const radio = () => fixture.nativeElement.querySelector(`input[type="radio"][value="${addressType}"]`) as HTMLInputElement;
    radio().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledTimes(1);
    expect(service.notifiedPersonGroup.get('currentAddressType').value).toBeNull();
    const person = service.notifiedPersonModel();
    if (!('currentAddressType' in person)) {
      throw new Error('Expected a nominal notified person with a current address type.');
    }
    expect(person.currentAddressType == null).toBe(true);

    const address = { street: 'Home street', houseNumber: '2', zip: '10115', city: 'Berlin', country: 'DE' };
    facilityGroup.patchValue({ address, facilityInfo: { institutionName: 'Hospital' } });
    service.submittingFacilityModel.set({ address, facilityInfo: { institutionName: 'Hospital' } });
    fixture.detectChanges();
    expect(facilityGroup.get('address').getRawValue()).toMatchObject(address);
    expect(facilityGroup.get('address').errors).toBeNull();
    expect(radio().checked).toBe(false);
    radio().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledTimes(1);
    expect(service.notifiedPersonGroup.get('currentAddressType').value).toBe(addressType);
  });

  it.each([
    {},
    { country: 'DE' },
    { street: '   ', houseNumber: '', zip: '', city: ' ', country: 'DE' },
    { street: 'Home street' },
    { street: 'Home street', houseNumber: '2', zip: 'invalid', city: 'Berlin', country: 'DE' },
    { street: 'Home street', houseNumber: '2', zip: '10115', city: 'Berlin', country: 'DE' },
  ])('always allows PrimaryAsCurrent with residence address %s', async residenceAddress => {
    service.notifiedPersonModel.set({ currentAddressType: AddressType.Current, residenceAddress });
    const group: FormGroup = service.notifiedPersonGroup;
    group.patchValue({ currentAddressType: AddressType.Current });
    group.get('residenceAddress').reset(residenceAddress);
    await showStep(2);

    const radio: HTMLInputElement = fixture.nativeElement.querySelector(`input[type="radio"][value="${AddressType.PrimaryAsCurrent}"]`);
    radio.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(ErrorDialogService).showBasicClosableErrorDialog).not.toHaveBeenCalled();
    expect(service.notifiedPersonModel()).toMatchObject({ currentAddressType: AddressType.PrimaryAsCurrent });
    expect(group.get('currentAddressType').value).toBe(AddressType.PrimaryAsCurrent);
    expect(radio.checked).toBe(true);
  });
});
