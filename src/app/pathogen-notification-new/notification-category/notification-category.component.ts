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

import { Component, computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StepContentComponent } from '@gematik/demis-portal-core-library';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { distinctUntilChanged, of, take, tap } from 'rxjs';
import { NotificationStepFormComponent } from '../notification-step-form/notification-step-form.component';
import { NotificationStepActionsComponent } from '../notification-step-actions/notification-step-actions.component';
import { PathogenConstants } from '../../pathogen-notification/common/constants';
import { CodeDisplay, PathogenData } from '../../../api/notification';
import {
  filterDisplayValues,
  findCodeDisplayByDisplayValue,
  formatCodeDisplayToDesignationOption,
  formatCodeDisplayToDisplay,
} from '../../pathogen-notification/legacy/common-utils';

import { PathogenNotificationStorageService } from '../../pathogen-notification/services/pathogen-notification-storage.service';
import { FhirPathogenNotificationService } from '../../pathogen-notification/services/fhir-pathogen-notification.service';
import { catchError } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notification-category',
  imports: [NotificationStepFormComponent, NotificationStepActionsComponent, MatProgressSpinner],
  templateUrl: './notification-category.component.html',
  styleUrl: './notification-category.component.scss',
})
export class NotificationCategoryComponent extends StepContentComponent<void> {
  isLoading: WritableSignal<boolean> = signal(false);

  private readonly logger = inject(NGXLogger);

  readonly notificationService = inject(PathogenNotificationService);

  protected readonly fieldConfig = computed(() => this.notificationService.notificationCategoryFields().map(field => this.configureField(field)));

  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationStorageService = inject(PathogenNotificationStorageService);
  private readonly fhirPathogenNotificationService = inject(FhirPathogenNotificationService);

  protected readonly PathogenConstants = PathogenConstants;

  private get notificationType() {
    return this.notificationService.notificationType;
  }

  /**
   * Recursively copies the shared field configuration and wires step-specific selection handlers.
   * Restores available pathogen and species options when the step is recreated after navigation.
   */
  private configureField(field: FormlyFieldConfig): FormlyFieldConfig {
    const configuredField = { ...field };
    if (field.fieldGroup) {
      configuredField.fieldGroup = field.fieldGroup.map(child => this.configureField(child));
    }
    if (field.type === 'demis-favorites-list') {
      this.configureFavoritesField(configuredField);
    }
    if (field.key === 'federalStateCodeDisplay') {
      configuredField.hooks = { ...field.hooks, onInit: initializedField => this.subscribeToFederalStateChanges(initializedField) };
    } else if (field.key === 'pathogenDisplay') {
      this.configurePathogenSelectionField(configuredField);
    } else if (field.key === 'pathogen') {
      this.configureSubPathogenSelectionField(configuredField);
    }
    return configuredField;
  }

  private configureFavoritesField(field: FormlyFieldConfig): void {
    field.props = {
      ...field.props,
      notificationType: this.notificationType,
      selectPathogen: (pathogen: CodeDisplay) => {
        if (this.notificationStorageService.getSelectedPathogenCodeDisplay()?.code === pathogen.code) {
          return;
        }
        // Avoid triggering a second diagnostics request through the pathogen value-change handler.
        this.getPathogenSelectionField().formControl.setValue(formatCodeDisplayToDisplay(pathogen), { emitEvent: false });
        this.setValueForSubPathogenSelectionField('');
        this.updateAfterPathogenSelection(pathogen);
        this.notificationService.notificationCategoryGroup.markAsTouched();
      },
    };
  }

  private configurePathogenSelectionField(field: FormlyFieldConfig): void {
    field.props = {
      ...field.props,
      // Read the shared list so the filter uses pathogens available for the current federal state.
      filter: (term: string) => {
        const pathogenDisplays = this.notificationService.pathogenCodeDisplays.map(formatCodeDisplayToDisplay);
        return of(term ? filterDisplayValues(term, pathogenDisplays) : pathogenDisplays.slice());
      },
    };
    field.hooks = {
      ...field.hooks,
      onInit: initializedField => this.subscribeToPathogenChanges(initializedField),
    };
  }

  private configureSubPathogenSelectionField(field: FormlyFieldConfig): void {
    // Preserve explicit clearing (null) across navigation; undefined allows automatic single-option selection.
    field.parsers = [...(field.parsers ?? []), value => (value === null ? '' : value)];
    if (this.notificationService.pathogenData) {
      this.configureSubPathogenField(field, this.notificationService.pathogenData);
    }
  }

  private getSelectionField(key: string): FormlyFieldConfig {
    const findField = (fields: FormlyFieldConfig[]): FormlyFieldConfig | undefined => {
      for (const field of fields) {
        if (field.key === key) return field;
        const nestedField = field.fieldGroup && findField(field.fieldGroup);
        if (nestedField) return nestedField;
      }
      return undefined;
    };
    const field = findField(this.fieldConfig());
    if (!field) throw new Error(`Notification category field "${key}" is missing.`);
    return field;
  }

  private getPathogenSelectionField() {
    return this.getSelectionField('pathogenDisplay');
  }

  private setValueForSubPathogenSelectionField(value: string | undefined) {
    this.getSubPathogenSelectionField().formControl.setValue(value);
  }

  private getSubPathogenSelectionField() {
    return this.getSelectionField('pathogen');
  }

  /**
   * Clears dependent form data and loads diagnostics and species options for a new pathogen.
   * Leaves existing data unchanged when the selected pathogen code has not changed.
   */
  private updateAfterPathogenSelection(selectedPathogenCodeDisplay: CodeDisplay) {
    if (this.notificationStorageService.getSelectedPathogenCodeDisplay()?.code === selectedPathogenCodeDisplay.code) {
      return;
    }

    this.isLoading.set(true);
    const federalStateCodeDisplay = this.notificationStorageService.getFederalStateCode() ?? 'DE-BW';
    this.resetNotificationCategoryAndDiagnostic(federalStateCodeDisplay, formatCodeDisplayToDisplay(selectedPathogenCodeDisplay));
    this.fhirPathogenNotificationService
      .fetchDiagnosticsBasedOnPathogenSelection(selectedPathogenCodeDisplay.code, this.notificationType)
      .pipe(
        take(1),
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.logger.error(error);
          this.notificationStorageService.removeSelectedPathogenCodeDisplay();
          this.resetNotificationCategoryAndDiagnostic(federalStateCodeDisplay);
          this.isLoading.set(false);
          return of();
        })
      )
      .subscribe((data: PathogenData) => {
        this.notificationStorageService.setSelectedPathogenCodeDisplay(selectedPathogenCodeDisplay);

        this.notificationService.setPathogenData(data);
        this.configureSubPathogenField(this.getSubPathogenSelectionField(), data);
        this.notificationService.pathogenDTOGroup.enable();
        this.isLoading.set(false);
      });
  }

  private subscribeToPathogenChanges(pathogenDisplay: FormlyFieldConfig) {
    return pathogenDisplay.formControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged(),
      tap(pathogen => {
        //reset diagnostic if pathogen is cleared
        if (pathogen === '') {
          this.notificationStorageService.removeSelectedPathogenCodeDisplay();
          this.resetNotificationCategoryAndDiagnostic(this.notificationStorageService.getFederalStateCode() ?? 'DE-BW');
        } else {
          const selectedPathogenCodeDisplay = findCodeDisplayByDisplayValue(this.notificationService.pathogenCodeDisplays, pathogen);
          if (selectedPathogenCodeDisplay) {
            this.updateAfterPathogenSelection(selectedPathogenCodeDisplay);
            this.notificationService.pathogenDTOGroup.enable();
          }
        }
      })
    );
  }

  /**
   * Stores the federal state, clears dependent selections and diagnostics, and reloads available pathogens.
   * Defaults to DE-BW when no state is provided.
   */
  private updateAfterFederalStateSelection(selectedFederalStateCode = 'DE-BW') {
    this.notificationStorageService.setFederalStateCode(selectedFederalStateCode);
    this.notificationStorageService.removeSelectedPathogenCodeDisplay();
    this.resetNotificationCategoryAndDiagnostic(selectedFederalStateCode);
    this.fhirPathogenNotificationService
      .fetchPathogenCodeDisplaysByTypeAndState(this.notificationType, selectedFederalStateCode)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((pathogenCodeDisplays: CodeDisplay[]) => {
        this.notificationService.pathogenCodeDisplays = pathogenCodeDisplays;
        // Refresh the autocomplete's active filter after the asynchronous list update.
        this.getPathogenSelectionField().formControl.setValue('');
      });
    this.resetDiagnostic();
  }

  private configureSubPathogenField(field: FormlyFieldConfig, data: PathogenData) {
    field.props.options = data.answerSet.map(formatCodeDisplayToDesignationOption);
  }

  private resetDiagnostic(): void {
    this.notificationService.pathogenDTOGroup.reset();
    this.notificationService.pathogenDTOGroup.disable();
    this.notificationService.pathogenModel.set({});
  }

  private resetNotificationCategoryAndDiagnostic(federalStateCodeDisplay: string, pathogenDisplay = '') {
    this.getSubPathogenSelectionField().props.options = [];
    const categoryModel = { federalStateCodeDisplay, pathogenDisplay, pathogen: undefined };
    this.notificationService.notificationCategoryGroup.reset(categoryModel, { emitEvent: false });
    this.notificationService.notificationCategoryModel.set(categoryModel);
    // Notify the core select so its displayed value is cleared along with the form control.
    this.setValueForSubPathogenSelectionField(undefined);
    this.resetDiagnostic();
  }

  private subscribeToFederalStateChanges(federalStateSelection: FormlyFieldConfig) {
    return federalStateSelection.formControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged(),
      tap(federalState => this.updateAfterFederalStateSelection(federalState))
    );
  }
}
