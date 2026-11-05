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

import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormBuilder } from '@ngx-formly/core';
import { FollowUpMixedCodesService, FollowUpNotificationIdService } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddressType, CodeDisplay, PathogenData } from '../../api/notification';
import { environment } from '../../environments/environment';
import { allowedRoutes, NotificationType } from '../pathogen-notification/common/routing-helper';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { ErrorDialogService } from '../pathogen-notification/services/error-dialog.service';
import { transformPathogenFormToPathogenTest } from '../pathogen-notification/utils/data-transformation';
import { NotifiedPersonDisclaimer } from '../pathogen-notification/utils/disclaimer-texts';
import { PathogenNotificationService } from './pathogen-notification.service';

vi.mock('../pathogen-notification/utils/data-transformation', () => ({
  transformPathogenFormToPathogenTest: vi.fn(() => ({ pathogen: 'transformed' })),
}));

function flattenFields(fields: FormlyFieldConfig[]): FormlyFieldConfig[] {
  return fields.flatMap(field => [
    field,
    ...flattenFields(field.fieldGroup ?? []),
    ...(field.fieldArray && typeof field.fieldArray !== 'function' ? flattenFields([field.fieldArray]) : []),
  ]);
}

describe('PathogenNotificationService', () => {
  let service: PathogenNotificationService;
  const countries: CodeDisplay[] = [{ code: 'DE', display: 'Deutschland', designations: [] }];
  const states: CodeDisplay[] = [{ code: 'DE-BW', display: 'Baden-Wuerttemberg', designations: [] }];
  const pathogens: CodeDisplay[] = [{ code: 'test', display: 'Test pathogen', designations: [] }];
  const fhir = {
    fetchCountryCodeDisplays: vi.fn(),
    fetchFederalStateCodeDisplays: vi.fn(),
    fetchPathogenCodeDisplaysByTypeAndState: vi.fn(),
    fetchAllPathogenCodeDisplays: vi.fn(),
    fetchFollowUpCode: vi.fn(),
    fetchDiagnosticsBasedOnPathogenSelection: vi.fn(),
    submitNotification: vi.fn(),
  };
  const storage = {
    getNotifierFacilityModel: vi.fn(),
    setNotifierFacilityModel: vi.fn(),
    getFederalStateCode: vi.fn(),
    removeSelectedPathogenCodeDisplay: vi.fn(),
    getSelectedPathogenCodeDisplay: vi.fn(),
    setSelectedPathogenCodeDisplay: vi.fn(),
    setFederalStateCode: vi.fn(),
  };
  const builder = { buildForm: vi.fn() };
  const logger = { error: vi.fn() };
  const dialog = { showBasicClosableErrorDialog: vi.fn() };
  const followUpDialog = {
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
    hasValidNotificationId$: new Subject<boolean>(),
    followUpNotificationCategory: vi.fn(),
    validatedNotificationId: vi.fn(),
  };
  const mixedCodeDialog = { openDialog: vi.fn() };
  let validNotificationId$: Subject<boolean>;
  const groupKeys = ['notifierFacilityGroup', 'notifiedPersonGroup', 'submittingFacilityGroup', 'notificationCategoryGroup', 'pathogenDTOGroup'] as const;

  beforeEach(() => {
    vi.clearAllMocks();
    validNotificationId$ = new Subject<boolean>();
    followUpDialog.hasValidNotificationId$ = validNotificationId$;
    followUpDialog.followUpNotificationCategory.mockReturnValue('follow-up-category');
    followUpDialog.validatedNotificationId.mockReturnValue('validated-notification-id');
    storage.getNotifierFacilityModel.mockReturnValue(undefined);
    fhir.fetchCountryCodeDisplays.mockReturnValue(of(countries));
    fhir.fetchFederalStateCodeDisplays.mockReturnValue(of(states));
    fhir.fetchPathogenCodeDisplaysByTypeAndState.mockReturnValue(of(pathogens));
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(of(pathogens));
    fhir.fetchFollowUpCode.mockReturnValue(of([pathogens[0]]));
    fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(of(pathogenData()));
    storage.getFederalStateCode.mockReturnValue(undefined);
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(pathogens[0]);
    mixedCodeDialog.openDialog.mockReturnValue(of(pathogens[0].code));
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: true });
    TestBed.configureTestingModule({
      providers: [
        PathogenNotificationService,
        { provide: FhirPathogenNotificationService, useValue: fhir },
        { provide: PathogenNotificationStorageService, useValue: storage },
        { provide: FormlyFormBuilder, useValue: builder },
        { provide: ErrorDialogService, useValue: dialog },
        { provide: FollowUpNotificationIdService, useValue: followUpDialog },
        { provide: FollowUpMixedCodesService, useValue: mixedCodeDialog },
        { provide: NGXLogger, useValue: logger },
      ],
    });
    service = TestBed.inject(PathogenNotificationService);
  });

  it.each([
    [NotificationType.FollowUpNotification7_1, '7.1', allowedRoutes.nominal, 'eines namentlichen Erregernachweises nach § 7 Abs. 1 IfSG'],
    [NotificationType.FollowUpNotification7_3, '7.3', allowedRoutes.nonNominal, 'eines nichtnamentlichen Erregernachweises nach § 7 Abs. 3 IfSG'],
  ] as const)('loads all pathogen codes before opening the dialog for %s', (notificationType, section, route, linkTextContent) => {
    const response = new Subject<CodeDisplay[]>();
    const allPathogens = [...pathogens, { code: 'additional', display: 'Additional pathogen', designations: [] }];
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(response);

    service.initialize(notificationType);

    expect(service.formsInitialized()).toBe(true);
    expect(fhir.fetchAllPathogenCodeDisplays).toHaveBeenCalledExactlyOnceWith(section);
    expect(followUpDialog.openDialog).not.toHaveBeenCalled();

    response.next(allPathogens);

    expect(service.pathogenCodeDisplays).toBe(allPathogens);
    expect(followUpDialog.openDialog).toHaveBeenCalledExactlyOnceWith({
      dialogData: {
        routerLink: '/' + route,
        linkTextContent,
        pathToDestinationLookup: environment.pathToDestinationLookup,
      },
    });
  });

  it.each([NotificationType.NominalNotification7_1, NotificationType.NonNominalNotification7_3, NotificationType.AnonymousNotification7_3])(
    'does not load follow-up codes or open a dialog for %s',
    notificationType => {
      service.initialize(notificationType);

      expect(fhir.fetchAllPathogenCodeDisplays).not.toHaveBeenCalled();
      expect(followUpDialog.openDialog).not.toHaveBeenCalled();
    }
  );

  it('cancels pending follow-up requests when initialization starts again', () => {
    const response = new Subject<CodeDisplay[]>();
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(response);
    service.initialize(NotificationType.FollowUpNotification7_1);

    service.initialize(NotificationType.NominalNotification7_1);
    response.next([]);

    expect(service.pathogenCodeDisplays).toBe(pathogens);
    expect(followUpDialog.openDialog).not.toHaveBeenCalled();
  });

  it('logs failed follow-up code requests without opening the dialog', () => {
    const error = new Error('Follow-up codes unavailable');
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(throwError(() => error));

    service.initialize(NotificationType.FollowUpNotification7_3);

    expect(logger.error).toHaveBeenCalledWith(error);
    expect(followUpDialog.openDialog).not.toHaveBeenCalled();
  });

  it('does not open the follow-up dialog when initial reference data fails to load', () => {
    fhir.fetchCountryCodeDisplays.mockReturnValue(throwError(() => new Error('Countries unavailable')));

    service.initialize(NotificationType.FollowUpNotification7_1);

    expect(fhir.fetchAllPathogenCodeDisplays).not.toHaveBeenCalled();
    expect(followUpDialog.openDialog).not.toHaveBeenCalled();
  });

  it('fetches the validated follow-up category, selects its pathogen and sets the initial notification ID', () => {
    service.initialize(NotificationType.FollowUpNotification7_1);
    validNotificationId$.next(true);

    expect(fhir.fetchFollowUpCode).toHaveBeenCalledExactlyOnceWith('follow-up-category', NotificationType.FollowUpNotification7_1);
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith('test', NotificationType.FollowUpNotification7_1);
    expect(service.notificationCategoryModel()).toMatchObject({
      pathogenDisplay: 'Test pathogen',
      initialNotificationId: 'validated-notification-id',
    });
    expect(service.pathogenData).toEqual(pathogenData());
    expect(storage.setSelectedPathogenCodeDisplay).toHaveBeenCalledExactlyOnceWith(pathogens[0]);
    expect(service.pathogenDTOGroup.enabled).toBe(true);
    expect(service.notifiedPersonGroup.touched).toBe(true);
  });

  it('asks the user to choose when a follow-up category maps to multiple pathogen codes', () => {
    const secondPathogen: CodeDisplay = { code: 'second', display: 'Second pathogen', designations: [] };
    fhir.fetchFollowUpCode.mockReturnValue(of([pathogens[0], secondPathogen]));
    mixedCodeDialog.openDialog.mockReturnValue(of(undefined));
    service.initialize(NotificationType.FollowUpNotification7_3);
    validNotificationId$.next(true);

    expect(followUpDialog.closeDialog).toHaveBeenCalledOnce();
    expect(mixedCodeDialog.openDialog).toHaveBeenCalledExactlyOnceWith([
      { code: pathogens[0].code, display: pathogens[0].display },
      { code: secondPathogen.code, display: secondPathogen.display },
    ]);
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
  });

  it('loads diagnostics for a selected mixed follow-up code present in the loaded list', () => {
    const secondPathogen: CodeDisplay = { code: 'second', display: 'Second pathogen', designations: [] };
    fhir.fetchAllPathogenCodeDisplays.mockReturnValue(of([...pathogens, secondPathogen]));
    fhir.fetchFollowUpCode.mockReturnValue(of([pathogens[0], secondPathogen]));
    mixedCodeDialog.openDialog.mockReturnValue(of(secondPathogen.code));

    service.initialize(NotificationType.FollowUpNotification7_3);
    validNotificationId$.next(true);

    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith('second', NotificationType.FollowUpNotification7_3);
    expect(service.notificationCategoryModel()).toMatchObject({ pathogenDisplay: 'Second pathogen' });
    expect(storage.setSelectedPathogenCodeDisplay).toHaveBeenCalledExactlyOnceWith(secondPathogen);
  });

  it('logs follow-up category request failures', () => {
    const error = new Error('Follow-up category unavailable');
    fhir.fetchFollowUpCode.mockReturnValue(throwError(() => error));
    service.initialize(NotificationType.FollowUpNotification7_1);
    validNotificationId$.next(true);

    expect(logger.error).toHaveBeenCalledWith(error);
  });

  it('restores saved notifier data before building the forms without saving intermediate changes', () => {
    const saved = { facilityInfo: { institutionName: 'Saved laboratory' }, address: { country: 'DE' } };
    storage.getNotifierFacilityModel.mockReturnValue(saved);
    service.initialize(NotificationType.NominalNotification7_1);

    expect(service.notifierFacilityModel()).toEqual(saved);
    expect(builder.buildForm.mock.calls[0][2]).toEqual(saved);
    expect(storage.setNotifierFacilityModel).not.toHaveBeenCalled();
  });

  it('persists current control values without requiring the copy checkbox', () => {
    service.initialize(NotificationType.NominalNotification7_1);
    service.notifierFacilityModel.set({ facilityInfo: { institutionName: 'Old name' }, address: { country: 'DE' } });
    service.notifierFacilityGroup.addControl('facilityInfo', new FormGroup({ institutionName: new FormControl('Updated name') }));

    service.handleNotifierFacilityChange();

    expect(storage.setNotifierFacilityModel).toHaveBeenLastCalledWith({
      facilityInfo: { institutionName: 'Updated name' },
      address: { country: 'DE' },
    });
    expect(service.submittingFacilityModel()).toEqual({});
  });

  it('does not persist notifier changes before initialization completes', () => {
    service.handleNotifierFacilityChange();
    expect(storage.setNotifierFacilityModel).not.toHaveBeenCalled();
  });

  it('creates separate groups and models without building forms before initialization', () => {
    expect(new Set(groupKeys.map(key => service[key])).size).toBe(5);
    expect(Object.values(service.getModelData()).every(model => Object.keys(model).length === 0)).toBe(true);
    expect(new Set(Object.values(service.getModelData())).size).toBe(5);
    expect(builder.buildForm).not.toHaveBeenCalled();
    expect(service.formsInitialized()).toBe(false);
    expect(service.isFormValid()).toBe(false);
    expect(service.diagnosticFormFields()[0].template).toContain('Bitte zuerst den Meldetatbestand');
  });

  it('returns current group values independently from the signal models', () => {
    groupKeys.forEach((key, index) => service[key].addControl('value', new FormControl(`group-${index}`)));

    expect(service.getFormData()).toEqual({
      notifierFacility: { value: 'group-0' },
      notifiedPerson: { value: 'group-1' },
      submittingFacility: { value: 'group-2' },
      notificationCategory: { value: 'group-3' },
      pathogenDTO: { value: 'group-4' },
    });
    expect(Object.values(service.getModelData()).every(model => Object.keys(model).length === 0)).toBe(true);
  });

  it('returns the current model signals rather than group values', () => {
    service.notifierFacilityModel.set({ facilityInfo: { institutionName: 'Notifier' } });
    service.submittingFacilityModel.set({ facilityInfo: { institutionName: 'Submitter' } });
    service.notifiedPersonModel.set({});
    service.notificationCategoryModel.set({ pathogen: pathogens[0] });
    service.pathogenModel.set({ specimenList: [] });

    expect(service.getModelData()).toEqual({
      notifierFacility: service.notifierFacilityModel(),
      submittingFacility: service.submittingFacilityModel(),
      notifiedPerson: service.notifiedPersonModel(),
      notificationCategory: service.notificationCategoryModel(),
      pathogenDTO: service.pathogenModel(),
    });
    expect(service.getFormData().notifierFacility).toEqual({});
  });

  it('is valid when all groups are valid', () => {
    service.initialize(NotificationType.NominalNotification7_1);
    service.setPathogenData(pathogenData());
    expect(service.isFormValid()).toBe(true);
  });

  it.each(groupKeys)('is invalid when %s is invalid', key => {
    service.initialize(NotificationType.NominalNotification7_1);
    service.setPathogenData(pathogenData());
    const control = new FormControl('', Validators.required);
    service[key].addControl('requiredField', control);
    expect(service.isFormValid()).toBe(false);
    control.setValue('Completed');
    expect(service.isFormValid()).toBe(true);
  });

  it('does not accept empty groups before initialization or before diagnostics are loaded', () => {
    expect(service.isFormValid()).toBe(false);
    service.initialize(NotificationType.NominalNotification7_1);
    expect(service.formsInitialized()).toBe(true);
    expect(service.isFormValid()).toBe(false);
    service.setPathogenData(pathogenData());
    expect(service.isFormValid()).toBe(true);
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(undefined);
    expect(service.isFormValid()).toBe(false);
  });

  it('blocks submission and reports incomplete forms', () => {
    service.sendData();
    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledWith(
      'Bitte füllen Sie zunächst alle Pflichtfelder der Meldung vollständig und korrekt aus.',
      'Meldung unvollständig'
    );
    expect(fhir.submitNotification).not.toHaveBeenCalled();
    expect(transformPathogenFormToPathogenTest).not.toHaveBeenCalled();
  });

  it('prebuilds the same field configurations that are published for rendering', () => {
    service.initialize(NotificationType.NonNominalNotification7_3);
    service.setPathogenData(pathogenData());
    for (const [group, fields, model] of [
      [service.notifierFacilityGroup, service.notifierFacilityFields(), service.notifierFacilityModel()],
      [service.submittingFacilityGroup, service.submitterFacilityFields(), service.submittingFacilityModel()],
      [service.notifiedPersonGroup, service.notifiedPersonFields(), service.notifiedPersonModel()],
      [service.notificationCategoryGroup, service.notificationCategoryFields(), service.notificationCategoryModel()],
      [service.pathogenDTOGroup, service.diagnosticFormFields(), service.pathogenModel()],
    ] as const) {
      expect(builder.buildForm).toHaveBeenCalledWith(group, fields, model, {});
    }
  });

  it('clears touched state recursively without clearing values, dirty state or validation', () => {
    groupKeys.forEach(key => {
      service[key].addControl('nested', new FormGroup({ requiredField: new FormControl('', Validators.required) }));
      service[key].markAllAsTouched();
      service[key].markAsDirty();
    });
    service.resetVisitedFlags();

    groupKeys.forEach(key => {
      const group: FormGroup = service[key];
      expect(group.untouched).toBe(true);
      expect(group.get('nested.requiredField').untouched).toBe(true);
      expect(group.dirty).toBe(true);
      expect(group.invalid).toBe(true);
      expect(group.getRawValue()).toEqual({ nested: { requiredField: '' } });
    });
  });

  it('reads the selected pathogen from storage', () => {
    expect(service.getSelectedPathogenCodeDisplayFromStorage()).toBe(pathogens[0]);
    expect(storage.getSelectedPathogenCodeDisplay).toHaveBeenCalledOnce();
  });

  it('fetches initial lists with the stored state and builds all step configurations', () => {
    storage.getFederalStateCode.mockReturnValue('DE-BY');
    service.initialize(NotificationType.NonNominalNotification7_3);

    expect(service.notificationType).toBe(NotificationType.NonNominalNotification7_3);
    expect(storage.removeSelectedPathogenCodeDisplay).toHaveBeenCalledOnce();
    expect(fhir.fetchCountryCodeDisplays).toHaveBeenCalledOnce();
    expect(fhir.fetchFederalStateCodeDisplays).toHaveBeenCalledExactlyOnceWith(NotificationType.NonNominalNotification7_3);
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).toHaveBeenCalledExactlyOnceWith(NotificationType.NonNominalNotification7_3, 'DE-BY');
    expect(service.countryCodeDisplays).toBe(countries);
    expect(service.federalStateCodeDisplays).toBe(states);
    expect(service.pathogenCodeDisplays).toBe(pathogens);
    expect(service.notifierFacilityFields().length).toBeGreaterThan(0);
    expect(service.submitterFacilityFields().length).toBeGreaterThan(0);
    expect(service.notifiedPersonFields().length).toBeGreaterThan(0);
    const state = flattenFields(service.notificationCategoryFields()).find(field => field.key === 'federalStateCodeDisplay');
    expect(state.props.options).toEqual([{ value: 'DE-BW', label: 'Baden-Wuerttemberg' }]);
  });

  it('copies notifier facility data into the submitting facility when the copy checkbox is selected', () => {
    service.notifierFacilityGroup.addControl('facilityInfo', new FormGroup({ institutionName: new FormControl('Notifier facility', Validators.required) }));
    service.notifierFacilityGroup.addControl('address', new FormGroup({ street: new FormControl('Notifier street') }));
    service.notifierFacilityGroup.addControl('contact', new FormGroup({ firstname: new FormControl('Ada'), lastname: new FormControl('Lovelace') }));
    service.notifierFacilityGroup.addControl(
      'contacts',
      new FormGroup({
        phoneNumbers: new FormControl([{ value: '123' }]),
        emailAddresses: new FormControl([{ value: 'ada@example.test' }]),
      })
    );

    const departmentName = new FormControl('Department');
    service.submittingFacilityGroup.addControl('facilityInfo', new FormGroup({ institutionName: new FormControl(''), departmentName }));
    const country = new FormControl('DE');
    service.submittingFacilityGroup.addControl('address', new FormGroup({ street: new FormControl(''), country }));
    service.submittingFacilityGroup.addControl('contact', new FormGroup({ firstname: new FormControl(''), lastname: new FormControl('') }));
    service.submittingFacilityGroup.addControl('contacts', new FormGroup({ phoneNumbers: new FormControl([]), emailAddresses: new FormControl([]) }));
    const checkboxControl = new FormControl(true);
    service.submittingFacilityGroup.addControl('copyAddressCheckBox', checkboxControl);

    service.initialize(NotificationType.NominalNotification7_1);
    const checkbox = flattenFields(service.submitterFacilityFields()).find(field => field.key === 'copyAddressCheckBox');
    const field: FormlyFieldConfig = { formControl: checkboxControl };

    checkbox.props.change(field);

    expect(service.submittingFacilityGroup.getRawValue()).toMatchObject({
      facilityInfo: { institutionName: 'Notifier facility' },
      address: { street: 'Notifier street' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: {
        phoneNumbers: [{ value: '123' }],
        emailAddresses: [{ value: 'ada@example.test' }],
      },
    });
    expect(service.submittingFacilityModel()).toMatchObject({
      copyAddressCheckBox: true,
      facilityInfo: { institutionName: 'Notifier facility' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: { phoneNumbers: [{ value: '123' }], emailAddresses: [{ value: 'ada@example.test' }] },
    });
    expect(departmentName.enabled).toBe(true);
    expect(checkboxControl.enabled).toBe(true);

    service.notifierFacilityGroup.patchValue({
      facilityInfo: { institutionName: 'Updated notifier facility' },
      address: { street: 'Updated notifier street' },
    });

    expect(service.submittingFacilityGroup.get('facilityInfo.institutionName').value).toBe('Updated notifier facility');
    expect(service.submittingFacilityGroup.get('address.street').value).toBe('Updated notifier street');

    service.notifierFacilityGroup.patchValue({
      facilityInfo: { institutionName: '' },
      address: { street: 'Street updated while notifier is invalid' },
    });

    expect(service.notifierFacilityGroup.invalid).toBe(true);
    expect(service.submittingFacilityGroup.get('facilityInfo.institutionName').value).toBe('');
    expect(service.submittingFacilityGroup.get('address.street').value).toBe('Street updated while notifier is invalid');

    service.notifiedPersonGroup.addControl('currentAddressType', new FormControl(AddressType.SubmittingFacility));
    checkboxControl.setValue(false);
    checkbox.props.change(field);

    expect(service.submittingFacilityGroup.get('facilityInfo.institutionName').value).toBeNull();
    expect(service.submittingFacilityGroup.get('address').value).toEqual({ street: null, country: 'DE' });
    expect(service.submittingFacilityGroup.get('contact').value).toEqual({ firstname: null, lastname: null });
    expect(country.enabled).toBe(true);
    expect(service.notifiedPersonGroup.get('currentAddressType').value).toBeNull();
    expect(service.submittingFacilityModel().contacts).toEqual({
      phoneNumbers: [{ contactType: 'phone', value: '' }],
      emailAddresses: [{ contactType: 'email', value: '' }],
    });
  });

  it('synchronizes models even when the target steps have no form controls', () => {
    service.notifierFacilityModel.set({
      facilityInfo: { institutionName: 'Laboratory' },
      address: { street: 'Laboratory street', country: 'DE' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: { phoneNumbers: [{ contactType: 'phone', value: '030123456' }], emailAddresses: [] },
    });
    service.submittingFacilityModel.set({ copyAddressCheckBox: true, facilityInfo: { departmentName: 'Ward' } });
    service.notifiedPersonModel.set({
      currentAddressType: AddressType.SubmittingFacility,
      residenceAddress: { street: 'Residence street' },
    });

    service.handleNotifierFacilityChange();

    expect(service.submittingFacilityModel()).toMatchObject({
      copyAddressCheckBox: true,
      facilityInfo: { institutionName: 'Laboratory', departmentName: 'Ward' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: { phoneNumbers: [{ value: '030123456' }] },
    });
    expect(service.submittingFacilityModel().contact).not.toBe(service.notifierFacilityModel().contact);
    expect(service.notifiedPersonModel()).toMatchObject({
      currentAddress: { street: 'Laboratory street', country: 'DE', additionalInfo: 'Laboratory' },
      residenceAddress: { street: 'Residence street' },
    });

    service.submittingFacilityModel.update(model => ({ ...model, copyAddressCheckBox: false }));
    service.notifierFacilityModel.set({ facilityInfo: { institutionName: 'Other laboratory' } });
    service.handleNotifierFacilityChange();
    expect(service.submittingFacilityModel().facilityInfo.institutionName).toBe('Laboratory');
  });

  it('rejects copying when the notifier facility form is invalid', () => {
    service.notifierFacilityGroup.addControl('requiredField', new FormControl('', Validators.required));
    service.initialize(NotificationType.NominalNotification7_1);
    const checkbox = flattenFields(service.submitterFacilityFields()).find(field => field.key === 'copyAddressCheckBox');
    const checkboxControl = new FormControl(true);

    checkbox.props.change({ formControl: checkboxControl });

    expect(checkboxControl.value).toBe(false);
    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledWith(
      'Bitte geben Sie die Daten für die Meldende Person zunächst vollständig an.',
      'Fehler bei der Auswahl'
    );
  });

  it.each([undefined, ''])('defaults to DE-BW when the stored state is %s', state => {
    storage.getFederalStateCode.mockReturnValue(state);
    service.initialize(NotificationType.NominalNotification7_1);
    expect(storage.setFederalStateCode).toHaveBeenCalledWith('DE-BW');
    expect(service.notificationCategoryModel()).toEqual({ federalStateCodeDisplay: 'DE-BW' });
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, 'DE-BW');
  });

  it('waits for every initial request to complete before publishing the configurations', () => {
    const response = new Subject<CodeDisplay[]>();
    fhir.fetchCountryCodeDisplays.mockReturnValue(response);
    service.initialize(NotificationType.NominalNotification7_1);
    response.next(countries);
    expect(service.notifierFacilityFields()).toEqual([]);
    response.complete();
    expect(service.countryCodeDisplays).toBe(countries);
    expect(service.notifierFacilityFields().length).toBeGreaterThan(0);
  });

  it('cancels earlier initialization requests when a new notification type is initialized', () => {
    const previousResponse = new Subject<CodeDisplay[]>();
    fhir.fetchCountryCodeDisplays.mockReturnValueOnce(previousResponse);
    service.initialize(NotificationType.NominalNotification7_1);
    expect(previousResponse.observed).toBe(true);

    service.initialize(NotificationType.AnonymousNotification7_3);
    expect(previousResponse.observed).toBe(false);
    const fields = service.notifiedPersonFields();
    previousResponse.next([]);
    previousResponse.complete();
    expect(service.notificationType).toBe(NotificationType.AnonymousNotification7_3);
    expect(service.notifiedPersonFields()).toBe(fields);
    expect(service.countryCodeDisplays).toBe(countries);
  });

  it('preserves nested model fields and replaces contact arrays when overlaying registered controls', () => {
    service.notifierFacilityModel.set({
      address: { street: 'Model street', city: 'Berlin', country: 'DE' },
      contact: { firstname: 'Ada', lastname: 'Lovelace' },
      contacts: { phoneNumbers: [{ contactType: 'phone', value: '123' }], emailAddresses: [] },
    });
    service.notifierFacilityGroup.addControl('address', new FormGroup({ street: new FormControl('Control street') }));
    service.notifierFacilityGroup.addControl('contact', new FormGroup({ firstname: new FormControl(null) }));
    service.notifierFacilityGroup.addControl('contacts', new FormGroup({ phoneNumbers: new FormControl([]) }));
    service.submittingFacilityModel.set({ copyAddressCheckBox: true });

    service.handleNotifierFacilityChange();

    expect(service.submittingFacilityModel()).toMatchObject({
      address: { street: 'Control street', city: 'Berlin', country: 'DE' },
      contact: { firstname: null, lastname: 'Lovelace' },
      contacts: { phoneNumbers: [], emailAddresses: [] },
    });
    expect(service.notifierFacilityModel().address.street).toBe('Model street');
  });

  it('does not update an equal current address with a different property order', () => {
    service.notifiedPersonModel.set({
      currentAddressType: AddressType.SubmittingFacility,
      currentAddress: { additionalInfo: 'Hospital', country: 'DE', street: 'Hospital street' },
    });
    service.submittingFacilityModel.set({
      address: { street: 'Hospital street', country: 'DE' },
      facilityInfo: { institutionName: 'Hospital' },
    });
    const model = service.notifiedPersonModel();
    service.updateCurrentAddressFromSubmittingFacility();
    expect(service.notifiedPersonModel()).toBe(model);
  });

  it.each(['fetchCountryCodeDisplays', 'fetchFederalStateCodeDisplays', 'fetchPathogenCodeDisplaysByTypeAndState'] as const)(
    'logs failures from %s and builds configurations with empty lists',
    method => {
      const error = new Error('Initial data failed');
      fhir[method].mockReturnValue(throwError(() => error));
      service.initialize(NotificationType.NominalNotification7_1);
      expect(logger.error).toHaveBeenCalledWith(error);
      expect(service.formsInitialized()).toBe(false);
      expect(service.isFormValid()).toBe(false);
      expect(service.countryCodeDisplays).toEqual([]);
      expect(service.federalStateCodeDisplays).toEqual([]);
      expect(service.pathogenCodeDisplays).toEqual([]);
      expect(service.notificationCategoryFields().length).toBeGreaterThan(0);
    }
  );

  it.each([
    [NotificationType.FollowUpNotification7_1, NotifiedPersonDisclaimer.FOLLOW_UP_DISCLAIMER],
    [NotificationType.FollowUpNotification7_3, NotifiedPersonDisclaimer.FOLLOW_UP_NONNOMINAL_DISCLAIMER],
    [NotificationType.AnonymousNotification7_3, NotifiedPersonDisclaimer.ANONYMOUS_DISCLAIMER],
    [NotificationType.NonNominalNotification7_3, NotifiedPersonDisclaimer.NON_NOMINAL_DISCLAIMER],
  ])('includes the correct disclaimer in the person fields for notification type %s', (type, disclaimer) => {
    service.countryCodeDisplays = countries;
    const fields = flattenFields(service.getNotifiedPersonFields(type));
    expect(fields.some(field => typeof field.template === 'string' && field.template.includes(disclaimer))).toBe(true);
  });

  it('uses the named person fields for nominal notifications', () => {
    service.countryCodeDisplays = countries;
    const fields = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1));
    expect(fields.some(field => field.key === 'residenceAddress')).toBe(true);
    expect(fields.some(field => field.key === 'currentAddress')).toBe(true);
  });

  it('rejects selecting the submitting facility as the current address when its details are incomplete', async () => {
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.SubmittingFacility);

    addressTypeField.props.change({ formControl });
    expect(formControl.value).toBe(AddressType.SubmittingFacility);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBeNull();
    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledExactlyOnceWith(
      'Bitte geben Sie zunächst den Namen und die Adresse der Einsendeeinrichtung vollständig und korrekt an.',
      'Fehler bei der Auswahl'
    );
  });

  it.each(['street', 'houseNumber', 'zip', 'city', 'country'] as const)('rejects selecting the submitting facility when its %s is blank', async addressKey => {
    service.submittingFacilityModel.set({
      facilityInfo: { institutionName: 'Laboratory' },
      address: { street: 'Main Street', houseNumber: '1', zip: '12345', city: 'Berlin', country: 'DE', [addressKey]: '  ' },
    });
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.SubmittingFacility);

    addressTypeField.props.change({ formControl });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBeNull();
    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledOnce();
  });

  it.each(['street', 'houseNumber', 'zip', 'city', 'country'] as const)(
    'rejects selecting the submitting facility when its registered %s control is invalid',
    async addressKey => {
      const addressValues = { street: 'Main Street', houseNumber: '1', zip: '12345', city: 'Berlin', country: 'DE' };
      service.submittingFacilityModel.set({
        facilityInfo: { institutionName: 'Laboratory' },
        address: addressValues,
      });
      service.submittingFacilityGroup.addControl(
        'address',
        new FormGroup({
          street: new FormControl(addressKey === 'street' ? '' : addressValues.street, addressKey === 'street' ? Validators.required : []),
          houseNumber: new FormControl(addressKey === 'houseNumber' ? '' : addressValues.houseNumber, addressKey === 'houseNumber' ? Validators.required : []),
          zip: new FormControl(addressKey === 'zip' ? '' : addressValues.zip, addressKey === 'zip' ? Validators.required : []),
          city: new FormControl(addressKey === 'city' ? '' : addressValues.city, addressKey === 'city' ? Validators.required : []),
          country: new FormControl(addressKey === 'country' ? '' : addressValues.country, addressKey === 'country' ? Validators.required : []),
        })
      );
      const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
        field => field.key === 'currentAddressType'
      );
      if (!addressTypeField) throw new Error('Current address type field is missing.');
      const formControl = new FormControl(AddressType.SubmittingFacility);

      addressTypeField.props.change({ formControl });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(formControl.value).toBeNull();
      expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledOnce();
    }
  );

  it('rejects a whitespace-only institution name even when its registered control is valid', async () => {
    service.submittingFacilityModel.set({
      facilityInfo: { institutionName: '  ' },
      address: { street: 'Main Street', houseNumber: '1', zip: '12345', city: 'Berlin', country: 'DE' },
    });
    service.submittingFacilityGroup.addControl('facilityInfo', new FormGroup({ institutionName: new FormControl('  ') }));
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.SubmittingFacility);

    addressTypeField.props.change({ formControl });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBeNull();
    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledOnce();
  });

  it('rejects selecting the submitting facility when its registered institution name control is invalid', async () => {
    service.submittingFacilityModel.set({
      facilityInfo: { institutionName: 'Laboratory' },
      address: { street: 'Main Street', houseNumber: '1', zip: '12345', city: 'Berlin', country: 'DE' },
    });
    service.submittingFacilityGroup.addControl('facilityInfo', new FormGroup({ institutionName: new FormControl('', Validators.required) }));
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.SubmittingFacility);

    addressTypeField.props.change({ formControl });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBeNull();
    expect(dialog.showBasicClosableErrorDialog).toHaveBeenCalledOnce();
  });

  it('allows selecting the submitting facility as the current address when all required details are present', async () => {
    service.submittingFacilityModel.set({
      facilityInfo: { institutionName: 'Laboratory' },
      address: { street: 'Main Street', houseNumber: '1', zip: '12345', city: 'Berlin', country: 'DE' },
    });
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.SubmittingFacility);

    addressTypeField.props.change({ formControl });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBe(AddressType.SubmittingFacility);
    expect(dialog.showBasicClosableErrorDialog).not.toHaveBeenCalled();
  });

  it('allows selection when all registered submitting-facility controls are valid', async () => {
    service.submittingFacilityModel.set({
      facilityInfo: { institutionName: 'Laboratory' },
      address: { street: 'Main Street', houseNumber: '1', zip: '12345', city: 'Berlin', country: 'DE' },
    });
    service.submittingFacilityGroup.addControl('facilityInfo', new FormGroup({ institutionName: new FormControl('Laboratory', Validators.required) }));
    service.submittingFacilityGroup.addControl(
      'address',
      new FormGroup({
        street: new FormControl('Main Street', Validators.required),
        houseNumber: new FormControl('1', Validators.required),
        zip: new FormControl('12345', Validators.required),
        city: new FormControl('Berlin', Validators.required),
        country: new FormControl('DE', Validators.required),
      })
    );
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.SubmittingFacility);

    addressTypeField.props.change({ formControl });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBe(AddressType.SubmittingFacility);
    expect(dialog.showBasicClosableErrorDialog).not.toHaveBeenCalled();
  });

  it('does not validate other current address types against submitting facility details', async () => {
    const addressTypeField = flattenFields(service.getNotifiedPersonFields(NotificationType.NominalNotification7_1)).find(
      field => field.key === 'currentAddressType'
    );
    if (!addressTypeField) throw new Error('Current address type field is missing.');
    const formControl = new FormControl(AddressType.PrimaryAsCurrent);

    addressTypeField.props.change({ formControl });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(formControl.value).toBe(AddressType.PrimaryAsCurrent);
    expect(dialog.showBasicClosableErrorDialog).not.toHaveBeenCalled();
  });

  function pathogenData(): PathogenData {
    const code = (value: string): CodeDisplay => ({ code: value, display: value, designations: [] });
    return {
      codeDisplay: pathogens[0],
      header: 'Diagnostic header',
      subheader: 'Diagnostic subheader',
      materials: [code('Blood')],
      methods: [code('PCR')],
      answerSet: [],
      resistanceGenes: [code('Gene')],
      resistances: [code('Antibiotic')],
      substances: [code('Analyte')],
    };
  }

  it('stores pathogen data and supplies diagnostic autocomplete and analyte options', async () => {
    const data = pathogenData();
    service.setPathogenData(data);
    expect(service.pathogenData).toBe(data);
    const fields = flattenFields(service.diagnosticFormFields());
    expect(fields.find(field => field.key === 'diagnosticInfoWrapper').template).toContain('<h2>Diagnostic header</h2><h3>Diagnostic subheader</h3>');
    for (const [key, expected] of [
      ['material', 'Blood'],
      ['method', 'PCR'],
      ['resistanceGene', 'Gene'],
      ['resistance', 'Antibiotic'],
    ]) {
      const field = fields.find(candidate => candidate.key === key);
      expect(await firstValueFrom(field.props.filter(''))).toEqual([expected]);
      expect(await firstValueFrom(field.props.filter('no match'))).toEqual([]);
    }
    expect(fields.find(field => field.key === 'analyt').props.options).toEqual([{ code: 'Analyte', display: 'Analyte' }]);
  });

  it('handles missing optional diagnostic lists and subheader', () => {
    const data = pathogenData();
    delete data.resistanceGenes;
    delete data.resistances;
    delete data.substances;
    delete data.subheader;
    service.setPathogenData(data);
    const fields = flattenFields(service.diagnosticFormFields());
    expect(fields.find(field => field.key === 'analyt').props.options).toEqual([]);
    expect(fields.find(field => field.key === 'diagnosticInfoWrapper').template).toContain('<h3></h3>');
    for (const key of ['resistanceList', 'resistanceGeneList', 'analyt']) {
      const field = fields.find(candidate => candidate.key === key);
      const hide = field.expressions.hide;
      expect(typeof hide === 'function' && hide(field)).toBe(true);
    }
  });

  it('replaces diagnostic options on a subsequent pathogen selection and passes the notification type', async () => {
    service.notificationType = NotificationType.AnonymousNotification7_3;
    service.setPathogenData(pathogenData());
    const previousFields = service.diagnosticFormFields();
    const nextData = { ...pathogenData(), materials: [] };
    service.setPathogenData(nextData);
    const fields = flattenFields(service.diagnosticFormFields());
    expect(service.diagnosticFormFields()).not.toBe(previousFields);
    expect(service.pathogenData).toBe(nextData);
    expect(await firstValueFrom(fields.find(field => field.key === 'material').props.filter(''))).toEqual([]);
    expect(fields.find(field => field.type === 'demis-favorites-add-list').props.notificationType).toBe(NotificationType.AnonymousNotification7_3);
  });

  it.each([NotificationType.NominalNotification7_1, NotificationType.NonNominalNotification7_3, NotificationType.AnonymousNotification7_3])(
    'transforms and submits the current models using notification type %s',
    notificationType => {
      service.initialize(notificationType);
      service.setPathogenData(pathogenData());
      service.notifierFacilityModel.set({ facilityInfo: { institutionName: 'Notifier' } });
      service.sendData();

      expect(transformPathogenFormToPathogenTest).toHaveBeenCalledExactlyOnceWith(service.getModelData(), notificationType, pathogens[0], service.pathogenData);
      expect(fhir.submitNotification).toHaveBeenCalledExactlyOnceWith(vi.mocked(transformPathogenFormToPathogenTest).mock.results[0].value, notificationType);
    }
  );
});
