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

import { of } from 'rxjs';
import { TEST_DATA } from './test-data';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';

export let selectedPathogenCodeDisplay: { code: string; display: string; designations: any[] } | undefined;

export let diagnosticBasedOnPathogenSelection: any;

export const overrides = {
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

export function getRouter(url: string = '/pathogen-notification') {
  return {
    url,
    events: of(new NavigationStart(0, url)),
    navigate: jasmine.createSpy('navigate').and.callFake(() => Promise.resolve(true)),
  } as Partial<Router>;
}

export function getFhirPathogenNotificationService(isNonNominal: boolean = false) {
  return {
    fetchCountryCodeDisplays: jasmine.createSpy('fetchCountryCodeDisplays').and.returnValue(of(TEST_DATA.countryCodeDisplays)),
    fetchFederalStateCodeDisplays: jasmine
      .createSpy('fetchFederalStateCodeDisplays')
      .and.returnValue(isNonNominal ? of([]) : of(TEST_DATA.federalStateCodeDisplays)),
    fetchPathogenCodeDisplays: jasmine.createSpy('fetchPathogenCodeDisplaysForFederalState').and.returnValue(of(TEST_DATA.pathogenCodeDisplays)),
    fetchDiagnosticsBasedOnPathogenSelection: jasmine
      .createSpy('fetchDiagnosticsBasedOnPathogenSelection')
      .and.callFake(() => of(diagnosticBasedOnPathogenSelection)),
    fetchFollowUpNotificationCategory: jasmine.createSpy('fetchFollowUpNotificationCategory').and.returnValue(of({ notificationCategory: 'invp' })),
  } as Partial<FhirPathogenNotificationService>;
}

export function setSelectedPathogenCodeDisplay(value: typeof selectedPathogenCodeDisplay) {
  selectedPathogenCodeDisplay = value;
}

export function setDiagnosticBasedOnPathogenSelection(value: typeof diagnosticBasedOnPathogenSelection) {
  diagnosticBasedOnPathogenSelection = value;
}
