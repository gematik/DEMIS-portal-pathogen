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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeDisplay, NotifierFacility } from '../../../api/notification';
import { TEST_DATA } from '../../../test/shared/test-data';
import { NotifierFacilityFormModel } from '../legacy/models/pathogen-form-model';
import { LocalStorageService } from '../legacy/services/local-storage.service';
import { PathogenNotificationStorageService } from './pathogen-notification-storage.service';

describe('PathogenNotificationStorageService', () => {
  let service: PathogenNotificationStorageService;
  const localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    addItemToList: vi.fn(),
    removeObjectFromList: vi.fn(),
  };

  const pathogen: CodeDisplay = { code: 'test', display: 'Test pathogen', designations: [] };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [PathogenNotificationStorageService, { provide: LocalStorageService, useValue: localStorage }],
    });
    service = TestBed.inject(PathogenNotificationStorageService);
  });

  it('stores, retrieves, and removes the selected pathogen', () => {
    localStorage.getItem.mockReturnValue(pathogen);

    service.setSelectedPathogenCodeDisplay(pathogen);
    expect(localStorage.setItem).toHaveBeenCalledExactlyOnceWith(service.PATHOGEN_CODE_DISPLAY, pathogen);
    expect(service.getSelectedPathogenCodeDisplay()).toBe(pathogen);

    service.removeSelectedPathogenCodeDisplay();
    expect(localStorage.removeItem).toHaveBeenCalledExactlyOnceWith(service.PATHOGEN_CODE_DISPLAY);
  });

  it('stores and retrieves the federal state code', () => {
    localStorage.getItem.mockReturnValue('DE-BW');

    service.setFederalStateCode('DE-BW');

    expect(localStorage.setItem).toHaveBeenCalledExactlyOnceWith(service.FEDERAL_STATE_CODE, 'DE-BW');
    expect(service.getFederalStateCode()).toBe('DE-BW');
  });

  it('stores and retrieves both notifier facility models without removing the key', () => {
    const facility: NotifierFacilityFormModel = { facilityInfo: { institutionName: 'Test laboratory' } };
    const legacyFacility: NotifierFacility = {
      ...TEST_DATA.notifierFacility,
      address: { ...TEST_DATA.notifierFacility.address, addressType: 'current' },
      contact: { ...TEST_DATA.notifierFacility.contact, salutation: 'Mr' },
      contacts: [],
    };

    service.setNotifierFacility(legacyFacility);
    expect(localStorage.setItem).toHaveBeenCalledWith(service.NOTIFIER_FACILITY, legacyFacility);

    service.setNotifierFacilityModel(facility);
    expect(localStorage.setItem).toHaveBeenLastCalledWith(service.NOTIFIER_FACILITY, facility);

    localStorage.getItem.mockReturnValueOnce(legacyFacility).mockReturnValueOnce(facility);
    expect(service.getNotifierFacility()).toBe(legacyFacility);
    expect(service.getNotifierFacilityModel()).toEqual(facility);
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('does not remove notifier facility data when reading it', () => {
    const facility: NotifierFacilityFormModel = { facilityInfo: { institutionName: 'Test laboratory' } };
    localStorage.getItem.mockReturnValue(facility);

    expect(service.getNotifierFacility()).toEqual(facility);
    expect(service.getNotifierFacilityModel()).toEqual(facility);
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('uses separate favorites lists for nominal and non-nominal notifications', () => {
    const nominalFavorites = [pathogen];
    const nonNominalFavorites: CodeDisplay[] = [{ code: 'other', display: 'Other pathogen', designations: [] }];
    localStorage.getItem.mockReturnValueOnce(nominalFavorites).mockReturnValueOnce(nonNominalFavorites);

    expect(service.getFavorites()).toBe(nominalFavorites);
    expect(service.getFavorites(true)).toBe(nonNominalFavorites);
    expect(localStorage.getItem).toHaveBeenNthCalledWith(1, service.PATHOGEN_FAVORITES);
    expect(localStorage.getItem).toHaveBeenNthCalledWith(2, service.PATHOGEN_FAVORITES_7_3);
  });

  it.each([undefined, null, 'invalid', {}, ['invalid'], [null], [{ code: 'missing-display' }]])(
    'resets invalid stored favorites (%s) and notifies listeners',
    invalidFavorites => {
      localStorage.getItem.mockReturnValue(invalidFavorites);
      const listener = vi.fn();
      service.favoritesChanged.subscribe(listener);

      expect(service.getFavorites()).toEqual([]);
      expect(localStorage.setItem).toHaveBeenCalledExactlyOnceWith(service.PATHOGEN_FAVORITES, []);
      expect(listener).toHaveBeenCalledOnce();
    }
  );

  it('persists favorites updates and emits a change for each mutation', () => {
    const favorites = [pathogen];
    const listener = vi.fn();
    service.favoritesChanged.subscribe(listener);

    service.updateFavorites(favorites);
    service.addFavoriteToList(pathogen, true);
    service.removeFavoriteFromList(pathogen);

    expect(localStorage.setItem).toHaveBeenCalledExactlyOnceWith(service.PATHOGEN_FAVORITES, favorites);
    expect(localStorage.addItemToList).toHaveBeenCalledExactlyOnceWith(service.PATHOGEN_FAVORITES_7_3, pathogen);
    expect(localStorage.removeObjectFromList).toHaveBeenCalledExactlyOnceWith(service.PATHOGEN_FAVORITES, pathogen);
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
