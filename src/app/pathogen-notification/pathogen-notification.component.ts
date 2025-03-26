/*
 Copyright (c) 2025 gematik GmbH
 Licensed under the EUPL, Version 1.2 or - as soon they will be approved by
 the European Commission - subsequent versions of the EUPL (the "Licence");
 You may not use this work except in compliance with the Licence.
    You may obtain a copy of the Licence at:
    https://joinup.ec.europa.eu/software/page/eupl
        Unless required by applicable law or agreed to in writing, software
 distributed under the Licence is distributed on an "AS IS" basis,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the Licence for the specific language governing permissions and
 limitations under the Licence.
 */

import { Component, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormlyFieldConfig, FormlyFormOptions, FormlyModule } from '@ngx-formly/core';
import { distinctUntilChanged, forkJoin, of, Subject, take, takeUntil } from 'rxjs';
import { AddressType, CodeDisplay, PathogenData } from '../../api/notification';
import {
  filterDisplayValues,
  findCodeDisplayByCodeValue,
  findCodeDisplayByDisplayValue,
  formatCodeDisplayToDisplay,
  getDesignationValueIfAvailable,
} from './legacy/common-utils';
import { FormlyConstants } from './legacy/formly/configs/formly-constants';
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
  updatePathogenForm,
} from './utils/pathogen-notification-mapper';
import { applyFilter } from './formly/configs/pathogen/select-notification-category.config';
import { dummyDataForPathogenForm, pathogenTestDummyData } from './utils/dummy-data';
import { pathogenSpecimenFields } from './formly/configs/pathogen/pathogen-specimen.config';
import { initialModelForClipboard } from './services/core/clipboard-constants';

@Component({
  selector: 'app-pathogen-notification',
  templateUrl: './pathogen-notification.component.html',
  styleUrls: ['./pathogen-notification.component.scss'],
  standalone: true,
  imports: [MatProgressSpinner, ReactiveFormsModule, FormlyModule],
})
export class PathogenNotificationComponent implements OnInit, OnDestroy {
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
  private unsubscriber = new Subject<void>();
  sendFunction: (bo: any) => void;
  federalStateCodeDisplays: CodeDisplay[] = [];
  pathogenCodeDisplays: CodeDisplay[] = [];
  countryCodeDisplays: CodeDisplay[] = [];
  pathogenData: PathogenData;
  private notificationCategoryKey = 'notificationCategory';
  private defaultFederalState = 'DE-BW';
  private pathogenIsChangingFromClipboard = false;
  private currentPathogenValue = '';

  constructor(
    public dialog: MatDialog,
    private notificationStorageService: PathogenNotificationStorageService,
    private fhirPathogenNotificationService: FhirPathogenNotificationService,
    private clipboardDataService: ClipboardDataService,
    private logger: NGXLogger,
    private errorDialogService: ErrorDialogService
  ) {
    this.sendFunction = (pathogenForm: any) => {
      const pathogenTest = transformPathogenFormToPathogenTest(pathogenForm, this.getSelectedPathogenCodeDisplayFromStorage(), this.pathogenData);
      this.fhirPathogenNotificationService.openSubmitDialog(pathogenTest);
    };
  }

  ngOnInit(): void {
    this.notificationStorageService.removeSelectedPathogenCodeDisplay();
    this.changeLoadingState(true);
    const selectedFederalStateCode = this.notificationStorageService.getFederalStateCode() || this.defaultFederalState;

    forkJoin([
      this.fhirPathogenNotificationService.fetchCountryCodeDisplays(),
      this.fhirPathogenNotificationService.fetchFederalStateCodeDisplays(),
      this.fhirPathogenNotificationService.fetchPathogenCodeDisplaysForFederalState(selectedFederalStateCode),
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
        this.notifiedPersonFields = notifiedPersonFormConfigFields(this.countryCodeDisplays);
        this.pathogenCodeDisplays = pathogenCodeDisplays;
        this.clipboardDataService.setPathogenCodeDisplays(pathogenCodeDisplays);

        this.model.pathogenForm = {};

        this.initializeSelectPathogenFields(selectedFederalStateCode, this.pathogenCodeDisplays);
        this.updatePathogenForm();

        if (!!this.notificationStorageService.getNotifierFacility()) {
          this.model.pathogenForm.notifierFacility = this.notificationStorageService.getNotifierFacility();
          // DEMIS-1598: Ensure the old country code '20422' is overwritten
          this.model.pathogenForm.notifierFacility.address.country = 'DE';
          setTimeout(() => this.markFormularAsTouched('notifierFacility'));
        }

        this.changeLoadingState(false);
        setTimeout(() => {
          this.subscribeToFederalStateChanges();
          this.subscribeToPathogenChanges();
          this.subscribeToCurrentAddressTypeChanges();
        });
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
    this.selectPathogenFields = initializeSelectPathogenFields(this.federalStateCodeDisplays, pathogenCodeDisplays);
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
            currentAddressField.fieldGroup.forEach(f => {
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
          this.errorDialogService.openErrorDialogAndClose(
            'Fehler bei der Auswahl der Adresse',
            'Bitte geben Sie die Daten für die Einsendende Person zunächst vollständig an.'
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
      .fetchPathogenCodeDisplaysForFederalState(selectedFederalStateCode)
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
        if (fromHexHexButton) this.updateAfterPathogenSelection(pathogenTestDummyData().pathogenDTO.codeDisplay, true);
      });
  }

  private updateAfterPathogenSelection(selectedPathogenCodeDisplay: CodeDisplay, fromHexHexButton: boolean = false, fromClipboard = false) {
    if (!fromHexHexButton && this.getSelectedPathogenCodeDisplayFromStorage()?.code === selectedPathogenCodeDisplay?.code && !fromClipboard) {
      return;
    }
    this.changeLoadingState(true);
    this.resetNotificationCategoryAndSpecimenList();
    this.fhirPathogenNotificationService
      .fetchDiagnosticsBasedOnPathogenSelection(selectedPathogenCodeDisplay.code)
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
          this.model.pathogenForm = dummyDataForPathogenForm;
          //fix for a bug where the pathogen field was not populated if it was cleared by user
          this.setValueForPathogenSelectionField('Influenzavirus');
          this.form.markAllAsTouched();
        }
        if (!fromClipboard) {
          this.changeLoadingState(false);
        }
      });
  }

  private async updatePathogenSelectionListAfterClipboardUpdate(pathogenCode: string): Promise<void> {
    if (pathogenCode) {
      this.updateAfterPathogenSelection(findCodeDisplayByCodeValue(this.pathogenCodeDisplays, pathogenCode), false, true);
    }
  }

  async populatePathogenFormWithClipboardData(fromButtonClick: boolean) {
    this.model = await this.clipboardDataService.transformClipboardDataToModel(fromButtonClick, this.model);
    try {
      this.form.patchValue(this.model.pathogenForm);
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

  private setPathogenInformation = () => {
    const materials = this.pathogenData.materials.map(formatCodeDisplayToDisplay);
    const methods = this.pathogenData.methods.map(formatCodeDisplayToDisplay);
    const subPathogens = this.pathogenData.answerSet.map(formatCodeDisplayToDisplay);
    const resistanceGenes = this.pathogenData.resistanceGenes.map(formatCodeDisplayToDisplay);
    const resistances = this.pathogenData.resistances.map(formatCodeDisplayToDisplay);
    const analyts = this.pathogenData.substances.map(formatCodeDisplayToDisplay);

    this.getSubPathogenSelectionField().props.filter = (term: string) => applyFilter(term, subPathogens);

    this.diagnosticFormFields = pathogenSpecimenFields(
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
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }
}
