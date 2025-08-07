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
import { PathogenNotificationModule } from '../../app/pathogen-notification/pathogen-notification.module';
import { NGXLogger } from 'ngx-logger';
import { FormWrapperComponent } from '../../app/pathogen-notification/components/form-wrapper/form-wrapper.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormlyModule } from '@ngx-formly/core';
import { SideNavigationWrapperComponent } from '../../app/pathogen-notification/components/side-navigation-wrapper/side-navigation-wrapper.component';
import { SideNavigationStepperComponent } from '../../app/pathogen-notification/components/side-navigation-stepper/side-navigation-stepper.component';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { MatStepperModule } from '@angular/material/stepper';
import { MaxHeightContentContainerComponent } from '@gematik/demis-portal-core-library';
import { NotificationType } from '../../app/pathogen-notification/common/routing-helper';

export const mainConfig = {
  featureFlags: {
    FEATURE_FLAG_PORTAL_ERROR_DIALOG: true,
    FEATURE_FLAG_PORTAL_REPEAT: true,
    FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: false,
    FEATURE_FLAG_FOLLOW_UP_NOTIFICATION: false,
    FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER: false,
  },
  gatewayPaths: {
    pathogen: '/api/ng/notification/pathogen',
  },
  ngxLoggerConfig: {
    serverLogLevel: 1,
    disableConsoleLogging: true,
    level: 1,
  },
  pathToGateway: '../gateway/notification',
  pathToFuts: '../fhir-ui-data-model-translation',
  production: false,
};

export function buildMock(activatedRoute = false, notificationType: NotificationType = NotificationType.NominalNotification7_1) {
  const isNonnominal = notificationType === NotificationType.NonNominalNotification7_3;
  const builder = MockBuilder(PathogenNotificationComponent)
    .keep(
      RouterModule.forRoot([
        {
          path: '**',
          component: PathogenNotificationComponent,
        },
      ])
    )
    .keep(PathogenNotificationModule)
    .keep(NoopAnimationsModule)
    .keep(MatIconTestingModule)
    .mock(NGXLogger)
    .keep(FormWrapperComponent)
    .keep(ReactiveFormsModule)
    .keep(MatStepperModule)
    .keep(MatProgressSpinnerModule)
    .keep(FormlyModule.forRoot())
    .keep(SideNavigationWrapperComponent)
    .keep(SideNavigationStepperComponent)
    .keep(MaxHeightContentContainerComponent)
    .keep(FormlyMaterialModule)
    .provide(MockProvider(ChangeDetectorRef))
    .provide(MockProvider(FhirPathogenNotificationService, getFhirPathogenNotificationService(isNonnominal)))
    .provide(MockProvider(PathogenNotificationStorageService, overrides.pathogenNotificationStorageService))
    .provide(provideHttpClient(withInterceptorsFromDi()))
    .provide(ClipboardDataService);

  if (isNonnominal) {
    builder.provide(MockProvider(Router, getRouter('pathogen-notification/7.3/non-nominal')));
  } else if (notificationType === NotificationType.FollowUpNotification7_1) {
    builder.provide(MockProvider(Router, getRouter('pathogen-notification/7.1/follow-up')));
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
