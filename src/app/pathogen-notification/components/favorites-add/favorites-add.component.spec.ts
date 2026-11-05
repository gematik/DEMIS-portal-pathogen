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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesAddComponent } from './favorites-add.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PathogenNotificationStorageService } from '../../services/pathogen-notification-storage.service';
import { NotificationType } from '../../common/routing-helper';
import { Subject } from 'rxjs';
import { CodeDisplay } from '../../../../api/notification';

describe('FavoritesAddComponent', () => {
  let component: FavoritesAddComponent;
  let fixture: ComponentFixture<FavoritesAddComponent>;
  const pathogen: CodeDisplay = { code: 'test', display: 'Test pathogen', designations: [] };
  const storage = {
    favoritesChanged: new Subject<void>(),
    getSelectedPathogenCodeDisplay: vi.fn(),
    getFavorites: vi.fn(),
    addFavoriteToList: vi.fn(),
    removeFavoriteFromList: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getSelectedPathogenCodeDisplay.mockReturnValue(pathogen);
    storage.getFavorites.mockReturnValue([]);
    TestBed.configureTestingModule({
      imports: [FavoritesAddComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: PathogenNotificationStorageService, useValue: storage }],
    });
    fixture = TestBed.createComponent(FavoritesAddComponent);
    component = fixture.componentInstance;
    component.field = { props: { notificationType: NotificationType.NominalNotification7_1 } };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds and removes the selected pathogen without a legacy component provider', () => {
    component.addPathogenToFavorites();
    expect(storage.addFavoriteToList).toHaveBeenCalledWith(pathogen, false);
    component.removePathogenFromFavorites();
    expect(storage.removeFavoriteFromList).toHaveBeenCalledWith(pathogen, false);
  });

  it('uses the non-nominal favorites for paragraph 7.3', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(FavoritesAddComponent);
    component = fixture.componentInstance;
    component.field = { props: { notificationType: NotificationType.NonNominalNotification7_3 } };
    fixture.detectChanges();
    component.addPathogenToFavorites();
    expect(storage.addFavoriteToList).toHaveBeenCalledWith(pathogen, true);
  });

  it('unsubscribes when destroyed', () => {
    fixture.destroy();
    storage.getFavorites.mockClear();
    storage.favoritesChanged.next();
    expect(storage.getFavorites).not.toHaveBeenCalled();
  });
});
