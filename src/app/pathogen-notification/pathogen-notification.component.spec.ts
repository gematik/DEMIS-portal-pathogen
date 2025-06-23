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
import { PathogenNotificationComponent } from './pathogen-notification.component';
import { FhirPathogenNotificationService } from './services/fhir-pathogen-notification.service';
import { of } from 'rxjs';
import { PathogenNotificationStorageService } from './services/pathogen-notification-storage.service';
import { TEST_DATA } from '../../test/shared/test-data';
import { HarnessLoader } from '@angular/cdk/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { NotificationType } from './common/routing-helper';
import { buildMock, setupIntegrationTests } from '../../test/integration/integration.base.spec';

describe('PathogenNotificationComponent', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  let fetchCountryCodeDisplaysSpy: jasmine.Spy;
  let fetchFederalStateCodeDisplaysSpy: jasmine.Spy;
  let fetchPathogenCodeDisplaysSpy: jasmine.Spy;
  let getNotifierFacilitySpy: jasmine.Spy;

  beforeEach(async () => await buildMock());

  beforeEach(async () => {
    const result = setupIntegrationTests();
    fixture = result.fixture;
    component = result.component;
    loader = result.loader;

    fetchCountryCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchCountryCodeDisplays as jasmine.Spy;
    fetchFederalStateCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchFederalStateCodeDisplays as jasmine.Spy;
    fetchPathogenCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchPathogenCodeDisplays as jasmine.Spy;
    getNotifierFacilitySpy = TestBed.inject(PathogenNotificationStorageService).getNotifierFacility as jasmine.Spy;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and set countryCodeDisplays on init', () => {
    fetchCountryCodeDisplaysSpy.and.returnValue(of(TEST_DATA.countryCodeDisplays));
    component.ngOnInit();
    expect(fetchCountryCodeDisplaysSpy).toHaveBeenCalled();
    expect(component.countryCodeDisplays).toEqual(TEST_DATA.countryCodeDisplays);
  });

  it('should fetch and set federalStateCodeDisplays on init', () => {
    fetchFederalStateCodeDisplaysSpy.and.returnValue(of(TEST_DATA.federalStateCodeDisplays));
    component.ngOnInit();
    expect(fetchFederalStateCodeDisplaysSpy).toHaveBeenCalled();
    expect(component.federalStateCodeDisplays).toEqual(TEST_DATA.federalStateCodeDisplays);
  });

  it('should fetch and set pathogenCodeDisplays on init', () => {
    fetchPathogenCodeDisplaysSpy.and.returnValue(of(TEST_DATA.pathogenCodeDisplays));
    component.ngOnInit();
    expect(fetchPathogenCodeDisplaysSpy).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, 'DE-BW');
    expect(component.pathogenCodeDisplays).toEqual(TEST_DATA.pathogenCodeDisplays);
  });

  it('should fetch and set notifierFacility on init', () => {
    getNotifierFacilitySpy.and.returnValue(TEST_DATA.notifierFacility);
    component.ngOnInit();
    expect(getNotifierFacilitySpy).toHaveBeenCalled();
    expect(component.model.pathogenForm.notifierFacility).toEqual(TEST_DATA.notifierFacility);
  });
  it('should fetch and not set notifierFacility on init if empty', () => {
    getNotifierFacilitySpy.and.returnValue(null);
    component.ngOnInit();
    expect(getNotifierFacilitySpy).toHaveBeenCalled();
    expect(component.model.pathogenForm.notifierFacility).toEqual(undefined);
  });
});
