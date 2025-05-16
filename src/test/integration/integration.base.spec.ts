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

import { TestBed } from '@angular/core/testing';
import { overrides, PATHOGEN_NOTIFICATION_IMPORTS } from '../shared/test-setup-utils';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { ActivatedRoute } from '@angular/router';
import { ClipboardDataService } from '../../app/pathogen-notification/services/clipboard-data.service';
import { environment } from '../../environments/environment';
import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';

export const mainConfig = {
  featureFlags: {
    FEATURE_FLAG_COPY_CHECKBOX_FOR_NOTIFIER_DATA: true,
    FEATURE_FLAG_PORTAL_ERROR_DIALOG: true,
    FEATURE_FLAG_PORTAL_REPEAT: true,
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

export async function buildMock() {
  return await TestBed.configureTestingModule({
    imports: PATHOGEN_NOTIFICATION_IMPORTS,
    providers: [
      provideHttpClient(withInterceptorsFromDi()),
      MockProvider(FhirPathogenNotificationService, overrides.fhirPathogenNotificationService),
      MockProvider(PathogenNotificationStorageService, overrides.pathogenNotificationStorageService),
      MockProvider(ActivatedRoute, overrides.activatedRoute),
      [ClipboardDataService],
    ],
  }).compileComponents();
}

let component: PathogenNotificationComponent;
let fixture: MockedComponentFixture<PathogenNotificationComponent>;
let loader: HarnessLoader;

export function setupIntegrationTests() {
  environment.pathogenConfig = mainConfig;
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
