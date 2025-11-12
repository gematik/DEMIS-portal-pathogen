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
    For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterModule } from '@angular/router';
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyMaterial } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { PathogenFormValidationModule } from './common/pathogen-formly-validation-module';
import { FavoritesAddComponent } from './components/favorites-add/favorites-add.component';
import { FavoritesListComponent } from './components/favorites-list/favorites-list.component';
import { FormWrapperComponent } from './components/form-wrapper/form-wrapper.component';
import { SideNavigationStepperComponent } from './components/side-navigation-stepper/side-navigation-stepper.component';
import { SideNavigationWrapperComponent } from './components/side-navigation-wrapper/side-navigation-wrapper.component';
import { HexhexbuttonComponent } from './legacy/components/hexhexbutton/hexhexbutton.component';
// TODO: Remove this component, once FEATURE_FLAG_PORTAL_PASTEBOX will be removed
import { PasteBoxComponent as DeprecatedPasteBoxComponent } from './legacy/components/paste-box/paste-box.component';
import { ErrorMessageDialogComponent } from './legacy/dialogs/message-dialog/error-message-dialog.component';
import { AutocompleteTypeComponent } from './legacy/formly/types/autocomplete/autocomplete-type.component';
import { RepeatComponent } from './legacy/formly/types/repeat/repeat.component';
import { ExpansionPanelWrapperComponent } from './legacy/formly/wrappers/expansion-panel-wrapper/expansion-panel.wrapper';
import { ValidationWrapperComponent } from './legacy/formly/wrappers/validation-wrapper/validation-wrapper.component';
import { NotificationFormValidationModule } from './legacy/notification-form-validation-module';
import { ContactTypePipe } from './legacy/pipes/contact-type.pipe';
import { DateFormatPipe } from './legacy/pipes/date-format.pipe';
import { StringFormatPipe } from './legacy/pipes/string-format.pipe';
import { PathogenNotificationComponent } from './pathogen-notification.component';
import { FhirPathogenNotificationService } from './services/fhir-pathogen-notification.service';
import { ClipboardDataService } from './services/clipboard-data.service';
import { DemisPortalSharedModule, FormlyDatepickerComponent, FormlyRepeaterComponent, PasteBoxComponent } from '@gematik/demis-portal-core-library';
import { defaultAppearanceExtension, defaultPlaceholderExtension } from './utils/formly-extensions';
import { withFormlyFieldSelect } from '@ngx-formly/material/select';

@NgModule({
  imports: [
    NotificationFormValidationModule,
    PathogenFormValidationModule,
    MatDialogModule,
    MatExpansionModule,
    MatOptionModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatCardModule,
    MatTableModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    CommonModule,
    CommonModule,
    FormlyMatDatepickerModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatStepperModule,
    RouterModule,
    MatIconModule,
    DateFormatPipe,
    ContactTypePipe,
    StringFormatPipe,
    PathogenNotificationComponent,
    FormWrapperComponent,
    SideNavigationStepperComponent,
    SideNavigationWrapperComponent,
    RepeatComponent,
    AutocompleteTypeComponent,
    ExpansionPanelWrapperComponent,
    ValidationWrapperComponent,
    // TODO: Remove this component, once FEATURE_FLAG_PORTAL_PASTEBOX will be removed
    DeprecatedPasteBoxComponent,
    HexhexbuttonComponent,
    ErrorMessageDialogComponent,
    FavoritesListComponent,
    FavoritesAddComponent,
    DemisPortalSharedModule,
    PasteBoxComponent,
  ],
  providers: [
    FhirPathogenNotificationService,
    ClipboardDataService,
    provideFormlyCore([
      {
        types: [
          { name: 'repeater', component: FormlyRepeaterComponent },
          { name: 'datepicker', component: FormlyDatepickerComponent },
          { name: 'repeat', component: RepeatComponent },
          {
            name: 'autocomplete',
            component: AutocompleteTypeComponent,
            wrappers: ['form-field'],
          },
          {
            name: 'demis-formly-tab-navigation',
            component: FormWrapperComponent,
          },
          {
            name: 'demis-favorites-list',
            component: FavoritesListComponent,
          },
          {
            name: 'demis-favorites-add-list',
            component: FavoritesAddComponent,
          },
        ],
        wrappers: [
          { name: 'validation', component: ValidationWrapperComponent },
          { name: 'expansion-panel', component: ExpansionPanelWrapperComponent },
        ],
        validationMessages: [{ name: 'required', message: 'Diese Angabe wird benötigt' }],
        extensions: [
          {
            name: 'default-placeholder',
            extension: defaultPlaceholderExtension,
          },
          {
            name: 'default-appearance',
            extension: defaultAppearanceExtension,
          },
        ],
      },
      ...withFormlyMaterial(),
      withFormlyFieldSelect(),
    ]),
  ],
})
export class PathogenNotificationModule {}
