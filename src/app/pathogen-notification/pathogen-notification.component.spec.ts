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

import { TestBed } from '@angular/core/testing';
import { PathogenNotificationComponent } from './pathogen-notification.component';
import { FhirPathogenNotificationService } from './services/fhir-pathogen-notification.service';
import { of, throwError } from 'rxjs';
import { PathogenNotificationStorageService } from './services/pathogen-notification-storage.service';
import { TEST_DATA } from '../../test/shared/test-data';
import { HarnessLoader } from '@angular/cdk/testing';
import { MockedComponentFixture } from 'ng-mocks';
import { NotificationType } from './common/routing-helper';
import { buildMock, setupIntegrationTests } from '../../test/integration/base';
import { FollowUpNotificationIdService } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';

describe('PathogenNotificationComponent', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  let fetchCountryCodeDisplaysSpy: jasmine.Spy;
  let fetchFederalStateCodeDisplaysSpy: jasmine.Spy;
  let fetchPathogenCodeDisplaysByTypeAndStateSpy: jasmine.Spy;
  let getNotifierFacilitySpy: jasmine.Spy;
  let loggerSpy: jasmine.SpyObj<NGXLogger>;

  beforeEach(async () => await buildMock());

  beforeEach(async () => {
    const result = setupIntegrationTests();
    fixture = result.fixture;
    component = result.component;
    loader = result.loader;

    fetchCountryCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchCountryCodeDisplays as jasmine.Spy;
    fetchFederalStateCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchFederalStateCodeDisplays as jasmine.Spy;
    fetchPathogenCodeDisplaysByTypeAndStateSpy = TestBed.inject(FhirPathogenNotificationService).fetchPathogenCodeDisplaysByTypeAndState as jasmine.Spy;
    getNotifierFacilitySpy = TestBed.inject(PathogenNotificationStorageService).getNotifierFacility as jasmine.Spy;
    loggerSpy = TestBed.inject(NGXLogger) as jasmine.SpyObj<NGXLogger>;
    if (!loggerSpy.error.and) {
      spyOn(loggerSpy, 'error');
    }

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
    fetchPathogenCodeDisplaysByTypeAndStateSpy.and.returnValue(of(TEST_DATA.pathogenCodeDisplays));
    component.ngOnInit();
    expect(fetchPathogenCodeDisplaysByTypeAndStateSpy).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, 'DE-BW');
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

  it('should handle error when fetching initial data and log error', () => {
    const error = new Error('Test Error');
    fetchCountryCodeDisplaysSpy.and.returnValue(throwError(() => error));
    // Provide other observables as they are in forkJoin
    fetchFederalStateCodeDisplaysSpy.and.returnValue(of([]));
    fetchPathogenCodeDisplaysByTypeAndStateSpy.and.returnValue(of([]));
    getNotifierFacilitySpy.and.returnValue(null);

    component.ngOnInit();

    expect(loggerSpy.error).toHaveBeenCalledWith(error);
  });

  describe('updateAfterFederalStateSelection', () => {
    it('should fetch pathogen displays and update filter when federal state is selected', () => {
      component.notificationType = NotificationType.NominalNotification7_1;
      const federalState = 'DE-BY';
      const pathogenDisplays = [TEST_DATA.pathogenCodeDisplays[0]];

      // Initialize fields using ngOnInit with empty/dummy data
      fetchCountryCodeDisplaysSpy.and.returnValue(of(TEST_DATA.countryCodeDisplays));
      fetchFederalStateCodeDisplaysSpy.and.returnValue(of(TEST_DATA.federalStateCodeDisplays));
      fetchPathogenCodeDisplaysByTypeAndStateSpy.and.returnValue(of(TEST_DATA.pathogenCodeDisplays));
      getNotifierFacilitySpy.and.returnValue(null);
      component.ngOnInit();

      // Reset spy and setup return value for the actual test
      fetchPathogenCodeDisplaysByTypeAndStateSpy.calls.reset();
      fetchPathogenCodeDisplaysByTypeAndStateSpy.and.returnValue(of(pathogenDisplays));
      spyOn(component, 'setValueForPathogenSelectionField');

      component.updateAfterFederalStateSelection(federalState);

      expect(fetchPathogenCodeDisplaysByTypeAndStateSpy).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, federalState);
      expect(component.pathogenCodeDisplays).toEqual(pathogenDisplays);
      expect(component.setValueForPathogenSelectionField).toHaveBeenCalledWith('');
    });
  });

  describe('updateAfterPathogenSelection', () => {
    it('should handle error during pathogen selection update and log error', () => {
      // Initialize fields
      fetchCountryCodeDisplaysSpy.and.returnValue(of(TEST_DATA.countryCodeDisplays));
      fetchFederalStateCodeDisplaysSpy.and.returnValue(of(TEST_DATA.federalStateCodeDisplays));
      fetchPathogenCodeDisplaysByTypeAndStateSpy.and.returnValue(of(TEST_DATA.pathogenCodeDisplays));
      getNotifierFacilitySpy.and.returnValue(null);
      component.ngOnInit();

      const fetchDiagnosticsSpy = TestBed.inject(FhirPathogenNotificationService).fetchDiagnosticsBasedOnPathogenSelection as jasmine.Spy;
      const error = new Error('Diagnostics Error');
      fetchDiagnosticsSpy.and.returnValue(throwError(() => error));

      spyOn(component, 'setValueForPathogenSelectionField');
      spyOn(component, 'setValueForSubPathogenSelectionField');

      const pathogen = TEST_DATA.pathogenCodeDisplays[0];

      component.populateWithFavoriteSelection(pathogen);

      expect(loggerSpy.error).toHaveBeenCalledWith(error);
      expect(component.isLoading()).toBeFalse();
      expect(component.setValueForPathogenSelectionField).toHaveBeenCalledWith('');
      expect(component.setValueForSubPathogenSelectionField).toHaveBeenCalledWith('');
    });
  });

  describe('updateFormForHexHex', () => {
    let followUpNotificationIdService: FollowUpNotificationIdService;

    beforeEach(() => {
      followUpNotificationIdService = TestBed.inject(FollowUpNotificationIdService);
    });

    it('should set initialNotificationId from followUpNotificationIdService when notificationType is FollowUpNotification7_1', () => {
      const testNotificationId = 'TEST-NOTIFICATION-ID-12345';
      component.notificationType = NotificationType.FollowUpNotification7_1;
      followUpNotificationIdService.validatedNotificationId.set(testNotificationId);

      component.model = { pathogenForm: { notificationCategory: {} } };

      spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBe(testNotificationId);
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not set initialNotificationId when notificationType is not FollowUpNotification7_1', () => {
      const testNotificationId = 'TEST-NOTIFICATION-ID-12345';
      component.notificationType = NotificationType.NominalNotification7_1;
      followUpNotificationIdService.validatedNotificationId.set(testNotificationId);

      component.model = { pathogenForm: { notificationCategory: {} } };

      spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBeUndefined();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not set initialNotificationId when notificationType is NonNominalNotification7_3', () => {
      const testNotificationId = 'TEST-NOTIFICATION-ID-12345';
      component.notificationType = NotificationType.NonNominalNotification7_3;
      followUpNotificationIdService.validatedNotificationId.set(testNotificationId);

      component.model = { pathogenForm: { notificationCategory: {} } };

      spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBeUndefined();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should set initialNotificationId to undefined when followUpNotificationIdService returns undefined', () => {
      component.notificationType = NotificationType.FollowUpNotification7_1;
      followUpNotificationIdService.validatedNotificationId.set(undefined);

      component.model = { pathogenForm: { notificationCategory: {} } };

      spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBeUndefined();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });
  });
});
