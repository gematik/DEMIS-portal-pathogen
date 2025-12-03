/*
    Copyright (c) 2025 gematik GmbH
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

import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { distinctUntilChanged, filter, forkJoin, of, Subject, take, takeUntil } from 'rxjs';
import { AddressType, CodeDisplay, PathogenData } from '../../api/notification';
import {
  filterDisplayValues,
  findCodeDisplayByCodeValue,
  findCodeDisplayByDisplayValue,
  formatCodeDisplayToDisplay,
  getDesignationValueIfAvailable,
  mapCodeDisplaysToOptionList,
} from './legacy/common-utils';
import { notifierFacilityFormConfigFieldsFull } from './legacy/formly/configs/reusable/notifier-facility.config';
import { FhirPathogenNotificationService } from './services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from './services/pathogen-notification-storage.service';
import { ClipboardDataService } from './services/clipboard-data.service';
import { transformPathogenFormToPathogenTest } from './utils/data-transformation';
import { NGXLogger } from 'ngx-logger';
import { submittingFacilityFields } from './formly/configs/pathogen/submitting-facility.config';
import { catchError } from 'rxjs/operators';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { notifiedPersonFormConfigFields } from './legacy/formly/configs/reusable/notified-person.config';
import { ErrorDialogService } from './services/error-dialog.service';
import {
  clearDiagnosticForClipboard,
  getResetModel,
  initializeDiagnosticFields,
  initializeSelectPathogenFields,
  isFollowUpNotificationEnabled,
  isNonNominalNotificationEnabled,
  updatePathogenForm,
} from './utils/pathogen-notification-mapper';
import { applyFilter } from './formly/configs/pathogen/select-notification-category.config';
import { dummyDataForPathogenForm, pathogenTestDummyData } from './utils/dummy-data';
import { pathogenSpecimenFields } from './formly/configs/pathogen/pathogen-specimen.config';
import { initialModelForClipboard } from './services/core/clipboard-constants';
import { Router } from '@angular/router';
import {
  FollowUpNotificationIdService,
  FormlyConstants,
  MaxHeightContentContainerComponent,
  notifiedPersonAnonymousConfigFields,
  notifiedPersonNotByNameConfigFields,
} from '@gematik/demis-portal-core-library';
import { allowedRoutes, getNotificationTypeByRouterUrl, NotificationType } from './common/routing-helper';
import { GENDER_OPTION_LIST } from './legacy/formly-options-lists';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-pathogen-notification',
  templateUrl: './pathogen-notification.component.html',
  styleUrls: ['./pathogen-notification.component.scss'],
  imports: [MatProgressSpinner, ReactiveFormsModule, FormlyModule, MaxHeightContentContainerComponent],
})
export class PathogenNotificationComponent implements OnInit, OnDestroy {
  dialog = inject(MatDialog);
  private readonly notificationStorageService = inject(PathogenNotificationStorageService);
  private readonly fhirPathogenNotificationService = inject(FhirPathogenNotificationService);
  private readonly clipboardDataService = inject(ClipboardDataService);
  private readonly logger = inject(NGXLogger);
  private readonly errorDialogService = inject(ErrorDialogService);
  private readonly followUpNotificationIdService = inject(FollowUpNotificationIdService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  form: FormGroup = new FormGroup({});
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [];
  notifierFacilityFields: FormlyFieldConfig[];
  submitterFacilityFields: FormlyFieldConfig[];
  notifiedPersonFields: FormlyFieldConfig[];
  selectPathogenFields: FormlyFieldConfig[];
  diagnosticFormFields: FormlyFieldConfig[] = [
    {
      className: FormlyConstants.LAYOUT_HEADER,
      template: '<h1>Bitte zuerst den Meldetatbestand auswählen!</h1>',
    },
  ];
  model: any = {};
  isLoading: WritableSignal<boolean> = signal(false);
  private readonly unsubscriber = new Subject<void>();
  sendFunction: (bo: any) => void;
  federalStateCodeDisplays: CodeDisplay[] = [];
  pathogenCodeDisplays: CodeDisplay[] = [];
  countryCodeDisplays: CodeDisplay[] = [];
  pathogenData: PathogenData;
  notificationType = NotificationType.NominalNotification7_1;
  private readonly notificationCategoryKey = 'notificationCategory';
  private readonly defaultFederalState = 'DE-BW';
  private pathogenIsChangingFromClipboard = false;
  private currentPathogenValue = '';
  readonly router = inject(Router);

  constructor() {
    this.sendFunction = (pathogenForm: any) => {
      const pathogenTest = transformPathogenFormToPathogenTest(
        pathogenForm,
        this.notificationType,
        this.getSelectedPathogenCodeDisplayFromStorage(),
        this.pathogenData
      );
      //DEMIS-4242, fixes issue where change detection didn't work for 7.3 notifications
      this.changeDetector.detectChanges();
      this.fhirPathogenNotificationService.submitNotification(pathogenTest, this.notificationType);
    };
  }

  ngOnInit(): void {
    this.notificationStorageService.removeSelectedPathogenCodeDisplay();
    this.changeLoadingState(true);
    const selectedFederalStateCode = this.notificationStorageService.getFederalStateCode() || this.defaultFederalState;

    if (isNonNominalNotificationEnabled() || isFollowUpNotificationEnabled()) {
      this.notificationType = getNotificationTypeByRouterUrl(this.router.url);
    }

    forkJoin([
      this.fhirPathogenNotificationService.fetchCountryCodeDisplays(),
      this.fhirPathogenNotificationService.fetchFederalStateCodeDisplays(this.notificationType),
      this.fhirPathogenNotificationService.fetchPathogenCodeDisplaysByTypeAndState(this.notificationType, selectedFederalStateCode),
    ])
      .pipe(
        take(1),
        catchError(error => {
          return of([[], [], []]);
        })
      )
      .subscribe(([countryCodeDisplays, federalStateCodeDisplays, pathogenCodeDisplays]) => {
        this.federalStateCodeDisplays = federalStateCodeDisplays;
        this.countryCodeDisplays = countryCodeDisplays;
        this.notifierFacilityFields = notifierFacilityFormConfigFieldsFull(this.countryCodeDisplays);
        this.submitterFacilityFields = submittingFacilityFields(this.countryCodeDisplays, this.errorDialogService);
        this.notifiedPersonFields = this.getNotifiedPersonFields(this.notificationType);
        this.pathogenCodeDisplays = pathogenCodeDisplays;
        this.clipboardDataService.setPathogenCodeDisplays(pathogenCodeDisplays);

        this.model.pathogenForm = {};
        this.initializeSelectPathogenFields(selectedFederalStateCode, this.pathogenCodeDisplays);
        this.updatePathogenForm();

        if (this.notificationStorageService.getNotifierFacility()) {
          this.model.pathogenForm.notifierFacility = this.notificationStorageService.getNotifierFacility();
          // DEMIS-1598: Ensure the old country code '20422' is overwritten
          this.model.pathogenForm.notifierFacility.address.country = 'DE';
          setTimeout(() => this.markFormularAsTouched('notifierFacility'));
        }

        this.changeLoadingState(false);
        setTimeout(() => {
          if (this.notificationType === NotificationType.NominalNotification7_1) {
            this.subscribeToFederalStateChanges();
          }
          this.subscribeToPathogenChanges();
          if (!this.isFollowUpNotification7_1() && !this.isNonNominalNotification7_3()) {
            this.subscribeToCurrentAddressTypeChanges();
          }
        });
        if (this.isFollowUpNotification7_1()) {
          this.getPathogenCodeDisplaysAndOpenFollowUpDialog();
        }
      });

    this.clipboardDataService.pathogenValueIsChanging.subscribe((pathogenValue: string) => {
      if (this.currentPathogenValue != pathogenValue) {
        this.updatePathogenSelectionListAfterClipboardUpdate(pathogenValue).then(() => this.updateModelFromClipboard(pathogenValue));
        this.currentPathogenValue = pathogenValue;
      }
    });

    this.clipboardDataService.pathogenDataIsChangingFromClipboard.subscribe((pathogenIsChanging: boolean) => {
      this.pathogenIsChangingFromClipboard = pathogenIsChanging;
    });
    this.handleFollowUpNotification7_1();
  }

  populateWithFavoriteSelection(pathogen: CodeDisplay): void {
    this.updateAfterPathogenSelection(pathogen);
    this.markFormularAsTouched(this.notificationCategoryKey);
  }

  populatePathogenFormWithHexHexData(): void {
    this.updateAfterFederalStateSelection(this.defaultFederalState, true);
  }

  getSelectedPathogenCodeDisplayFromStorage = () => {
    return this.notificationStorageService.getSelectedPathogenCodeDisplay();
  };

  markFormularAsTouched(key: string) {
    this.fields[0].fieldGroup.find(field => field.key === key).formControl?.markAsTouched();
  }

  getPathogenSelectionField() {
    return this.fields[0].fieldGroup.find(field => field.key === this.notificationCategoryKey).fieldGroup[4].fieldGroup[0];
  }

  getSubPathogenSelectionField(): FormlyFieldConfig {
    return this.fields[0].fieldGroup.find(field => field.key === this.notificationCategoryKey).fieldGroup[5].fieldGroup[0];
  }

  getNotifiedPersonFields(notificationType: NotificationType): FormlyFieldConfig[] {
    switch (notificationType) {
      case NotificationType.FollowUpNotification7_1:
        return notifiedPersonAnonymousConfigFields(mapCodeDisplaysToOptionList(this.countryCodeDisplays), GENDER_OPTION_LIST);
      case NotificationType.NonNominalNotification7_3:
        return notifiedPersonNotByNameConfigFields(mapCodeDisplaysToOptionList(this.countryCodeDisplays), GENDER_OPTION_LIST);
      default:
        return notifiedPersonFormConfigFields(this.countryCodeDisplays);
    }
  }

  setValueForPathogenSelectionField(value: string) {
    this.getPathogenSelectionField().formControl.setValue(value);
  }

  setValueForSubPathogenSelectionField(value: string) {
    this.getSubPathogenSelectionField().formControl.setValue(value);
  }

  submit() {
    this.notificationStorageService.setNotifierFacility(this.model.pathogenForm.notifierFacility);
    this.sendFunction(this.model.pathogenForm);
  }

  initializeSelectPathogenFields(selectedFederalStateCode: string, pathogenCodeDisplays: CodeDisplay[]) {
    this.selectPathogenFields = initializeSelectPathogenFields(this.federalStateCodeDisplays, pathogenCodeDisplays, this.notificationType);
    this.model = initializeDiagnosticFields(selectedFederalStateCode, this.model);
  }

  updatePathogenForm() {
    this.fields = updatePathogenForm(
      this.form,
      this.notifierFacilityFields,
      this.submitterFacilityFields,
      this.notifiedPersonFields,
      this.selectPathogenFields,
      this.diagnosticFormFields
    );
  }

  private handleFollowUpNotification7_1() {
    if (this.isFollowUpNotification7_1()) {
      this.followUpNotificationIdService.hasValidNotificationId$
        .pipe(
          takeUntil(this.unsubscriber),
          distinctUntilChanged(),
          filter(hasValid => hasValid === true)
        )
        .subscribe(() => {
          const codeDisplay = findCodeDisplayByCodeValue(this.pathogenCodeDisplays, this.followUpNotificationIdService.followUpNotificationCategory());
          if (codeDisplay) {
            this.updateAfterPathogenSelection(
              findCodeDisplayByCodeValue(this.pathogenCodeDisplays, this.followUpNotificationIdService.followUpNotificationCategory())
            );
          } else {
            this.errorDialogService.showBasicErrorDialogWithRedirect(
              'Der gespeicherte Erreger ' +
                this.followUpNotificationIdService.followUpNotificationCategory() +
                ' für die ID ' +
                this.followUpNotificationIdService.validatedNotificationId +
                ' wird für die §7.1er Meldungen nicht unterstützt.',
              'Fehler'
            );
          }
          this.model.pathogenForm.notificationCategory.initialNotificationId = this.followUpNotificationIdService.validatedNotificationId();
        });
    }
  }

  getPathogenCodeDisplaysAndOpenFollowUpDialog() {
    this.fhirPathogenNotificationService.fetchAllPathogenCodeDisplays7_1().subscribe({
      next: (response: CodeDisplay[]) => {
        this.followUpNotificationIdService.openDialog({
          dialogData: {
            routerLink: '/' + allowedRoutes.nominal,
            linkTextContent: 'eines namentlichen Erregernachweises nach § 7 Abs. 1 IfSG',
            pathToDestinationLookup: environment.pathToDestinationLookup,
            errorUnsupportedNotificationCategory:
              'Aktuell sind Nichtnamentliche Folgemeldungen eines Erregernachweises gemäß § 7 Abs. 1 IfSG nur für eine § 7 Abs. 1 IfSG Initialmeldung möglich.',
          },
          notificationCategoryCodes: response.map(codeDisplays => codeDisplays.code),
        });
      },
    });
  }

  subscribeToCurrentAddressTypeChanges() {
    const currentAddressField = this.notifiedPersonFields[6].fieldGroup.find(field => field.key === 'currentAddress');
    const currentAddressTypeField = this.notifiedPersonFields[6].fieldGroup.find(field => field.key === 'currentAddressType');

    currentAddressTypeField?.formControl?.valueChanges
      .pipe(takeUntil(this.unsubscriber), distinctUntilChanged())
      .subscribe((currentAddressType: AddressType) => {
        //reset input data on value change
        setTimeout(() => {
          currentAddressField?.formControl?.reset();
          // on change from clipboard, fields must not be cleared
          if (!this.model.pathogenForm.isFromClipboard) {
            // reset does not clear data from clipboard
            this.model.pathogenForm.notifiedPerson.currentAddress = undefined;
            currentAddressField.fieldGroup?.forEach(f => {
              f.formControl?.setValue(f.key === 'country' ? 'DE' : '');
            });
          }
          delete this.model.pathogenForm.isFromClipboard;
        });

        const address = this.model.pathogenForm.submittingFacility.address;
        const institutionName = this.model?.pathogenForm?.submittingFacility?.facilityInfo?.institutionName;
        if (
          currentAddressType === AddressType.SubmittingFacility &&
          (!address.street || !address.zip || !address.city || !address.houseNumber || !institutionName)
        ) {
          this.errorDialogService.showBasicClosableErrorDialog(
            'Bitte geben Sie die Daten für die Einsendende Person zunächst vollständig an.',
            'Fehler bei der Auswahl der Adresse'
          );

          setTimeout(() => {
            currentAddressTypeField?.formControl?.setValue(undefined);
          });
        } else if (currentAddressType === AddressType.SubmittingFacility) {
          setTimeout(() => {
            currentAddressField?.formControl?.setValue({ ...address, additionalInfo: institutionName });
          });
        }
      });
  }

  subscribeToFederalStateChanges() {
    const federalStateSelection = this.selectPathogenFields[3].fieldGroup[0];
    federalStateSelection?.formControl?.valueChanges
      .pipe(takeUntil(this.unsubscriber))
      .subscribe(federalState => this.updateAfterFederalStateSelection(federalState));
  }

  subscribeToPathogenChanges() {
    const pathogenDisplay = this.selectPathogenFields[4].fieldGroup[0];
    pathogenDisplay?.formControl?.valueChanges.pipe(takeUntil(this.unsubscriber), distinctUntilChanged()).subscribe(pathogen => {
      //reset diagnostic if pathogen is cleared
      if (pathogen === '') {
        this.notificationStorageService.removeSelectedPathogenCodeDisplay();
        this.resetNotificationCategoryAndSpecimenList();
        this.setValueForSubPathogenSelectionField('');
      } else if (this.pathogenCodeDisplays.map(formatCodeDisplayToDisplay).includes(pathogen)) {
        if (!this.pathogenIsChangingFromClipboard) {
          this.updateAfterPathogenSelection(findCodeDisplayByDisplayValue(this.pathogenCodeDisplays, pathogen));
        }
      }
    });
  }

  updateAfterFederalStateSelection(selectedFederalStateCode?: string, fromHexHexButton: boolean = false) {
    selectedFederalStateCode = selectedFederalStateCode ?? this.defaultFederalState; // necessary if not in clipboard data
    this.notificationStorageService.setFederalStateCode(selectedFederalStateCode);
    this.fhirPathogenNotificationService
      .fetchPathogenCodeDisplaysByTypeAndState(this.notificationType, selectedFederalStateCode)
      .pipe(take(1))
      .subscribe((pathogenCodeDisplays: CodeDisplay[]) => {
        this.pathogenCodeDisplays = pathogenCodeDisplays;

        const pathogenDisplays = pathogenCodeDisplays.map(formatCodeDisplayToDisplay);

        //new "options" for the pathogen autocomplete field
        //we decided to only update the filter instead of the whole selectPathogenFields
        this.getPathogenSelectionField().props.filter = (term: string) => of(term ? filterDisplayValues(term, pathogenDisplays) : pathogenDisplays.slice());

        //Erreger clearen
        if (!fromHexHexButton) this.setValueForPathogenSelectionField('');

        this.resetNotificationCategoryAndSpecimenList();
        if (fromHexHexButton) {
          this.updateAfterPathogenSelection(pathogenTestDummyData(this.isNonNominalNotification7_3()).pathogenDTO.codeDisplay, true);
        }
      });
  }

  public isNonNominalNotification7_3(): boolean {
    return this.notificationType === NotificationType.NonNominalNotification7_3;
  }

  public isFollowUpNotification7_1(): boolean {
    return this.notificationType === NotificationType.FollowUpNotification7_1;
  }

  private updateAfterPathogenSelection(selectedPathogenCodeDisplay: CodeDisplay, fromHexHexButton: boolean = false, fromClipboard = false) {
    if (!fromHexHexButton && this.getSelectedPathogenCodeDisplayFromStorage()?.code === selectedPathogenCodeDisplay?.code && !fromClipboard) {
      return;
    }
    this.changeLoadingState(true);
    this.resetNotificationCategoryAndSpecimenList();
    this.fhirPathogenNotificationService
      .fetchDiagnosticsBasedOnPathogenSelection(selectedPathogenCodeDisplay.code, this.notificationType)
      .pipe(
        take(1),
        catchError(error => {
          this.setValueForPathogenSelectionField('');
          this.setValueForSubPathogenSelectionField('');
          this.changeLoadingState(false);
          return of();
        })
      )
      .subscribe((data: PathogenData) => {
        this.notificationStorageService.setSelectedPathogenCodeDisplay(selectedPathogenCodeDisplay);
        this.pathogenData = data;
        this.clipboardDataService.setPathogenData(data);
        this.setPathogenInformation();
        if (fromClipboard) {
          this.model = clearDiagnosticForClipboard(selectedPathogenCodeDisplay, this.notificationStorageService.getFederalStateCode(), this.model);
          this.populatePathogenFormWithClipboardData(false).then(() => this.updatePathogenForm());
        } else {
          this.updatePathogenForm();
        }
        this.model.pathogenForm.notificationCategory = {
          ...this.model.pathogenForm.notificationCategory,
          federalStateCodeDisplay: this.notificationStorageService.getFederalStateCode() || 'DE-BW',
          pathogenDisplay: getDesignationValueIfAvailable(selectedPathogenCodeDisplay),
        };
        if (!fromHexHexButton) {
          this.model.pathogenForm.notificationCategory = {
            ...this.model.pathogenForm.notificationCategory,
            federalStateCodeDisplay: this.notificationStorageService.getFederalStateCode() || 'DE-BW',
            pathogenDisplay: getDesignationValueIfAvailable(selectedPathogenCodeDisplay),
          };
          setTimeout(() => {
            this.closePathogenSelectionAutocomplete();
          });
        } else {
          this.updateFormForHexHex();
        }
        if (!fromClipboard) {
          this.changeLoadingState(false);
        }
      });
  }

  private updateFormForHexHex() {
    this.model.pathogenForm = dummyDataForPathogenForm(this.notificationType);

    //fix for a bug where the pathogen field was not populated if it was cleared by user
    if (this.isNonNominalNotification7_3()) {
      this.setValueForPathogenSelectionField('HIV');
    } else {
      this.setValueForPathogenSelectionField('Influenzavirus');
    }
    if (this.isFollowUpNotification7_1()) {
      this.model.pathogenForm.notificationCategory.initialNotificationId = this.followUpNotificationIdService.validatedNotificationId();
    }
    this.form.markAllAsTouched();
  }

  private async updatePathogenSelectionListAfterClipboardUpdate(pathogenCode: string): Promise<void> {
    if (pathogenCode) {
      this.updateAfterPathogenSelection(findCodeDisplayByCodeValue(this.pathogenCodeDisplays, pathogenCode), false, true);
    }
  }

  async populatePathogenFormWithClipboardData(fromButtonClick: boolean) {
    const checkBoxValueBefore = this.model.pathogenForm.submittingFacility.copyAddressCheckBox;
    this.model = await this.clipboardDataService.transformClipboardDataToModel(fromButtonClick, this.model, this.notificationType);
    try {
      this.form.patchValue(this.model.pathogenForm);
      // trigger change for copyAddressCheckBox in case that data was overwritten
      if (checkBoxValueBefore && !this.model.pathogenForm.submittingFacility.copyAddressCheckBox) {
        this.submitterFacilityFields[1].formControl.patchValue(false);
        this.submitterFacilityFields[1].props.change(this.submitterFacilityFields[1]);
      }
      if (!fromButtonClick) {
        this.changeLoadingState(false);
      }
      setTimeout(() => {
        this.markFormularAsTouched('notifierFacility');
        this.markFormularAsTouched('submittingFacility');
        this.markFormularAsTouched('notifiedPerson');
        this.markFormularAsTouched(this.notificationCategoryKey);
        this.markFormularAsTouched('pathogenDTO');
      });
    } catch (error) {
      this.logger.error('Error while reading clipboard data: ', error);
    }
  }

  private updateModelFromClipboard(pathogenValueFromClipboard: string) {
    this.model.pathogenForm = {
      ...this.model.pathogenForm,
      ...initialModelForClipboard(pathogenValueFromClipboard, this.pathogenCodeDisplays),
    };
  }

  private readonly setPathogenInformation = () => {
    const materials = this.pathogenData.materials.map(formatCodeDisplayToDisplay);
    const methods = this.pathogenData.methods.map(formatCodeDisplayToDisplay);
    const subPathogens = this.pathogenData.answerSet.map(formatCodeDisplayToDisplay);
    const resistanceGenes = this.pathogenData.resistanceGenes.map(formatCodeDisplayToDisplay);
    const resistances = this.pathogenData.resistances.map(formatCodeDisplayToDisplay);
    const analyts = this.pathogenData.substances.map(formatCodeDisplayToDisplay);

    this.getSubPathogenSelectionField().props.filter = (term: string) => applyFilter(term, subPathogens);

    this.diagnosticFormFields = pathogenSpecimenFields(
      this.notificationType,
      materials,
      methods,
      resistanceGenes,
      resistances,
      analyts,
      this.pathogenData.header,
      this.pathogenData.subheader ?? ''
    );
  };

  private resetNotificationCategoryAndSpecimenList() {
    this.model = getResetModel(this.model);
    this.fields[0].fieldGroup.find(field => field.key === this.notificationCategoryKey).formControl?.markAsUntouched();
    this.fields[0].fieldGroup.find(field => field.key === 'pathogenDTO').formControl?.markAsUntouched();
  }

  private changeLoadingState(loading: boolean) {
    this.isLoading.set(loading);
  }

  private closePathogenSelectionAutocomplete() {
    //bug: autocomplete options dialog did not close
    window.document.getElementById('pathogenDisplay')?.blur();
    window.document.body.click();
  }

  ngOnDestroy(): void {
    this.notificationStorageService.removeSelectedPathogenCodeDisplay();
    this.followUpNotificationIdService.resetState();
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }
}
