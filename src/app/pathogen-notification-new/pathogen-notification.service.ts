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
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormBuilder } from '@ngx-formly/core';
import { customCodeDisplay, FollowUpMixedCodesService, FollowUpNotificationIdService, FormlyConstants } from '@gematik/demis-portal-core-library';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { allowedRoutes, NotificationType } from '../pathogen-notification/common/routing-helper';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { notifierFacilityFormConfigFieldsFullNew } from '../pathogen-notification/legacy/formly/configs/reusable/notifier-facility.config';
import {
  DeepPartial,
  NotifiedPersonFormModel,
  NotifierFacilityFormModel,
  PathogenFormModel,
  SubmittingFacilityFormModel,
} from '../pathogen-notification/legacy/models/pathogen-form-model';
import { AddressType, CodeDisplay, NotificationLaboratoryCategory, NotifiedPersonAnonymous, PathogenData, PathogenDTO } from '../../api/notification';
import { ErrorDialogService } from '../pathogen-notification/services/error-dialog.service';
import { submittingFacilityFields } from '../pathogen-notification/formly/configs/pathogen/submitting-facility.config';
import { distinctUntilChanged, filter, forkJoin, of, Subject, take, takeUntil } from 'rxjs';
import { isEqual, mergeWith } from 'lodash-es';
import { catchError } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import {
  findCodeDisplayByCodeValue,
  formatCodeDisplayToDesignationOption,
  formatCodeDisplayToDisplay,
  getDesignationValueIfAvailable,
} from '../pathogen-notification/legacy/common-utils';
import {
  initializeNotifiedPersonFields,
  initializeSelectPathogenFields,
  isFollowUpNotification,
} from '../pathogen-notification/utils/pathogen-notification-mapper';
import { pathogenSpecimenFields } from '../pathogen-notification/formly/configs/pathogen/pathogen-specimen.config';
import { transformPathogenFormToPathogenTest } from '../pathogen-notification/utils/data-transformation';
import { environment } from '../../environments/environment';

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

  /**
   * FormGroups and models for each step.
   * The models are implemented as Signals for reactive updates.
   * The models are used by Formly to initialize the FormControls.
   */
  notifierFacilityModel = signal<NotifierFacilityFormModel>({});
  notifiedPersonModel = signal<NotifiedPersonFormModel | DeepPartial<NotifiedPersonAnonymous>>({});
  submittingFacilityModel = signal<SubmittingFacilityFormModel>({});
  pathogenModel = signal<DeepPartial<PathogenDTO>>({});
  notificationCategoryModel = signal<DeepPartial<NotificationLaboratoryCategory>>({});

  notifierFacilityGroup = new FormGroup({});
  notifiedPersonGroup = new FormGroup({});
  submittingFacilityGroup = new FormGroup({});
  pathogenDTOGroup = new FormGroup({});
  notificationCategoryGroup = new FormGroup({});
  pathogenData: PathogenData;
  readonly formsInitialized = signal(false);
  private readonly initializationCancelled = new Subject<void>();

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
    const fields = pathogenSpecimenFields(
      this.notificationType,
      data.materials.map(formatCodeDisplayToDisplay),
      data.methods.map(formatCodeDisplayToDisplay),
      (data.resistanceGenes ?? []).map(formatCodeDisplayToDisplay),
      (data.resistances ?? []).map(formatCodeDisplayToDisplay),
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
  private readonly defaultFederalState = 'DE-BW';
  private readonly logger = inject(NGXLogger);
  private currentAddressCopiedFromSubmittingFacility = false;

  /**
   * Validates the notifier before enabling copying, or resets the submitting
   * facility when the copy checkbox is cleared.
   */
  handleSubmittingFacilityCopyAddressChange(field: FormlyFieldConfig): void {
    if (!field.formControl.value) {
      this.resetSubmittingFacility();
      return;
    }

    if (this.notifierFacilityGroup.invalid) {
      field.formControl.setValue(false, { emitEvent: false });
      this.submittingFacilityModel.update(model => ({ ...model, copyAddressCheckBox: false }));
      this.errorDialogService.showBasicClosableErrorDialog(
        'Bitte geben Sie die Daten für die Meldende Person zunächst vollständig an.',
        'Fehler bei der Auswahl'
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
        const currentAddress = { country: 'DE' };
        this.notifiedPersonGroup.get('currentAddress')?.reset(currentAddress, { emitEvent: false });
        this.notifiedPersonModel.set({ ...person, currentAddress });
      }
      return;
    }
    this.currentAddressCopiedFromSubmittingFacility = true;

    const facility = this.getCurrentStepModel(this.submittingFacilityModel(), this.submittingFacilityGroup);
    const currentAddress = { ...facility.address, additionalInfo: facility.facilityInfo?.institutionName };
    if (isEqual(person.currentAddress, currentAddress)) return;

    this.notifiedPersonModel.set({ ...person, currentAddress });
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
    const selectedFederalStateCode = this.notificationStorageService.getFederalStateCode() || this.defaultFederalState;
    this.notificationStorageService.setFederalStateCode(selectedFederalStateCode);
    this.notificationCategoryModel.update(model => ({ ...model, federalStateCodeDisplay: selectedFederalStateCode }));
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
        const notifierFacility = this.notificationStorageService.getNotifierFacilityModel();
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

    const federalStateCodeDisplay = this.notificationStorageService.getFederalStateCode() ?? this.defaultFederalState;
    const notificationCategory = {
      ...this.notificationCategoryModel(),
      federalStateCodeDisplay,
      pathogenDisplay: formatCodeDisplayToDisplay(pathogen),
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
          const resetCategory = { ...notificationCategory, pathogenDisplay: '', pathogen: undefined };
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
    const addressType = this.findOptionalField(fields, 'currentAddressType');
    if (addressType) {
      addressType.props = {
        ...addressType.props,
        // Material must finish updating the radio before a rejected selection is reset.
        change: field => setTimeout(() => this.validateCurrentAddressSelection(field)),
      };
    }
    return fields;
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
    const addressValid = keys.every(key => typeof address?.[key] === 'string' && address[key].trim().length > 0 && !group.get(`address.${key}`)?.invalid);
    const institutionValid = !!facilityInfo?.institutionName?.trim() && !group.get('facilityInfo.institutionName')?.invalid;
    if (addressValid && institutionValid) return;

    field.formControl.reset(null);
    this.updateCurrentAddressFromSubmittingFacility();
    this.errorDialogService.showBasicClosableErrorDialog(
      'Bitte geben Sie zunächst den Namen und die Adresse der Einsendeeinrichtung vollständig und korrekt an.',
      'Fehler bei der Auswahl'
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
      address: { country: 'DE' },
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
      const target = field.key === 'facilityInfo' ? this.findField(field.fieldGroup, 'institutionName') : field;
      target.expressions = { ...target.expressions, 'props.disabled': () => !!this.submittingFacilityModel().copyAddressCheckBox };
    }
    this.submitterFacilityFields.set(submitterFields);
    this.notifiedPersonFields.set(this.getNotifiedPersonFields(this.notificationType));
    this.notificationCategoryFields.set(initializeSelectPathogenFields(this.federalStateCodeDisplays, this.pathogenCodeDisplays, this.notificationType));
  }

  /** Resolves a required field by key without depending on layout nesting. */
  private findField(fields: FormlyFieldConfig[], key: string): FormlyFieldConfig {
    const field = this.findOptionalField(fields, key);
    if (!field) throw new Error(`Formly field "${key}" is missing.`);
    return field;
  }

  private findOptionalField(fields: FormlyFieldConfig[], key: string): FormlyFieldConfig | undefined {
    const find = (candidates: FormlyFieldConfig[]): FormlyFieldConfig | undefined => {
      for (const field of candidates) {
        if (field.key === key) return field;
        const nested = find(field.fieldGroup ?? []);
        if (nested) return nested;
      }
      return undefined;
    };
    return find(fields);
  }

  /** Registers validators for all initial steps, including unrendered ones. */
  private buildStepForms(): void {
    this.formlyBuilder.buildForm(this.notifierFacilityGroup, this.notifierFacilityFields(), this.notifierFacilityModel(), {});
    this.formlyBuilder.buildForm(this.submittingFacilityGroup, this.submitterFacilityFields(), this.submittingFacilityModel(), {});
    this.formlyBuilder.buildForm(this.notifiedPersonGroup, this.notifiedPersonFields(), this.notifiedPersonModel(), {});
    this.formlyBuilder.buildForm(this.notificationCategoryGroup, this.notificationCategoryFields(), this.notificationCategoryModel(), {});
  }
}
