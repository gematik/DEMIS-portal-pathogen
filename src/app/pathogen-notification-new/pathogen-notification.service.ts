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

import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormBuilder } from '@ngx-formly/core';
import {
  customCodeDisplay,
  DeepMergeService,
  FollowUpMixedCodesService,
  FollowUpNotificationIdService,
  FormlyConstants,
  selectOption,
} from '@gematik/demis-portal-core-library';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { allowedRoutes, NotificationType } from '../pathogen-notification/common/routing-helper';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { notifierFacilityFormConfigFieldsFullNew } from '../pathogen-notification/legacy/formly/configs/reusable/notifier-facility.config';
import {
  DeepPartial,
  NotificationCategoryFormModel,
  NotifiedPersonFormModel,
  NotifierFacilityFormModel,
  PathogenFormModel,
  SubmittingFacilityFormModel,
} from '../pathogen-notification/legacy/models/pathogen-form-model';
import { AddressType, CodeDisplay, NotifiedPersonAnonymous, PathogenData, PathogenDTO } from '../../api/notification';
import { ErrorDialogService } from '../pathogen-notification/services/error-dialog.service';
import { submittingFacilityFields } from '../pathogen-notification/formly/configs/pathogen/submitting-facility.config';
import { findFieldByKey } from '../pathogen-notification/legacy/formly/configs/reusable/commons';
import { distinctUntilChanged, filter, forkJoin, of, Subject, take, takeUntil } from 'rxjs';
import { cloneDeep, isEqual, merge, mergeWith } from 'lodash-es';
import { catchError } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import {
  findCodeDisplayByCodeValue,
  findCodeDisplayByDisplayValue,
  formatCodeDisplayToDesignationOption,
  formatCodeDisplayToDisplay,
  getDesignationValueIfAvailable,
  getSelectOptionValue,
  GERMANY_COUNTRY_CODE,
  mapCodeDisplaysToOptionList,
} from '../pathogen-notification/legacy/common-utils';
import { GENDER_OPTION_LIST, SALUTATION_OPTION_LIST } from '../pathogen-notification/legacy/formly-options-lists';
import {
  initializeNotifiedPersonFields,
  initializeSelectPathogenFields,
  isFilterablePathogenEnabled,
  isFollowUpNotification,
} from '../pathogen-notification/utils/pathogen-notification-mapper';
import { pathogenSpecimenFields } from '../pathogen-notification/formly/configs/pathogen/pathogen-specimen.config';
import { transformPathogenFormToPathogenTest } from '../pathogen-notification/utils/data-transformation';
import { environment } from '../../environments/environment';

export interface PathogenReferenceData {
  pathogen: CodeDisplay;
  diagnostics: PathogenData;
  pathogens: CodeDisplay[];
}

@Injectable({
  providedIn: 'root',
})
export class PathogenNotificationService {
  private readonly fhirPathogenNotificationService = inject(FhirPathogenNotificationService);
  private readonly formlyBuilder = inject(FormlyFormBuilder);
  private readonly notificationStorageService = inject(PathogenNotificationStorageService);
  private readonly followUpNotificationIdService = inject(FollowUpNotificationIdService);
  private readonly followUpMixedCodesService = inject(FollowUpMixedCodesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deepMergeService = inject(DeepMergeService);

  /**
   * FormGroups and models for each step.
   * The models are implemented as Signals for reactive updates.
   * The models are used by Formly to initialize the FormControls.
   */
  notifierFacilityModel = signal<NotifierFacilityFormModel>({});
  notifiedPersonModel = signal<NotifiedPersonFormModel | DeepPartial<NotifiedPersonAnonymous>>({});
  submittingFacilityModel = signal<SubmittingFacilityFormModel>({});
  pathogenModel = signal<DeepPartial<PathogenDTO>>({});
  notificationCategoryModel = signal<NotificationCategoryFormModel>({});

  notifierFacilityGroup = new FormGroup({});
  notifiedPersonGroup = new FormGroup({});
  submittingFacilityGroup = new FormGroup({});
  pathogenDTOGroup = new FormGroup({});
  notificationCategoryGroup = new FormGroup({});
  pathogenData: PathogenData;
  readonly formsInitialized = signal(false);
  private readonly initializationCancelled = new Subject<void>();
  readonly initializationCancelled$ = this.initializationCancelled.asObservable();

  constructor() {
    this.notifierFacilityGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.handleNotifierFacilityChange());
    this.submittingFacilityGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateCurrentAddressFromSubmittingFacility());
    this.notifiedPersonGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.updateCurrentAddressFromSubmittingFacility());
    this.pathogenDTOGroup.disable();
  }

  sendData() {
    if (!this.isFormValid()) {
      this.errorDialogService.showBasicClosableErrorDialog(
        'Bitte füllen Sie zunächst alle Pflichtfelder der Meldung vollständig und korrekt aus.',
        'Meldung unvollständig'
      );
      return;
    }
    const model = this.getModelData();
    const transformedData = transformPathogenFormToPathogenTest(
      model,
      this.notificationType,
      this.getSelectedPathogenCodeDisplayFromStorage(),
      this.pathogenData
    );
    this.fhirPathogenNotificationService.submitNotification(transformedData, this.notificationType);
  }

  getSelectedPathogenCodeDisplayFromStorage = () => {
    return this.notificationStorageService.getSelectedPathogenCodeDisplay();
  };

  /**
   * Returns the current form data as a plain JavaScript object.
   * Uses FormGroup values, which omit disabled controls in enabled groups.
   */
  getFormData(): PathogenFormModel {
    return {
      notifierFacility: this.notifierFacilityGroup.value,
      notifiedPerson: this.notifiedPersonGroup.value,
      submittingFacility: this.submittingFacilityGroup.value,
      notificationCategory: this.notificationCategoryGroup.value,
      pathogenDTO: this.pathogenDTOGroup.value,
    };
  }

  /**
   * Returns the current model data as a plain JavaScript object.
   * Uses the Signal values (Models).
   */
  getModelData() {
    return {
      notifierFacility: this.notifierFacilityModel(),
      notifiedPerson: this.notifiedPersonModel(),
      submittingFacility: this.submittingFacilityModel(),
      notificationCategory: this.notificationCategoryModel(),
      pathogenDTO: this.pathogenModel(),
    };
  }

  /**
   * Requires initialized step forms and loaded diagnostics before checking all
   * groups, including steps that have not been rendered yet.
   */
  isFormValid(): boolean {
    return this.formsInitialized() && !!this.pathogenData && !!this.getSelectedPathogenCodeDisplayFromStorage() && this.formGroups.every(group => group.valid);
  }

  /**
   * Clears the touched state of all FormGroups. Should be called when the
   * entire wizard route is entered so a fresh visit does not carry over
   * validation state from a previous run within the same session.
   */
  resetVisitedFlags(): void {
    this.formGroups.forEach(group => group.markAsUntouched());
  }

  readonly diagnosticFormFields = signal<FormlyFieldConfig[]>([
    {
      className: FormlyConstants.LAYOUT_HEADER,
      template: '<h1>Bitte zuerst den Meldetatbestand auswählen!</h1>',
    },
  ]);

  setPathogenData(data: PathogenData): void {
    this.pathogenData = data;
    // TODO can be simplified to formatCodeDisplayToDesignationOption with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
    const toOptions = (codeDisplays: CodeDisplay[] = []) =>
      isFilterablePathogenEnabled() ? codeDisplays.map(formatCodeDisplayToDesignationOption) : codeDisplays.map(formatCodeDisplayToDisplay);
    const fields = pathogenSpecimenFields(
      this.notificationType,
      toOptions(data.materials),
      toOptions(data.methods),
      toOptions(data.resistanceGenes),
      toOptions(data.resistances),
      (data.substances ?? []).map(formatCodeDisplayToDesignationOption),
      data.header,
      data.subheader ?? ''
    );
    this.formlyBuilder.buildForm(this.pathogenDTOGroup, fields, this.pathogenModel(), {});
    this.pathogenDTOGroup.enable({ emitEvent: false });
    this.diagnosticFormFields.set(fields);
  }

  private readonly errorDialogService = inject(ErrorDialogService);

  readonly notifierFacilityFields = signal<FormlyFieldConfig[]>([]);
  readonly submitterFacilityFields = signal<FormlyFieldConfig[]>([]);
  readonly notifiedPersonFields = signal<FormlyFieldConfig[]>([]);
  readonly notificationCategoryFields = signal<FormlyFieldConfig[]>([]);

  federalStateCodeDisplays: CodeDisplay[] = [];
  pathogenCodeDisplays: CodeDisplay[] = [];
  countryCodeDisplays: CodeDisplay[] = [];
  notificationType = NotificationType.NominalNotification7_1;
  private readonly defaultFederalStateCode = 'DE-BW';
  private readonly defaultFederalState = { code: 'DE-BW', display: 'Baden-Württemberg' };
  private readonly logger = inject(NGXLogger);
  private currentAddressCopiedFromSubmittingFacility = false;
  private isResettingCopyCheckbox = false;

  /**
   * Validates the notifier before enabling copying, or resets the submitting
   * facility when the copy checkbox is cleared.
   */
  handleSubmittingFacilityCopyAddressChange(field: FormlyFieldConfig): void {
    // Formly emits another change when rejected copying resets the checkbox.
    if (this.isResettingCopyCheckbox) {
      this.isResettingCopyCheckbox = false;
      return;
    }

    if (!field.formControl.value) {
      this.resetSubmittingFacility();
      return;
    }

    if (this.notifierFacilityGroup.invalid) {
      this.isResettingCopyCheckbox = true;
      field.formControl.setValue(false, { emitEvent: false });
      this.submittingFacilityModel.update(model => ({ ...model, copyAddressCheckBox: false }));
      this.errorDialogService.showBasicClosableErrorDialog(
        'Bitte geben Sie die Daten für die Meldende Person zunächst vollständig an.',
        'Fehler bei der Auswahl der Adresse'
      );
      return;
    }

    this.submittingFacilityModel.update(model => ({ ...model, copyAddressCheckBox: true }));
    this.handleNotifierFacilityChange();
  }

  /**
   * Persists current notifier data after initialization, regardless of copying.
   * Copies all shared facility and contact data while the copy checkbox is selected,
   * preserving the submitting facility's department name.
   * Updates both the model and existing controls so synchronization also works
   * when the target step is not rendered.
   */
  handleNotifierFacilityChange(): void {
    const source = this.getCurrentStepModel(this.notifierFacilityModel(), this.notifierFacilityGroup);
    if (this.formsInitialized()) {
      this.notificationStorageService.setNotifierFacilityModel(source);
    }
    if (!this.submittingFacilityModel().copyAddressCheckBox) return;

    const submittingFacility = this.getCurrentStepModel(this.submittingFacilityModel(), this.submittingFacilityGroup);
    const target: SubmittingFacilityFormModel = {
      ...submittingFacility,
      facilityInfo: { ...submittingFacility.facilityInfo, ...source.facilityInfo },
      address: source.address,
      contact: source.contact,
      contacts: source.contacts,
    };
    this.submittingFacilityModel.set(target);
    const group: FormGroup = this.submittingFacilityGroup;
    group.patchValue(target, { emitEvent: false });
    this.updateCurrentAddressFromSubmittingFacility();
  }

  /**
   * Synchronizes only the current address and institution name when the submitting
   * facility is selected as the notified person's current location.
   * Creates a separate address object; its primitive fields need no deep clone.
   * Clears the copied address once when leaving that address type, preserving
   * subsequent manual input. Suppresses control events to avoid feedback loops.
   */
  updateCurrentAddressFromSubmittingFacility(): void {
    const person: NotifiedPersonFormModel = this.getCurrentStepModel(this.notifiedPersonModel(), this.notifiedPersonGroup);
    if (person.currentAddressType !== AddressType.SubmittingFacility) {
      if (this.currentAddressCopiedFromSubmittingFacility) {
        this.currentAddressCopiedFromSubmittingFacility = false;
        const currentAddress = { country: this.toCountryFormValue(GERMANY_COUNTRY_CODE) };
        this.notifiedPersonGroup.get('currentAddress')?.reset(currentAddress, { emitEvent: false });
        this.notifiedPersonModel.set({ ...person, currentAddress });
      }
      return;
    }
    this.currentAddressCopiedFromSubmittingFacility = true;

    const facility = this.getCurrentStepModel(this.submittingFacilityModel(), this.submittingFacilityGroup);
    const currentAddress = { ...facility.address, additionalInfo: facility.facilityInfo?.institutionName };
    if (!isEqual(person.currentAddress, currentAddress)) {
      this.notifiedPersonModel.set({ ...person, currentAddress });
    }
    const group: FormGroup = this.notifiedPersonGroup;
    group.patchValue({ currentAddress }, { emitEvent: false });
  }

  /**
   * Cancels any previous initialization and builds the steps for the requested
   * notification type after their reference data has loaded.
   * Restores saved notifier data before building the forms.
   * Opens the follow-up dialog with all pathogen codes for follow-up notifications.
   */
  initialize(notificationType: NotificationType): void {
    this.initializationCancelled.next();
    this.formsInitialized.set(false);
    this.pathogenData = undefined;
    this.notificationType = notificationType;
    this.notificationStorageService.removeSelectedPathogenCodeDisplay();
    const selectedFederalStateCode = this.getStoredFederalStateCode();
    this.storeFederalState(selectedFederalStateCode);
    this.notificationCategoryModel.update(model => ({ ...model, federalState: this.toFederalStateFormValue(selectedFederalStateCode) }));
    let initializationFailed = false;
    forkJoin([
      this.fhirPathogenNotificationService.fetchCountryCodeDisplays(),
      this.fhirPathogenNotificationService.fetchFederalStateCodeDisplays(this.notificationType),
      this.fhirPathogenNotificationService.fetchPathogenCodeDisplaysByTypeAndState(this.notificationType, selectedFederalStateCode),
    ])
      .pipe(
        take(1),
        takeUntil(this.initializationCancelled),
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          initializationFailed = true;
          this.logger.error(error);
          return of([[], [], []]);
        })
      )
      .subscribe(([countryCodeDisplays, federalStateCodeDisplays, pathogenCodeDisplays]) => {
        this.federalStateCodeDisplays = federalStateCodeDisplays;
        this.countryCodeDisplays = countryCodeDisplays;
        this.pathogenCodeDisplays = pathogenCodeDisplays;
        const notifierFacility = this.toStoredNotifierFacilityFormValue(this.notificationStorageService.getNotifierFacilityModel());
        if (notifierFacility) {
          this.notifierFacilityModel.set(notifierFacility);
          this.notifierFacilityGroup.reset(notifierFacility, { emitEvent: false });
        }
        this.configureStepFields();
        this.buildStepForms();
        this.formsInitialized.set(!initializationFailed);
        if (!initializationFailed) {
          this.initializeFollowUpDialog();
        }
      });
  }

  cancelPendingInitialization(): void {
    this.initializationCancelled.next();
    this.followUpNotificationIdService.resetState();
  }

  private initializeFollowUpDialog(): void {
    const nominal = this.notificationType === NotificationType.FollowUpNotification7_1;
    if (!nominal && this.notificationType !== NotificationType.FollowUpNotification7_3) return;

    this.fhirPathogenNotificationService
      .fetchAllPathogenCodeDisplays(nominal ? '7.1' : '7.3')
      .pipe(take(1), takeUntil(this.initializationCancelled), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pathogenCodeDisplays: CodeDisplay[]) => {
          this.pathogenCodeDisplays = pathogenCodeDisplays;
          this.handleFollowUpNotification();
          this.followUpNotificationIdService.openDialog({
            dialogData: {
              routerLink: '/' + (nominal ? allowedRoutes.nominal : allowedRoutes.nonNominal),
              linkTextContent: nominal
                ? 'eines namentlichen Erregernachweises nach § 7 Abs. 1 IfSG'
                : 'eines nichtnamentlichen Erregernachweises nach § 7 Abs. 3 IfSG',
              pathToDestinationLookup: environment.pathToDestinationLookup,
            },
          });
        },
        error: error => this.logger.error(error),
      });
  }

  private handleFollowUpNotification(): void {
    if (!isFollowUpNotification(this.notificationType)) return;

    this.followUpNotificationIdService.hasValidNotificationId$
      .pipe(
        takeUntil(this.initializationCancelled),
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter(hasValid => hasValid === true)
      )
      .subscribe(() => {
        const code = this.followUpNotificationIdService.followUpNotificationCategory();
        if (!code) {
          this.logger.error('A valid follow-up notification ID has no notification category.');
          return;
        }

        this.fhirPathogenNotificationService
          .fetchFollowUpCode(code, this.notificationType)
          .pipe(take(1), takeUntil(this.initializationCancelled), takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: response => this.handleFollowUpCodes(response),
            error: error => this.logger.error(error),
          });
      });
  }

  private handleFollowUpCodes(response: CodeDisplay[]): void {
    if (response.length > 1) {
      const customCodeDisplays: customCodeDisplay[] = response.map(codeDisplay => ({
        code: codeDisplay.code,
        display: getDesignationValueIfAvailable(codeDisplay),
      }));
      this.followUpNotificationIdService.closeDialog();
      this.followUpMixedCodesService
        .openDialog(customCodeDisplays)
        .pipe(take(1), takeUntil(this.initializationCancelled), takeUntilDestroyed(this.destroyRef))
        .subscribe(selectedCode => {
          if (selectedCode) this.selectFollowUpPathogen(selectedCode);
        });
    } else if (response.length === 1) {
      this.selectFollowUpPathogen(response[0].code);
    }

    this.notifiedPersonGroup.markAsTouched();
    this.focusFirstStepHeader();
  }

  private selectFollowUpPathogen(code: string): void {
    const pathogen = findCodeDisplayByCodeValue(this.pathogenCodeDisplays, code);
    if (!pathogen) {
      this.logger.error(`Follow-up pathogen code "${code}" is missing from the loaded pathogen code displays.`);
      return;
    }

    const federalState = this.toFederalStateFormValue(this.getStoredFederalStateCode());
    const notificationCategory = {
      ...this.notificationCategoryModel(),
      federalState,
      notifiablePathogen: this.toPathogenFormValue(pathogen),
      pathogen: undefined,
      initialNotificationId: this.followUpNotificationIdService.validatedNotificationId(),
    };
    this.notificationCategoryModel.set(notificationCategory);
    this.notificationCategoryGroup.reset(notificationCategory, { emitEvent: false });
    this.pathogenData = undefined;
    this.pathogenModel.set({});
    this.pathogenDTOGroup.reset({}, { emitEvent: false });

    this.fhirPathogenNotificationService
      .fetchDiagnosticsBasedOnPathogenSelection(pathogen.code, this.notificationType)
      .pipe(
        take(1),
        takeUntil(this.initializationCancelled),
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.logger.error(error);
          this.notificationStorageService.removeSelectedPathogenCodeDisplay();
          const resetCategory = { ...notificationCategory, notifiablePathogen: this.toPathogenFormValue(undefined), pathogen: undefined };
          this.notificationCategoryModel.set(resetCategory);
          this.notificationCategoryGroup.reset(resetCategory, { emitEvent: false });
          return of(undefined);
        })
      )
      .subscribe(data => {
        if (!data) return;
        this.notificationStorageService.setSelectedPathogenCodeDisplay(pathogen);
        this.setPathogenData(data);
        this.pathogenDTOGroup.enable({ emitEvent: false });
      });
  }

  private focusFirstStepHeader(): void {
    setTimeout(() => {
      const firstStepHeader = document.querySelector<HTMLElement>('[aria-label*="Meldende Person"], #notifier-facility-headline');
      firstStepHeader?.focus();
      firstStepHeader?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  }

  /**
   * Creates the person fields and validates address reuse on user selection,
   * without showing selection errors during programmatic synchronization.
   */
  getNotifiedPersonFields(notificationType: NotificationType): FormlyFieldConfig[] {
    const fields = initializeNotifiedPersonFields(notificationType, this.countryCodeDisplays);
    const addressType = findFieldByKey(fields, 'currentAddressType');
    if (addressType) {
      addressType.props = {
        ...addressType.props,
        // Material must finish updating the radio before a rejected selection is reset.
        change: field => setTimeout(() => this.validateCurrentAddressSelection(field)),
      };
    }
    return fields;
  }

  /** Clears diagnostics and species that belong to a previous selection. */
  resetPathogenDiagnostics(): void {
    this.pathogenData = undefined;
    this.pathogenModel.set({});
    this.pathogenDTOGroup.reset({}, { emitEvent: false });
    this.notificationCategoryModel.update(category => ({ ...category, pathogen: undefined }));
    this.notificationCategoryGroup.get('pathogen')?.reset(undefined, { emitEvent: false });
  }

  /** Stores reference data and rebuilds diagnostics only when the selection or data changed. */
  applyPathogenReferenceData(referenceData: PathogenReferenceData, federalStateCode: string): void {
    const changed = this.getSelectedPathogenCodeDisplayFromStorage()?.code !== referenceData.pathogen.code;
    if (changed) this.resetPathogenDiagnostics();
    this.pathogenCodeDisplays = referenceData.pathogens;
    this.storeFederalState(federalStateCode);
    this.notificationStorageService.setSelectedPathogenCodeDisplay(referenceData.pathogen);
    if (changed || this.pathogenData !== referenceData.diagnostics) this.setPathogenData(referenceData.diagnostics);
  }

  // TODO can be simplified to only read the CodeDisplay storage entry with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
  getStoredFederalStateCode(): string {
    const code = isFilterablePathogenEnabled()
      ? this.notificationStorageService.getFederalState()?.code
      : this.notificationStorageService.getFederalStateCode();
    return code || this.defaultFederalStateCode;
  }

  /** Persists the federal state in the storage entry matching the active federal state field type. */
  // TODO can be replaced with a direct setFederalState call with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
  storeFederalState(federalStateCode: string): void {
    if (isFilterablePathogenEnabled()) {
      this.notificationStorageService.setFederalState(this.findFederalStateCodeDisplay(federalStateCode));
    } else {
      this.notificationStorageService.setFederalStateCode(federalStateCode);
    }
  }

  /** The filterable select needs the CodeDisplay object as form value, the legacy select only the code. */
  // TODO can be replaced with findFederalStateCodeDisplay with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
  toFederalStateFormValue(federalState: CodeDisplay | string | undefined): CodeDisplay | string {
    const code = (typeof federalState === 'string' ? federalState : federalState?.code) || this.defaultFederalStateCode;
    return isFilterablePathogenEnabled() ? this.findFederalStateCodeDisplay(code) : code;
  }

  private findFederalStateCodeDisplay(code: string): CodeDisplay {
    const storedFederalState = this.notificationStorageService.getFederalState();
    return (
      findCodeDisplayByCodeValue(this.federalStateCodeDisplays, code) ??
      (storedFederalState?.code === code ? storedFederalState : undefined) ??
      (code === this.defaultFederalState.code ? this.defaultFederalState : { code, display: code })
    );
  }

  // TODO can be simplified to only return the codeDisplay option with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
  toPathogenFormValue(pathogen: CodeDisplay | undefined): CodeDisplay | string | undefined {
    if (isFilterablePathogenEnabled()) {
      return pathogen ? formatCodeDisplayToDesignationOption(pathogen) : undefined;
    }
    return pathogen ? formatCodeDisplayToDisplay(pathogen) : '';
  }

  /** The filterable select needs the country option as form value, the legacy select only the code. */
  // TODO can be simplified to only return the country option with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
  private toCountryFormValue(code: string): any {
    return isFilterablePathogenEnabled() ? toSelectOption(code, mapCodeDisplaysToOptionList(this.countryCodeDisplays)) : code;
  }

  /** Stored notifier data may originate from the other select type, so it is converted to the active one. */
  // TODO can be simplified to toFilterableSelectFormModel with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN
  private toStoredNotifierFacilityFormValue(notifierFacility: NotifierFacilityFormModel | undefined): NotifierFacilityFormModel | undefined {
    if (!notifierFacility) return notifierFacility;
    if (isFilterablePathogenEnabled()) return this.toFilterableSelectFormModel({ notifierFacility, pathogenDTO: undefined }).notifierFacility;
    const result: any = cloneDeep(notifierFacility);
    updateKey(result.address, 'country', getSelectOptionValue);
    updateKey(result.contact, 'salutation', getSelectOptionValue);
    return result;
  }

  /**
   * Imported data (clipboard, dummy data, local storage) contains option values (codes) and diagnostic displays,
   * the filterable selects need the matching options as form values.
   */
  // TODO can be removed with removal of FEATURE_FLAG_FILTERABLE_PATHOGEN once all sources provide options
  private toFilterableSelectFormModel(data: PathogenFormModel): PathogenFormModel {
    const result: any = cloneDeep(data);
    const countryOptions = mapCodeDisplaysToOptionList(this.countryCodeDisplays);
    const toCountry = (value: any) => toSelectOption(value, countryOptions);
    for (const facility of [result.notifierFacility, result.submittingFacility]) {
      updateKey(facility?.address, 'country', toCountry);
      updateKey(facility?.contact, 'salutation', value => toSelectOption(value, SALUTATION_OPTION_LIST));
    }
    updateKey(result.notifiedPerson?.info, 'gender', value => toSelectOption(value, GENDER_OPTION_LIST));
    updateKey(result.notifiedPerson?.residenceAddress, 'country', toCountry);
    updateKey(result.notifiedPerson?.currentAddress, 'country', toCountry);

    const diagnostics = this.pathogenData;
    if (diagnostics) {
      const toDiagnostic =
        (codeDisplays: CodeDisplay[] = []) =>
        (value: any) => {
          if (typeof value !== 'string') return value;
          const codeDisplay = findCodeDisplayByDisplayValue(codeDisplays, value);
          return codeDisplay ? formatCodeDisplayToDesignationOption(codeDisplay) : undefined;
        };
      result.pathogenDTO?.specimenList?.forEach(({ specimenDTO }: any) => {
        updateKey(specimenDTO, 'material', toDiagnostic(diagnostics.materials));
        specimenDTO?.methodPathogenList?.forEach((item: any) => updateKey(item, 'method', toDiagnostic(diagnostics.methods)));
        specimenDTO?.resistanceList?.forEach((item: any) => updateKey(item, 'resistance', toDiagnostic(diagnostics.resistances)));
        specimenDTO?.resistanceGeneList?.forEach((item: any) => updateKey(item, 'resistanceGene', toDiagnostic(diagnostics.resistanceGenes)));
      });
    }
    return result;
  }

  /** Applies imported form values while keeping address reuse and selection options synchronized. */
  applyPrefillData(data: PathogenFormModel, options: { mergeArrays?: boolean } = {}): void {
    if (isFilterablePathogenEnabled()) {
      data = this.toFilterableSelectFormModel(data);
    }
    if (data.notificationCategory?.federalState) {
      data = {
        ...data,
        notificationCategory: {
          ...data.notificationCategory,
          federalState: this.toFederalStateFormValue(data.notificationCategory.federalState),
        },
      };
    }
    if (isFilterablePathogenEnabled() && typeof data.notificationCategory?.notifiablePathogen === 'string') {
      const pathogen = findCodeDisplayByDisplayValue(this.pathogenCodeDisplays, data.notificationCategory.notifiablePathogen);
      data = { ...data, notificationCategory: { ...data.notificationCategory, notifiablePathogen: this.toPathogenFormValue(pathogen) } };
    }
    const currentAddressType = data.notifiedPerson && 'currentAddressType' in data.notifiedPerson ? data.notifiedPerson.currentAddressType : undefined;
    const person: NotifiedPersonFormModel = this.getCurrentStepModel(this.notifiedPersonModel(), this.notifiedPersonGroup);
    if (currentAddressType && currentAddressType !== person.currentAddressType) {
      this.currentAddressCopiedFromSubmittingFacility = false;
      this.notifiedPersonModel.set({ ...person, currentAddress: {} });
      this.notifiedPersonGroup.get('currentAddress')?.reset({}, { emitEvent: false });
    }
    this.patchFormData(data, { ...options, emitEvent: false });
    if (currentAddressType === AddressType.SubmittingFacility) {
      this.validateCurrentAddressSelection(findFieldByKey(this.notifiedPersonFields(), 'currentAddressType'));
    }
    this.updateCurrentAddressFromSubmittingFacility();
    if (data.notificationCategory) this.notificationCategoryFields.set([...this.notificationCategoryFields()]);
  }

  /** Merges programmatic form data and updates the models, controls and validation. */
  patchFormData(data: PathogenFormModel, options: { markAsTouched?: boolean; emitEvent?: boolean; mergeArrays?: boolean } = {}): void {
    const { markAsTouched = true, emitEvent = true, mergeArrays = false } = options;
    const stepMappings = [
      { key: 'notifierFacility' as const, model: this.notifierFacilityModel, group: this.notifierFacilityGroup, fields: this.notifierFacilityFields },
      { key: 'submittingFacility' as const, model: this.submittingFacilityModel, group: this.submittingFacilityGroup, fields: this.submitterFacilityFields },
      { key: 'notifiedPerson' as const, model: this.notifiedPersonModel, group: this.notifiedPersonGroup, fields: this.notifiedPersonFields },
      {
        key: 'notificationCategory' as const,
        model: this.notificationCategoryModel,
        group: this.notificationCategoryGroup,
        fields: this.notificationCategoryFields,
      },
      { key: 'pathogenDTO' as const, model: this.pathogenModel, group: this.pathogenDTOGroup, fields: this.diagnosticFormFields },
    ];

    stepMappings.forEach(({ key, model, group, fields }) => {
      if (!data[key]) return;

      const currentData = this.getCurrentStepModel(model(), group);
      // Partial clipboard imports must preserve unmentioned fields and entries in repeat sections.
      const mergedData = mergeArrays ? merge({}, currentData, data[key]) : this.deepMergeService.deepMerge(currentData, data[key]);

      model.set(mergedData);
      // Formly creates missing repeat controls; patchValue alone cannot grow FormArrays.
      this.formlyBuilder.buildForm(group, fields(), mergedData, {});
      group.patchValue(mergedData, { emitEvent });
      this.syncFormArrayLengths(group, mergedData, emitEvent);
      this.updateStepValidation(group, markAsTouched);
    });
  }

  /**
   * `FormGroup.patchValue` never adds or removes entries from a `FormArray`.
   * When merged data contains a shorter array than the current control
   * (typically because Formly seeded it with a `defaultValue: [{}]` empty
   * placeholder), the excess controls stay behind with their required inner
   * validators and keep the FormGroup invalid. This walks the control tree
   * and truncates each FormArray to match the merged data length.
   */
  private syncFormArrayLengths(control: AbstractControl, data: unknown, emitEvent: boolean): void {
    if (control instanceof FormArray) {
      const dataArray = Array.isArray(data) ? data : [];
      while (control.length > dataArray.length) {
        control.removeAt(control.length - 1, { emitEvent });
      }
      control.controls.forEach((child, index) => this.syncFormArrayLengths(child, dataArray[index], emitEvent));
      return;
    }
    if (control instanceof FormGroup) {
      const dataObject = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      Object.keys(control.controls).forEach(key => this.syncFormArrayLengths(control.controls[key], dataObject[key], emitEvent));
    }
  }

  /**
   * Helper method to trigger validation updates and statusChanges emission.
   *
   * When `markAsTouched` is false the FormGroup is explicitly reset to
   * `untouched`. `patchValue`, `FormArray.removeAt` and the FormlyForm's
   * initial rendering can otherwise leave residual touched state behind
   * (e.g. from a previous visit whose leaving triggered `markAllAsTouched`
   * in the process stepper). Untouching here guarantees that after a
   * programmatic prefill the side navigation shows the step number and
   * not a completed/error indicator until the user actually interacts.
   */
  private updateStepValidation(group: FormGroup, markAsTouched: boolean): void {
    if (markAsTouched) {
      group.markAllAsTouched();
    } else {
      group.markAsUntouched();
    }
    group.updateValueAndValidity({ emitEvent: true });
  }

  private get formGroups(): FormGroup[] {
    return [this.notifierFacilityGroup, this.notifiedPersonGroup, this.submittingFacilityGroup, this.notificationCategoryGroup, this.pathogenDTOGroup];
  }

  /**
   * Checks the submitting facility's address and name for SubmittingFacility.
   * Other address types, including PrimaryAsCurrent, are always selectable.
   * Resets invalid selections and shows an error, ignoring unrelated form fields.
   */
  private validateCurrentAddressSelection(field: FormlyFieldConfig): void {
    if (field.formControl.value !== AddressType.SubmittingFacility) return;

    const group = this.submittingFacilityGroup;
    const { address, facilityInfo } = this.getCurrentStepModel(this.submittingFacilityModel(), group);
    const keys = ['street', 'houseNumber', 'zip', 'city', 'country'] as const;
    const addressValid = keys.every(key => {
      const value = key === 'country' ? getSelectOptionValue(address?.country) : address?.[key];
      return typeof value === 'string' && value.trim().length > 0 && !group.get(`address.${key}`)?.invalid;
    });
    const institutionValid = !!facilityInfo?.institutionName?.trim() && !group.get('facilityInfo.institutionName')?.invalid;
    if (addressValid && institutionValid) return;

    field.formControl.reset(null);
    this.updateCurrentAddressFromSubmittingFacility();
    this.errorDialogService.showBasicClosableErrorDialog(
      'Bitte geben Sie zunächst den Namen und die Adresse der Einsendeeinrichtung vollständig und korrekt an.',
      'Fehler bei der Auswahl der Adresse'
    );
  }

  /**
   * Clears copied facility data while preserving the department name and restoring
   * the default country and contact entries. Also clears the submitting-facility
   * selection for the notified person's current location.
   */
  private resetSubmittingFacility(): void {
    const model: SubmittingFacilityFormModel = {
      facilityInfo: { departmentName: this.submittingFacilityModel().facilityInfo?.departmentName },
      address: { country: this.toCountryFormValue(GERMANY_COUNTRY_CODE) },
      contact: {},
      contacts: {
        phoneNumbers: [{ contactType: 'phone', value: '' }],
        emailAddresses: [{ contactType: 'email', value: '' }],
      },
      copyAddressCheckBox: false,
    };
    this.submittingFacilityModel.set(model);
    const group: FormGroup = this.submittingFacilityGroup;
    group.reset(model, { emitEvent: false });
    group.enable({ emitEvent: false });
    const currentAddressType = this.notifiedPersonGroup.get('currentAddressType');
    if (currentAddressType?.value === AddressType.SubmittingFacility) {
      currentAddressType.reset(null, { emitEvent: false });
    }
    const person = this.notifiedPersonModel();
    if ('currentAddressType' in person && person.currentAddressType === AddressType.SubmittingFacility) {
      this.notifiedPersonModel.set({ ...person, currentAddressType: undefined });
    }
  }

  /**
   * Overlays registered control values on the model without losing unrendered
   * nested fields, including values from disabled controls.
   * Returns a deep copy; arrays replace existing entries, including when cleared.
   */
  private getCurrentStepModel<T extends object>(model: T, group: FormGroup): T {
    return mergeWith({}, model, group.getRawValue(), (_previous: unknown, value: unknown) => (Array.isArray(value) ? structuredClone(value) : undefined));
  }

  /**
   * Creates the step configurations and locks copied submitting-facility fields,
   * leaving the department name and copy checkbox editable.
   */
  private configureStepFields(): void {
    this.notifierFacilityFields.set(notifierFacilityFormConfigFieldsFullNew(this.countryCodeDisplays));
    const submitterFields = submittingFacilityFields(this.countryCodeDisplays, this.errorDialogService, field =>
      this.handleSubmittingFacilityCopyAddressChange(field)
    );
    for (const field of submitterFields) {
      if (typeof field.key !== 'string' || field.key === 'copyAddressCheckBox') continue;
      const target = field.key === 'facilityInfo' ? findFieldByKey(field.fieldGroup, 'institutionName') : field;
      target.expressions = { ...target.expressions, 'props.disabled': () => !!this.submittingFacilityModel().copyAddressCheckBox };
    }
    this.submitterFacilityFields.set(submitterFields);
    this.notifiedPersonFields.set(this.getNotifiedPersonFields(this.notificationType));
    this.notificationCategoryFields.set(initializeSelectPathogenFields(this.federalStateCodeDisplays, this.pathogenCodeDisplays, this.notificationType));
  }

  /** Registers validators for all initial steps, including unrendered ones. */
  private buildStepForms(): void {
    this.formlyBuilder.buildForm(this.notifierFacilityGroup, this.notifierFacilityFields(), this.notifierFacilityModel(), {});
    this.formlyBuilder.buildForm(this.submittingFacilityGroup, this.submitterFacilityFields(), this.submittingFacilityModel(), {});
    this.formlyBuilder.buildForm(this.notifiedPersonGroup, this.notifiedPersonFields(), this.notifiedPersonModel(), {});
    this.formlyBuilder.buildForm(this.notificationCategoryGroup, this.notificationCategoryFields(), this.notificationCategoryModel(), {});
  }
}

const updateKey = (object: any, key: string, map: (value: any) => any): void => {
  if (object && key in object) object[key] = map(object[key]);
};

/** Resolves an option value (code) to its option. Unknown values are dropped to keep the field empty. */
const toSelectOption = (value: any, options: selectOption[]): selectOption | undefined =>
  typeof value === 'string' ? options.find(option => option.value === value) : value;
