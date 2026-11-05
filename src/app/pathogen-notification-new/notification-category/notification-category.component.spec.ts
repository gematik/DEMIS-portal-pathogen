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
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormlyFilterableSelectComponent, MessageDialogService, StepNavigation } from '@gematik/demis-portal-core-library';
import { FieldType, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { NGXLogger } from 'ngx-logger';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeDisplay, PathogenData } from '../../../api/notification';
import { NotificationType } from '../../pathogen-notification/common/routing-helper';
import { FavoritesListComponent } from '../../pathogen-notification/components/favorites-list/favorites-list.component';
import { formatCodeDisplayToDesignationOption, formatCodeDisplayToDisplay } from '../../pathogen-notification/legacy/common-utils';
import { FhirPathogenNotificationService } from '../../pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../pathogen-notification/services/pathogen-notification-storage.service';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { NotificationCategoryComponent } from './notification-category.component';
import { AutocompleteTypeComponent } from '../../pathogen-notification/legacy/formly/types/autocomplete/autocomplete-type.component';

@Component({ template: '' })
class SelectionTestField extends FieldType {}

describe('NotificationCategoryComponent selection changes', () => {
  const pathogen: CodeDisplay = { code: 'test', display: 'Test pathogen', designations: [{ language: 'de', value: 'Deutscher Erreger' }] };
  const data: PathogenData = { codeDisplay: pathogen, header: 'Test', answerSet: [], materials: [], methods: [] };

  async function setup() {
    const service = {
      notificationType: NotificationType.NominalNotification7_1,
      pathogenCodeDisplays: [pathogen],
      notificationCategoryGroup: new FormGroup({
        federalStateCodeDisplay: new FormControl('DE-BW'),
        pathogenDisplay: new FormControl(''),
        pathogen: new FormControl('Previous species'),
      }),
      notificationCategoryModel: signal({ federalStateCodeDisplay: 'DE-BW', pathogenDisplay: '', pathogen: 'Previous species' }),
      notificationCategoryFields: signal<FormlyFieldConfig[]>([
        {
          fieldGroup: ['federalStateCodeDisplay', 'pathogenDisplay', 'pathogen'].map(key => ({
            key,
            type: key === 'pathogenDisplay' ? 'autocomplete' : 'selection-test',
            props: {},
          })),
        },
      ]),
      pathogenDTOGroup: new FormGroup({ specimen: new FormControl('Previous diagnostic') }),
      pathogenModel: signal({ specimen: 'Previous diagnostic' }),
      setPathogenData: vi.fn(),
    };
    const storage = {
      getSelectedPathogenCodeDisplay: vi.fn<() => CodeDisplay | undefined>().mockReturnValue(undefined),
      getFederalStateCode: vi.fn<() => string | undefined>().mockReturnValue('DE-BW'),
      setSelectedPathogenCodeDisplay: vi.fn(),
      removeSelectedPathogenCodeDisplay: vi.fn(),
      setFederalStateCode: vi.fn(),
    };
    storage.setFederalStateCode.mockImplementation(code => storage.getFederalStateCode.mockReturnValue(code));
    const response = new Subject<PathogenData>();
    const statesResponse = new Subject<CodeDisplay[]>();
    const fhir = {
      fetchDiagnosticsBasedOnPathogenSelection: vi.fn().mockReturnValue(response),
      fetchPathogenCodeDisplaysByTypeAndState: vi.fn().mockReturnValue(statesResponse),
    };
    const logger = { error: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [
        NotificationCategoryComponent,
        FormlyModule.forRoot({
          types: [
            { name: 'selection-test', component: SelectionTestField },
            { name: 'autocomplete', component: AutocompleteTypeComponent },
          ],
        }),
      ],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        { provide: PathogenNotificationStorageService, useValue: storage },
        { provide: FhirPathogenNotificationService, useValue: fhir },
        { provide: StepNavigation, useValue: {} },
        { provide: NGXLogger, useValue: logger },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationCategoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, service, storage, fhir, response, statesResponse, logger };
  }

  let context: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    context = await setup();
  });

  it('loads diagnostics for a localized pathogen and stops loading after the first response', () => {
    const { fixture, service, storage, fhir, response } = context;
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith('test', NotificationType.NominalNotification7_1);
    expect(fixture.componentInstance.isLoading()).toBe(true);
    expect(service.pathogenModel()).toEqual({});
    response.next(data);
    response.next({ ...data, header: 'Ignored response' });
    expect(service.setPathogenData).toHaveBeenCalledExactlyOnceWith(data);
    expect(storage.setSelectedPathogenCodeDisplay).toHaveBeenCalledExactlyOnceWith(pathogen);
    expect(service.notificationCategoryModel().pathogenDisplay).toBe('Deutscher Erreger');
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('centers the loading spinner over the form without shifting its layout', () => {
    const { fixture } = context;
    const container: HTMLElement = fixture.nativeElement.querySelector('.form-container');
    const input: HTMLInputElement = container.querySelector('input');
    const initialContainer = container.getBoundingClientRect();
    const initialInput = input.getBoundingClientRect();
    expect(container.querySelector('mat-spinner')).toBeNull();

    fixture.componentInstance.isLoading.set(true);
    fixture.detectChanges();

    const loadingContainer = container.getBoundingClientRect();
    const spinner = container.querySelector('mat-spinner').getBoundingClientRect();
    expect(loadingContainer.top).toBe(initialContainer.top);
    expect(loadingContainer.height).toBe(initialContainer.height);
    expect(input.getBoundingClientRect().top).toBe(initialInput.top);
    expect(spinner.left + spinner.width / 2).toBeCloseTo(loadingContainer.left + loadingContainer.width / 2, 0);
    expect(spinner.top + spinner.height / 2).toBeCloseTo(loadingContainer.top + loadingContainer.height / 2, 0);
    expect(container.getAttribute('aria-busy')).toBe('true');

    fixture.componentInstance.isLoading.set(false);
    fixture.detectChanges();
    expect(container.querySelector('mat-spinner')).toBeNull();
    expect(container.getAttribute('aria-busy')).toBe('false');
  });

  it('does not reload or clear diagnostics for the already selected pathogen', () => {
    const { service, storage, fhir } = context;
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(pathogen);
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
    expect(service.pathogenModel()).toEqual({ specimen: 'Previous diagnostic' });
  });

  it('ignores input that does not match a reportable pathogen', () => {
    const { service, fhir } = context;
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Unknown pathogen');
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).not.toHaveBeenCalled();
    expect(service.pathogenModel()).toEqual({ specimen: 'Previous diagnostic' });
  });

  it('clears dependent data and stored selection when the pathogen is cleared', () => {
    const { service, storage } = context;
    const resetDiagnostic = vi.spyOn(service.pathogenDTOGroup, 'reset');
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('');
    expect(storage.removeSelectedPathogenCodeDisplay).toHaveBeenCalledOnce();
    expect(service.notificationCategoryModel()).toEqual({ federalStateCodeDisplay: 'DE-BW', pathogenDisplay: '', pathogen: undefined });
    expect(service.pathogenModel()).toEqual({});
    expect(service.pathogenDTOGroup.controls.specimen.value).toBeNull();
    expect(service.notificationCategoryGroup.untouched).toBe(true);
    expect(resetDiagnostic).toHaveBeenCalledOnce();
  });

  it('logs a diagnostics failure, clears selections and stops loading', () => {
    const { fixture, service, storage, fhir, logger } = context;
    const error = new Error('Diagnostics unavailable');
    fhir.fetchDiagnosticsBasedOnPathogenSelection.mockReturnValue(throwError(() => error));
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(error);
    expect(storage.removeSelectedPathogenCodeDisplay).toHaveBeenCalledOnce();
    expect(service.notificationCategoryGroup.controls.pathogenDisplay.value).toBe('');
    expect(service.notificationCategoryModel().pathogen).toBeUndefined();
    expect(service.setPathogenData).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('shows all available pathogens when reopening after a diagnostics failure', async () => {
    const { fixture, service, response } = context;
    const autocomplete = fixture.debugElement.query(By.directive(AutocompleteTypeComponent)).componentInstance as AutocompleteTypeComponent;
    service.pathogenCodeDisplays.push({ code: 'other', display: 'Other pathogen', designations: [] });
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    response.error(new Error('Diagnostics unavailable'));
    fixture.detectChanges();

    expect(autocomplete.formControl.value).toBe('');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.focus();
    input.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await firstValueFrom(autocomplete.filter)).toEqual(['Deutscher Erreger', 'Other pathogen']);
    expect(autocomplete.autocomplete.panelOpen).toBe(true);
    expect(Array.from(document.querySelectorAll('mat-option')).map(option => option.textContent.trim())).toEqual(['Deutscher Erreger', 'Other pathogen']);
  });

  it('uses DE-BW when no federal state is stored', () => {
    const { service, storage, response } = context;
    storage.getFederalStateCode.mockReturnValue(undefined);
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    response.next(data);
    expect(service.notificationCategoryModel().federalStateCodeDisplay).toBe('DE-BW');
  });

  it('preserves diagnostics when species are changed, repeated or cleared', () => {
    const { service } = context;
    const resetDiagnostic = vi.spyOn(service.pathogenDTOGroup, 'reset');
    service.notificationCategoryGroup.controls.pathogen.setValue('New species');
    expect(service.pathogenModel()).toEqual({ specimen: 'Previous diagnostic' });
    expect(service.pathogenDTOGroup.controls.specimen.value).toBe('Previous diagnostic');
    service.notificationCategoryGroup.controls.pathogen.setValue('New species');
    expect(service.pathogenModel()).toEqual({ specimen: 'Previous diagnostic' });
    expect(service.pathogenDTOGroup.controls.specimen.value).toBe('Previous diagnostic');
    service.notificationCategoryGroup.controls.pathogen.setValue('');
    expect(service.pathogenModel()).toEqual({ specimen: 'Previous diagnostic' });
    expect(service.pathogenDTOGroup.controls.specimen.value).toBe('Previous diagnostic');
    expect(resetDiagnostic).not.toHaveBeenCalled();
  });

  it('filters the refreshed pathogen list and ignores repeated federal states', async () => {
    const { fixture, service, fhir, statesResponse } = context;
    service.notificationCategoryGroup.controls.federalStateCodeDisplay.setValue('DE-BE');
    service.notificationCategoryGroup.controls.federalStateCodeDisplay.setValue('DE-BE');
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).toHaveBeenCalledExactlyOnceWith(NotificationType.NominalNotification7_1, 'DE-BE');
    statesResponse.next([pathogen, { code: 'other', display: 'Other pathogen', designations: [] }]);
    const field = fixture.debugElement
      .queryAll(By.directive(AutocompleteTypeComponent))
      .map(element => (element.componentInstance as AutocompleteTypeComponent).field)
      .find(field => field.key === 'pathogenDisplay');
    expect(await firstValueFrom(field.props.filter('deutscher'))).toEqual(['Deutscher Erreger']);
    expect(await firstValueFrom(field.props.filter('no match'))).toEqual([]);
    expect(await firstValueFrom(field.props.filter(''))).toEqual(['Deutscher Erreger', 'Other pathogen']);
  });

  it('refreshes the active autocomplete list after the federal state response arrives', () => {
    const { fixture, service, statesResponse } = context;
    const autocomplete = fixture.debugElement.query(By.directive(AutocompleteTypeComponent)).componentInstance as AutocompleteTypeComponent;
    let displayedOptions: string[] = [];
    const subscription = autocomplete.filter.subscribe(options => (displayedOptions = options));
    expect(displayedOptions).toEqual(['Deutscher Erreger']);

    service.notificationCategoryGroup.controls.federalStateCodeDisplay.setValue('DE-BE');
    const newPathogens: CodeDisplay[] = [
      { code: 'one', display: 'First pathogen', designations: [] },
      { code: 'two', display: 'Second pathogen', designations: [] },
    ];
    statesResponse.next(newPathogens);

    expect(displayedOptions).toEqual(['First pathogen', 'Second pathogen']);
    expect(service.notificationCategoryGroup.controls.pathogenDisplay.value).toBe('');
    expect(service.notificationCategoryModel().pathogenDisplay).toBe('');
    subscription.unsubscribe();
  });

  it('cancels pending diagnostics when the component is destroyed', () => {
    const { fixture, service, storage, response } = context;
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    fixture.destroy();
    response.next(data);
    expect(service.setPathogenData).not.toHaveBeenCalled();
    expect(storage.setSelectedPathogenCodeDisplay).not.toHaveBeenCalled();
  });

  it('refreshes species options when diagnostics for a new pathogen arrive', () => {
    const { fixture, service, response } = context;
    const field = fixture.debugElement
      .queryAll(By.directive(SelectionTestField))
      .map(element => (element.componentInstance as SelectionTestField).field)
      .find(field => field.key === 'pathogen');
    service.notificationCategoryGroup.controls.pathogenDisplay.setValue('Deutscher Erreger');
    response.next({
      ...data,
      answerSet: [
        { code: 'one', display: 'First species', designations: [] },
        { code: 'two', display: 'Second species', designations: [] },
      ],
    });
    expect(field.props.options).toEqual([
      { code: 'one', display: 'First species' },
      { code: 'two', display: 'Second species' },
    ]);
    expect(service.notificationCategoryGroup.controls.pathogen.value).toBeUndefined();
  });

  it('cancels pending federal state requests when the component is destroyed', () => {
    const { fixture, service, statesResponse } = context;
    service.notificationCategoryGroup.controls.federalStateCodeDisplay.setValue('DE-BE');
    fixture.destroy();
    statesResponse.next([]);
    expect(service.pathogenCodeDisplays).toEqual([pathogen]);
  });
});

describe('NotificationCategoryComponent favorites', () => {
  it.each([1, 3])('preserves all %i species options and an explicitly cleared selection after reopening', async optionCount => {
    const answerSet = Array.from({ length: optionCount }, (_, index) => ({
      code: `species-${index}`,
      display: `Species ${index}`,
      designations: [],
    }));
    const data: PathogenData = {
      codeDisplay: { code: 'test', display: 'Test', designations: [] },
      header: 'Test',
      answerSet,
      materials: [],
      methods: [],
    };
    const service = {
      notificationType: NotificationType.NominalNotification7_1,
      pathogenCodeDisplays: [data.codeDisplay],
      pathogenData: undefined as PathogenData | undefined,
      notificationCategoryGroup: new FormGroup({ pathogenDisplay: new FormControl('Test') }),
      notificationCategoryModel: signal({ pathogenDisplay: 'Test', pathogen: answerSet[0] }),
      notificationCategoryFields: signal<FormlyFieldConfig[]>([
        { key: 'pathogenDisplay', type: 'selection-test' },
        {
          key: 'pathogen',
          type: 'filterable-select',
          props: { required: true, optionValueKey: 'code', optionLabelKey: 'display' },
        },
      ]),
      pathogenDTOGroup: new FormGroup({}),
      pathogenModel: signal({}),
      setPathogenData: (nextData: PathogenData) => {
        service.pathogenData = nextData;
      },
    };
    const diagnosticsResponse = new Subject<PathogenData>();
    await TestBed.configureTestingModule({
      imports: [
        NotificationCategoryComponent,
        FormlyModule.forRoot({
          types: [
            { name: 'filterable-select', component: FormlyFilterableSelectComponent },
            { name: 'selection-test', component: SelectionTestField },
          ],
        }),
      ],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        {
          provide: PathogenNotificationStorageService,
          useValue: {
            getSelectedPathogenCodeDisplay: () => undefined,
            getFederalStateCode: () => 'DE-BW',
            setSelectedPathogenCodeDisplay: vi.fn(),
          },
        },
        { provide: FhirPathogenNotificationService, useValue: { fetchDiagnosticsBasedOnPathogenSelection: () => diagnosticsResponse } },
        { provide: StepNavigation, useValue: {} },
        { provide: NGXLogger, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();
    let fixture = TestBed.createComponent(NotificationCategoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    service.notificationCategoryGroup.get('pathogenDisplay').setValue('Test');
    diagnosticsResponse.next(data);
    fixture.detectChanges();
    await fixture.whenStable();
    let select = fixture.debugElement.query(By.directive(FormlyFilterableSelectComponent)).componentInstance as FormlyFilterableSelectComponent;
    expect(select.field.props.options).toEqual(answerSet.map(formatCodeDisplayToDesignationOption));
    if (optionCount === 1) {
      expect(select.formControl.value).toEqual(formatCodeDisplayToDesignationOption(answerSet[0]));
      expect(select.triggerDisplay()).toBe('Species 0');
    } else {
      expect(select.formControl.value).toBeFalsy();
    }
    select.formControl.setValue(answerSet[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    const nextPathogen: CodeDisplay = { code: 'next', display: 'Next pathogen', designations: [] };
    const nextAnswerSet: CodeDisplay[] = Array.from({ length: optionCount }, (_, index) => ({
      code: `next-species-${index}`,
      display: `Next species ${index}`,
      designations: [],
    }));
    service.pathogenCodeDisplays.push(nextPathogen);
    service.notificationCategoryGroup.get('pathogenDisplay').setValue('Next pathogen');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(select.triggerDisplay()).toBe('');
    diagnosticsResponse.next({ ...data, codeDisplay: nextPathogen, answerSet: nextAnswerSet });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(select.triggerDisplay()).toBe(optionCount === 1 ? 'Next species 0' : '');
    select.openSelect();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      select
        .matSelectRef()
        .options.filter(option => !option.disabled && option.value)
        .map(option => option.value)
    ).toEqual(nextAnswerSet.map(formatCodeDisplayToDesignationOption));
    select.matSelectRef().close();

    select.clearSelection(new MouseEvent('click'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(service.notificationCategoryModel().pathogen).toBeFalsy();
    fixture.destroy();

    fixture = TestBed.createComponent(NotificationCategoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    select = fixture.debugElement.query(By.directive(FormlyFilterableSelectComponent)).componentInstance as FormlyFilterableSelectComponent;
    expect(select.field.props.options).toEqual(nextAnswerSet.map(formatCodeDisplayToDesignationOption));
    expect(select.formControl.value).toBeFalsy();
    expect(service.notificationCategoryModel().pathogen).toBeFalsy();
    fixture.destroy();
  });

  it('renders favorites and loads a favorite once without the legacy component', async () => {
    const pathogen: CodeDisplay = { code: 'test', display: 'Test pathogen', designations: [] };
    const subPathogen: CodeDisplay = { code: 'species', display: 'Test species', designations: [] };
    const data: PathogenData = { codeDisplay: pathogen, header: 'Test', answerSet: [subPathogen], materials: [], methods: [] };
    const updatedPathogen: CodeDisplay = { code: 'updated', display: 'Updated pathogen', designations: [] };
    const notificationService = {
      notificationType: NotificationType.NominalNotification7_1,
      pathogenCodeDisplays: [pathogen],
      pathogenData: undefined as PathogenData | undefined,
      notificationCategoryGroup: new FormGroup({
        federalStateCodeDisplay: new FormControl('DE-BW'),
        pathogenDisplay: new FormControl(''),
        pathogen: new FormControl('Previous species'),
      }),
      notificationCategoryModel: signal({ federalStateCodeDisplay: 'DE-BW', pathogenDisplay: '', pathogen: undefined }),
      pathogenDTOGroup: new FormGroup({ specimen: new FormControl('Previous diagnostic') }),
      pathogenModel: signal({ specimen: 'Previous diagnostic' }),
      notificationCategoryFields: signal<FormlyFieldConfig[]>([
        {
          fieldGroup: [
            { key: 'favoritePathogen', type: 'demis-favorites-list', props: { notificationType: NotificationType.NominalNotification7_1 } },
            { key: 'federalStateCodeDisplay', type: 'selection-test' },
            { key: 'pathogenDisplay', type: 'selection-test', props: {} },
            {
              key: 'pathogen',
              type: 'filterable-select',
              props: { required: true, optionValueKey: 'code', optionLabelKey: 'display' },
            },
          ],
        },
      ]),
      setPathogenData: vi.fn(),
    };
    const storage = {
      favoritesChanged: new Subject<void>(),
      getFavorites: vi.fn().mockReturnValue([pathogen]),
      getFederalStateCode: vi.fn().mockReturnValue('DE-BW'),
      getSelectedPathogenCodeDisplay: vi.fn().mockReturnValue(undefined),
      setSelectedPathogenCodeDisplay: vi.fn(),
      removeSelectedPathogenCodeDisplay: vi.fn(),
      setFederalStateCode: vi.fn(),
    };
    storage.setFederalStateCode.mockImplementation(code => storage.getFederalStateCode.mockReturnValue(code));
    const fhir = {
      fetchDiagnosticsBasedOnPathogenSelection: vi.fn().mockReturnValue(of(data)),
      fetchPathogenCodeDisplaysByTypeAndState: vi.fn().mockReturnValue(of([updatedPathogen])),
    };

    await TestBed.configureTestingModule({
      imports: [
        NotificationCategoryComponent,
        FormlyModule.forRoot({
          types: [
            { name: 'demis-favorites-list', component: FavoritesListComponent },
            { name: 'selection-test', component: SelectionTestField },
            { name: 'filterable-select', component: FormlyFilterableSelectComponent },
          ],
        }),
      ],
      providers: [
        { provide: PathogenNotificationService, useValue: notificationService },
        { provide: PathogenNotificationStorageService, useValue: storage },
        { provide: FhirPathogenNotificationService, useValue: fhir },
        { provide: StepNavigation, useValue: {} },
        { provide: MessageDialogService, useValue: {} },
        { provide: NGXLogger, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NotificationCategoryComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.debugElement.query(By.directive(FavoritesListComponent))).toBeTruthy();

    fixture.nativeElement.querySelector('.favorites-button').click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(notificationService.notificationCategoryGroup.get('pathogenDisplay').value).toBe(formatCodeDisplayToDisplay(pathogen));
    expect(notificationService.notificationCategoryGroup.get('pathogen').value).toEqual(formatCodeDisplayToDesignationOption(subPathogen));
    expect(notificationService.notificationCategoryGroup.touched).toBe(true);
    expect(notificationService.notificationCategoryModel()).toEqual({
      federalStateCodeDisplay: 'DE-BW',
      pathogenDisplay: 'Test pathogen',
      pathogen: formatCodeDisplayToDesignationOption(subPathogen),
    });
    expect(notificationService.pathogenDTOGroup.get('specimen').value).toBeNull();
    expect(notificationService.pathogenModel()).toEqual({});
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith('test', NotificationType.NominalNotification7_1);
    expect(notificationService.setPathogenData).toHaveBeenCalledWith(data);
    expect(storage.setSelectedPathogenCodeDisplay).toHaveBeenCalledWith(pathogen);
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(pathogen);
    fixture.nativeElement.querySelector('.favorites-button').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fhir.fetchDiagnosticsBasedOnPathogenSelection).toHaveBeenCalledExactlyOnceWith('test', NotificationType.NominalNotification7_1);
    expect(notificationService.setPathogenData).toHaveBeenCalledExactlyOnceWith(data);
    notificationService.pathogenData = data;

    notificationService.pathogenDTOGroup.get('specimen').setValue('Diagnostic content');
    notificationService.pathogenModel.set({ specimen: 'Diagnostic content' });
    notificationService.notificationCategoryGroup.get('pathogen').setValue('species');
    expect(notificationService.pathogenDTOGroup.get('specimen').value).toBe('Diagnostic content');
    expect(notificationService.pathogenModel()).toEqual({ specimen: 'Diagnostic content' });

    notificationService.notificationCategoryGroup.get('federalStateCodeDisplay').setValue('DE-BE');

    expect(storage.setFederalStateCode).toHaveBeenCalledWith('DE-BE');
    expect(storage.removeSelectedPathogenCodeDisplay).toHaveBeenCalled();
    expect(fhir.fetchPathogenCodeDisplaysByTypeAndState).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, 'DE-BE');
    expect(notificationService.notificationCategoryGroup.get('federalStateCodeDisplay').value).toBe('DE-BE');
    expect(notificationService.notificationCategoryGroup.get('pathogenDisplay').value).toBe('');
    expect(notificationService.pathogenModel()).toEqual({});
    expect(notificationService.pathogenCodeDisplays).toEqual([updatedPathogen]);
    fixture.destroy();

    const reopenedFixture = TestBed.createComponent(NotificationCategoryComponent);
    reopenedFixture.detectChanges();
    await reopenedFixture.whenStable();

    const selectionFields = reopenedFixture.debugElement
      .queryAll(By.directive(SelectionTestField))
      .map(element => (element.componentInstance as SelectionTestField).field);
    const pathogenField = selectionFields.find(field => field.key === 'pathogenDisplay');
    expect(await firstValueFrom(pathogenField.props.filter(''))).toEqual(['Updated pathogen']);

    const subPathogenField = (
      reopenedFixture.debugElement.query(By.directive(FormlyFilterableSelectComponent)).componentInstance as FormlyFilterableSelectComponent
    ).field;
    expect(subPathogenField.props.options).toEqual(data.answerSet.map(formatCodeDisplayToDesignationOption));
    reopenedFixture.destroy();
  });
});
