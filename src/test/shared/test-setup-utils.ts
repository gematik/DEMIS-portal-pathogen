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

import { vi } from 'vitest';
import { EventEmitter } from '@angular/core';
import { of } from 'rxjs';
import { TEST_DATA } from './test-data';
import { FhirPathogenNotificationService } from '../../app/pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../../app/pathogen-notification/services/pathogen-notification-storage.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';

export let selectedPathogenCodeDisplay:
  | {
      code: string;
      display: string;
      designations: any[];
    }
  | undefined;

export let diagnosticBasedOnPathogenSelection: any;

export const overrides = {
  get pathogenNotificationStorageService() {
    return {
      getNotifierFacility: vi.fn().mockReturnValue(TEST_DATA.notifierFacility),
      getSelectedPathogenCodeDisplay: vi.fn().mockImplementation(() => selectedPathogenCodeDisplay),
      favoritesChanged: new EventEmitter<void>(),
    } as Partial<PathogenNotificationStorageService>;
  },
  get activatedRoute() {
    return {
      fragment: of(''),
    } as Partial<ActivatedRoute>;
  },
};

export function getRouter(url = '/pathogen-notification') {
  return {
    url,
    events: of(new NavigationStart(0, url)),
    navigate: vi.fn().mockImplementation(() => Promise.resolve(true)),
  } as Partial<Router>;
}

export function getFhirPathogenNotificationService(needsNoFederalStates = false) {
  return {
    fetchCountryCodeDisplays: vi.fn().mockReturnValue(of(TEST_DATA.countryCodeDisplays)),
    fetchFederalStateCodeDisplays: vi.fn().mockReturnValue(needsNoFederalStates ? of([]) : of(TEST_DATA.federalStateCodeDisplays)),
    fetchPathogenCodeDisplaysByTypeAndState: vi.fn().mockReturnValue(of(TEST_DATA.pathogenCodeDisplays)),
    fetchDiagnosticsBasedOnPathogenSelection: vi.fn().mockImplementation(() => of(diagnosticBasedOnPathogenSelection)),
    fetchAllPathogenCodeDisplays: vi.fn().mockReturnValue(of(TEST_DATA.pathogenCodeDisplays)),
    fetchFollowUpCode: vi.fn().mockReturnValue(of(TEST_DATA.pathogenCodeDisplays.slice(0, 1))),
  } as Partial<FhirPathogenNotificationService>;
}

export function setSelectedPathogenCodeDisplay(value: typeof selectedPathogenCodeDisplay) {
  selectedPathogenCodeDisplay = value;
}

export function setDiagnosticBasedOnPathogenSelection(value: typeof diagnosticBasedOnPathogenSelection) {
  diagnosticBasedOnPathogenSelection = value;
}
