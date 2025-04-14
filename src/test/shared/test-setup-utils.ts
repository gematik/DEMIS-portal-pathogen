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

import { PathogenNotificationComponent } from '../../app/pathogen-notification/pathogen-notification.component';
import { PathogenNotificationModule } from '../../app/pathogen-notification/pathogen-notification.module';
import { FormWrapperComponent } from '../../app/pathogen-notification/components/form-wrapper/form-wrapper.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { of } from 'rxjs';
import { TEST_DATA } from './test-data';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { SideNavigationStepperComponent } from '../../app/pathogen-notification/components/side-navigation-stepper/side-navigation-stepper.component';
import { SideNavigationWrapperComponent } from '../../app/pathogen-notification/components/side-navigation-wrapper/side-navigation-wrapper.component';

export const PATHOGEN_NOTIFICATION_IMPORTS = [
  RouterModule.forRoot([
    {
      path: '**',
      component: PathogenNotificationComponent,
    },
  ]),
  PathogenNotificationComponent,
  PathogenNotificationModule,
  FormWrapperComponent,
  ReactiveFormsModule,
  MatProgressSpinnerModule,
  FormlyModule.forRoot(),
  FormlyMaterialModule,
  NoopAnimationsModule,
  MatStepperModule,
  LoggerModule.forRoot({
    level: NgxLoggerLevel.DEBUG,
    serverLogLevel: NgxLoggerLevel.ERROR,
  }),
  SideNavigationWrapperComponent,
  SideNavigationStepperComponent,
];
export let selectedPathogenCodeDisplay: { code: string; display: string; designations: any[] } | undefined;

export let diagnosticBasedOnPathogenSelection: any;

export const overrides = {
  get fhirPathogenNotificationService() {
    return {
      fetchCountryCodeDisplays: jasmine.createSpy('fetchCountryCodeDisplays').and.returnValue(of(TEST_DATA.countryCodeDisplays)),
      fetchFederalStateCodeDisplays: jasmine.createSpy('fetchFederalStateCodeDisplays').and.returnValue(of(TEST_DATA.federalStateCodeDisplays)),
      fetchPathogenCodeDisplaysForFederalState: jasmine
        .createSpy('fetchPathogenCodeDisplaysForFederalState')
        .and.returnValue(of(TEST_DATA.pathogenCodeDisplays)),
      fetchDiagnosticsBasedOnPathogenSelection: jasmine
        .createSpy('fetchDiagnosticsBasedOnPathogenSelection')
        .and.callFake(() => of(diagnosticBasedOnPathogenSelection)),
    } as Partial<FhirPathogenNotificationService>;
  },
  get pathogenNotificationStorageService() {
    return {
      getNotifierFacility: jasmine.createSpy('getNotifierFacility').and.returnValue(TEST_DATA.notifierFacility),
      getSelectedPathogenCodeDisplay: jasmine.createSpy('getSelectedPathogenCodeDisplay').and.callFake(() => selectedPathogenCodeDisplay),
      favoritesChanged: jasmine.createSpyObj('favoritesChanged', ['subscribe']),
    } as Partial<PathogenNotificationStorageService>;
  },
  get activatedRoute() {
    return {
      fragment: of(''),
    } as Partial<ActivatedRoute>;
  },
};

export function setSelectedPathogenCodeDisplay(value: typeof selectedPathogenCodeDisplay) {
  selectedPathogenCodeDisplay = value;
}

export function setDiagnosticBasedOnPathogenSelection(value: typeof diagnosticBasedOnPathogenSelection) {
  diagnosticBasedOnPathogenSelection = value;
}
