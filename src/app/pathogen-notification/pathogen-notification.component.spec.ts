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

import { beforeEach, describe, expect, it, type Mock, type MockedObject, vi } from 'vitest';
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
import { ClipboardDataService } from './services/clipboard-data.service';
import { LocalStorageService } from './legacy/services/local-storage.service';

describe('PathogenNotificationComponent', () => {
  let component: PathogenNotificationComponent;
  let loader: HarnessLoader;
  let fixture: MockedComponentFixture<PathogenNotificationComponent>;

  let fetchCountryCodeDisplaysSpy: Mock;
  let fetchFederalStateCodeDisplaysSpy: Mock;
  let fetchPathogenCodeDisplaysByTypeAndStateSpy: Mock;
  let getNotifierFacilitySpy: Mock;
  let loggerSpy: MockedObject<NGXLogger>;

  beforeEach(async () => await buildMock());

  beforeEach(async () => {
    const result = setupIntegrationTests();
    fixture = result.fixture;
    component = result.component;
    loader = result.loader;

    fetchCountryCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchCountryCodeDisplays as Mock;
    fetchFederalStateCodeDisplaysSpy = TestBed.inject(FhirPathogenNotificationService).fetchFederalStateCodeDisplays as Mock;
    fetchPathogenCodeDisplaysByTypeAndStateSpy = TestBed.inject(FhirPathogenNotificationService).fetchPathogenCodeDisplaysByTypeAndState as Mock;
    getNotifierFacilitySpy = TestBed.inject(PathogenNotificationStorageService).getNotifierFacility as Mock;
    loggerSpy = TestBed.inject(NGXLogger) as MockedObject<NGXLogger>;
    vi.spyOn(loggerSpy, 'error');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch and set countryCodeDisplays on init', () => {
    fetchCountryCodeDisplaysSpy.mockReturnValue(of(TEST_DATA.countryCodeDisplays));
    component.ngOnInit();
    expect(fetchCountryCodeDisplaysSpy).toHaveBeenCalled();
    expect(component.countryCodeDisplays).toEqual(TEST_DATA.countryCodeDisplays);
  });

  it('should fetch and set federalStateCodeDisplays on init', () => {
    fetchFederalStateCodeDisplaysSpy.mockReturnValue(of(TEST_DATA.federalStateCodeDisplays));
    component.ngOnInit();
    expect(fetchFederalStateCodeDisplaysSpy).toHaveBeenCalled();
    expect(component.federalStateCodeDisplays).toEqual(TEST_DATA.federalStateCodeDisplays);
  });

  it('should fetch and set pathogenCodeDisplays on init', () => {
    fetchPathogenCodeDisplaysByTypeAndStateSpy.mockReturnValue(of(TEST_DATA.pathogenCodeDisplays));
    component.ngOnInit();
    expect(fetchPathogenCodeDisplaysByTypeAndStateSpy).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, 'DE-BW');
    expect(component.pathogenCodeDisplays).toEqual(TEST_DATA.pathogenCodeDisplays);
  });

  it('should fetch and set notifierFacility on init', () => {
    getNotifierFacilitySpy.mockReturnValue(TEST_DATA.notifierFacility);
    component.ngOnInit();
    expect(getNotifierFacilitySpy).toHaveBeenCalled();
    expect(component.model.pathogenForm.notifierFacility).toEqual(TEST_DATA.notifierFacility);
  });
  it('should fetch and not set notifierFacility on init if empty', () => {
    getNotifierFacilitySpy.mockReturnValue(null);
    component.ngOnInit();
    expect(getNotifierFacilitySpy).toHaveBeenCalled();
    expect(component.model.pathogenForm.notifierFacility).toEqual(undefined);
  });

  it('finishes loading when stored notifier facility data is not usable by the legacy form', () => {
    const storage = TestBed.runInInjectionContext(() => new PathogenNotificationStorageService());
    vi.spyOn(TestBed.inject(LocalStorageService), 'getItem').mockReturnValue({ facilityInfo: { institutionName: 'Test laboratory' } });
    getNotifierFacilitySpy.mockImplementation(() => storage.getNotifierFacility());

    component.ngOnInit();

    expect(component.model.pathogenForm.notifierFacility).toBeUndefined();
    expect(component.isLoading()).toBe(false);
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
  });

  it('should handle error when fetching initial data and log error', () => {
    const error = new Error('Test Error');
    fetchCountryCodeDisplaysSpy.mockReturnValue(throwError(() => error));
    // Provide other observables as they are in forkJoin
    fetchFederalStateCodeDisplaysSpy.mockReturnValue(of([]));
    fetchPathogenCodeDisplaysByTypeAndStateSpy.mockReturnValue(of([]));
    getNotifierFacilitySpy.mockReturnValue(null);

    component.ngOnInit();

    expect(loggerSpy.error).toHaveBeenCalledWith(error);
  });

  it('should log a clipboard transformation error and preserve the model', async () => {
    const error = new Error("Unknown value 'W'");
    const model = component.model;
    vi.spyOn(TestBed.inject(ClipboardDataService), 'transformClipboardDataToModel').mockRejectedValue(error);

    await component.populatePathogenFormWithClipboardData(true);

    expect(loggerSpy.error).toHaveBeenCalledWith('Error while reading clipboard data: ', error);
    expect(component.model).toBe(model);
  });

  describe('updateAfterFederalStateSelection', () => {
    it('should fetch pathogen displays and update filter when federal state is selected', () => {
      component.notificationType = NotificationType.NominalNotification7_1;
      const federalState = 'DE-BY';
      const pathogenDisplays = [TEST_DATA.pathogenCodeDisplays[0]];

      // Initialize fields using ngOnInit with empty/dummy data
      fetchCountryCodeDisplaysSpy.mockReturnValue(of(TEST_DATA.countryCodeDisplays));
      fetchFederalStateCodeDisplaysSpy.mockReturnValue(of(TEST_DATA.federalStateCodeDisplays));
      fetchPathogenCodeDisplaysByTypeAndStateSpy.mockReturnValue(of(TEST_DATA.pathogenCodeDisplays));
      getNotifierFacilitySpy.mockReturnValue(null);
      component.ngOnInit();

      // Reset spy and setup return value for the actual test
      fetchPathogenCodeDisplaysByTypeAndStateSpy.mockClear();
      fetchPathogenCodeDisplaysByTypeAndStateSpy.mockReturnValue(of(pathogenDisplays));
      vi.spyOn(component, 'setValueForPathogenSelectionField').mockReturnValue(undefined);

      component.updateAfterFederalStateSelection(federalState);

      expect(fetchPathogenCodeDisplaysByTypeAndStateSpy).toHaveBeenCalledWith(NotificationType.NominalNotification7_1, federalState);
      expect(component.pathogenCodeDisplays).toEqual(pathogenDisplays);
      expect(component.setValueForPathogenSelectionField).toHaveBeenCalledWith('');
    });
  });

  describe('updateAfterPathogenSelection', () => {
    it('should handle error during pathogen selection update and log error', () => {
      // Initialize fields
      fetchCountryCodeDisplaysSpy.mockReturnValue(of(TEST_DATA.countryCodeDisplays));
      fetchFederalStateCodeDisplaysSpy.mockReturnValue(of(TEST_DATA.federalStateCodeDisplays));
      fetchPathogenCodeDisplaysByTypeAndStateSpy.mockReturnValue(of(TEST_DATA.pathogenCodeDisplays));
      getNotifierFacilitySpy.mockReturnValue(null);
      component.ngOnInit();

      const fetchDiagnosticsSpy = TestBed.inject(FhirPathogenNotificationService).fetchDiagnosticsBasedOnPathogenSelection as Mock;
      const error = new Error('Diagnostics Error');
      fetchDiagnosticsSpy.mockReturnValue(throwError(() => error));

      vi.spyOn(component, 'setValueForPathogenSelectionField').mockReturnValue(undefined);
      vi.spyOn(component, 'setValueForSubPathogenSelectionField').mockReturnValue(undefined);

      const pathogen = TEST_DATA.pathogenCodeDisplays[0];

      component.populateWithFavoriteSelection(pathogen);

      expect(loggerSpy.error).toHaveBeenCalledWith(error);
      expect(component.isLoading()).toBe(false);
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

      vi.spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBe(testNotificationId);
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not set initialNotificationId when notificationType is not FollowUpNotification7_1', () => {
      const testNotificationId = 'TEST-NOTIFICATION-ID-12345';
      component.notificationType = NotificationType.NominalNotification7_1;
      followUpNotificationIdService.validatedNotificationId.set(testNotificationId);

      component.model = { pathogenForm: { notificationCategory: {} } };

      vi.spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBeUndefined();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should not set initialNotificationId when notificationType is NonNominalNotification7_3', () => {
      const testNotificationId = 'TEST-NOTIFICATION-ID-12345';
      component.notificationType = NotificationType.NonNominalNotification7_3;
      followUpNotificationIdService.validatedNotificationId.set(testNotificationId);

      component.model = { pathogenForm: { notificationCategory: {} } };

      vi.spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBeUndefined();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });

    it('should set initialNotificationId to undefined when followUpNotificationIdService returns undefined', () => {
      component.notificationType = NotificationType.FollowUpNotification7_1;
      followUpNotificationIdService.validatedNotificationId.set(undefined);

      component.model = { pathogenForm: { notificationCategory: {} } };

      vi.spyOn(component.form, 'markAllAsTouched');

      component['updateFormForHexHex']();

      expect(component.model.pathogenForm.notificationCategory.initialNotificationId).toBeUndefined();
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
    });
  });
});
