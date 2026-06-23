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

import { getFhirPathogenNotificationService, getRouter, overrides } from '../shared/test-setup-utils';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MockBuilder, MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClipboardDataService } from '../../app/pathogen-notification/services/clipboard-data.service';
import { environment } from '../../environments/environment';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { ChangeDetectorRef } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { FormWrapperComponent } from '../../app/pathogen-notification/components/form-wrapper/form-wrapper.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormlyModule } from '@ngx-formly/core';
import { SideNavigationWrapperComponent } from '../../app/pathogen-notification/components/side-navigation-wrapper/side-navigation-wrapper.component';
import { SideNavigationStepperComponent } from '../../app/pathogen-notification/components/side-navigation-stepper/side-navigation-stepper.component';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { MatStepperModule } from '@angular/material/stepper';
import { MaxHeightContentContainerComponent, PasteBoxComponent } from '@gematik/demis-portal-core-library';
import { allowedRoutes, NotificationType } from '../../app/pathogen-notification/common/routing-helper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { FavoritesAddComponent } from '../../app/pathogen-notification/components/favorites-add/favorites-add.component';
import { FavoritesListComponent } from '../../app/pathogen-notification/components/favorites-list/favorites-list.component';
import { HexhexbuttonComponent } from '../../app/pathogen-notification/legacy/components/hexhexbutton/hexhexbutton.component';
import { AutocompleteTypeComponent } from '../../app/pathogen-notification/legacy/formly/types/autocomplete/autocomplete-type.component';
import { RepeatComponent } from '../../app/pathogen-notification/legacy/formly/types/repeat/repeat.component';
import { ExpansionPanelWrapperComponent } from '../../app/pathogen-notification/legacy/formly/wrappers/expansion-panel-wrapper/expansion-panel.wrapper';
import { ValidationWrapperComponent } from '../../app/pathogen-notification/legacy/formly/wrappers/validation-wrapper/validation-wrapper.component';
import { ContactTypePipe } from '../../app/pathogen-notification/legacy/pipes/contact-type.pipe';
import { DateFormatPipe } from '../../app/pathogen-notification/legacy/pipes/date-format.pipe';
import { StringFormatPipe } from '../../app/pathogen-notification/legacy/pipes/string-format.pipe';
import { PathogenFormlyConfig } from '../../app/pathogen-notification/formly/configs/formly-app-config';
import { NotificationFormValidationConfig } from '../../app/pathogen-notification/legacy/notification-form-validation-module';
import { PathogenFormValidationConfig } from '../../app/pathogen-notification/common/pathogen-formly-validation-module';

export const mainConfig = {
  featureFlags: {
    FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: true,
    FEATURE_FLAG_ANONYMOUS_NOTIFICATION: true,
    FEATURE_FLAG_PORTAL_HEADER_FOOTER: true,
    FEATURE_FLAG_PORTAL_ACCESSIBILITY: true,
    FEATURE_FLAG_FOOTER_LINKS_CORRECTION: true,
    FEATURE_FLAG_FOLLOW_UP_7_3: true,
    FEATURE_FLAG_REFERENCE_FIELD: true,
  },
  gatewayPaths: {
    pathogen: '/notification/pathogen',
    pathogen_7_1: '/notification/pathogen/7.1',
    pathogen_7_3_non_nominal: '/notification/pathogen/7.3/non_nominal',
    pathogen_7_3_anonymous: '/notification/pathogen/7.3/anonymous',
  },
  pathToGateway: '../gateway/pathogen',
  pathToFuts: '/translation/ui-data-model/v6/fhir',
  pathToDestinationLookup: '/destination-lookup/v1',
  production: false,
};

export function buildMock(activatedRoute = false, notificationType: NotificationType = NotificationType.NominalNotification7_1) {
  const needsNoFederalStates = notificationType !== NotificationType.NominalNotification7_1;
  const builder = MockBuilder(PathogenNotificationComponent)
    .keep(
      RouterModule.forRoot([
        {
          path: '**',
          component: PathogenNotificationComponent,
        },
      ])
    )
    .keep(FormlyMatDatepickerModule)
    .keep(MatAutocompleteModule)
    .keep(MatButtonModule)
    .keep(MatDialogModule)
    .keep(MatExpansionModule)
    .keep(MatFormFieldModule)
    .keep(MatIconModule)
    .keep(MatInputModule)
    .keep(MatOptionModule)
    .keep(MatSidenavModule)
    .keep(MatTabsModule)
    .keep(MatToolbarModule)
    .keep(DateFormatPipe)
    .keep(ContactTypePipe)
    .keep(StringFormatPipe)
    .keep(RepeatComponent)
    .keep(AutocompleteTypeComponent)
    .keep(ExpansionPanelWrapperComponent)
    .keep(ValidationWrapperComponent)
    .keep(HexhexbuttonComponent)
    .keep(FavoritesListComponent)
    .keep(FavoritesAddComponent)
    .keep(PasteBoxComponent)
    .keep(NoopAnimationsModule)
    .keep(MatIconTestingModule)
    .mock(NGXLogger)
    .keep(FormWrapperComponent)
    .keep(ReactiveFormsModule)
    .keep(MatStepperModule)
    .keep(MatProgressSpinnerModule)
    .keep(
      FormlyModule.forRoot({
        types: [...(PathogenFormlyConfig.types ?? [])],
        wrappers: [...(PathogenFormlyConfig.wrappers ?? [])],
        extensions: [...(PathogenFormlyConfig.extensions ?? [])],
        validators: [...(NotificationFormValidationConfig.validators ?? []), ...(PathogenFormValidationConfig.validators ?? [])],
        validationMessages: [...(NotificationFormValidationConfig.validationMessages ?? []), ...(PathogenFormlyConfig.validationMessages ?? [])],
        extras: NotificationFormValidationConfig.extras,
      })
    )
    .keep(SideNavigationWrapperComponent)
    .keep(SideNavigationStepperComponent)
    .keep(MaxHeightContentContainerComponent)
    .keep(FormlyMaterialModule)
    .provide(MockProvider(ChangeDetectorRef))
    .provide(MockProvider(FhirPathogenNotificationService, getFhirPathogenNotificationService(needsNoFederalStates)))
    .provide(MockProvider(PathogenNotificationStorageService, overrides.pathogenNotificationStorageService))
    .provide(provideHttpClient(withInterceptorsFromDi()))
    .provide(ClipboardDataService);

  if (notificationType === NotificationType.FollowUpNotification7_1) {
    builder.provide(MockProvider(Router, getRouter(allowedRoutes.followUp)));
  } else if (notificationType === NotificationType.AnonymousNotification7_3) {
    builder.provide(MockProvider(Router, getRouter(allowedRoutes.anonymous)));
  } else if (notificationType === NotificationType.NonNominalNotification7_3) {
    builder.provide(MockProvider(Router, getRouter(allowedRoutes.nonNominal)));
  } else if (notificationType === NotificationType.FollowUpNotification7_3) {
    builder.provide(MockProvider(Router, getRouter(allowedRoutes.followUpNonNominal)));
  }

  if (activatedRoute) {
    builder.provide(MockProvider(ActivatedRoute, overrides.activatedRoute));
  }

  return builder;
}

let component: PathogenNotificationComponent;
let fixture: MockedComponentFixture<PathogenNotificationComponent>;
let loader: HarnessLoader;

export function setupIntegrationTests(customPathogenConfig?: any) {
  environment.pathogenConfig = customPathogenConfig ?? mainConfig;
  fixture = MockRender(PathogenNotificationComponent);
  component = fixture.point.componentInstance;
  loader = TestbedHarnessEnvironment.loader(fixture);
  fixture.detectChanges();
  return {
    fixture: fixture,
    component: component,
    loader: loader,
  };
}
