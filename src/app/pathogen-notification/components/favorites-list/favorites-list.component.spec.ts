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

import { FavoritesListComponent } from './favorites-list.component';
import { PathogenNotificationStorageService } from '../../services/pathogen-notification-storage.service';
import { NotificationType } from '../../common/routing-helper';
import { Subject } from 'rxjs';
import { CodeDisplay } from '../../../../api/notification';

describe('FavoritesListComponent', () => {
  let component: FavoritesListComponent;
  let fixture: ComponentFixture<FavoritesListComponent>;
  const pathogen: CodeDisplay = { code: 'test', display: 'Test pathogen', designations: [] };
  const selectPathogen = vi.fn();
  const storage = {
    PATHOGEN_FAVORITES: 'PATHOGEN_FAVORITES',
    favoritesChanged: new Subject<void>(),
    getFavorites: vi.fn(),
    updateFavorites: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    storage.getFavorites.mockReturnValue([pathogen]);
    TestBed.configureTestingModule({
      imports: [FavoritesListComponent],
      providers: [{ provide: PathogenNotificationStorageService, useValue: storage }],
    });
    fixture = TestBed.createComponent(FavoritesListComponent);
    component = fixture.componentInstance;
    component.field = { props: { notificationType: NotificationType.NominalNotification7_1, selectPathogen } };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(storage.getFavorites).toHaveBeenCalledWith(false);
  });

  it('selects favorites through the supplied callback without a legacy component provider', () => {
    fixture.nativeElement.querySelector('.favorites-button').click();
    expect(selectPathogen).toHaveBeenCalledWith(pathogen);
  });

  it('removes favorites from the corresponding list', () => {
    component.removePathogenFromFavorites(pathogen);
    expect(storage.updateFavorites).toHaveBeenCalledWith([], false);
  });

  it('uses the non-nominal favorites for paragraph 7.3', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(FavoritesListComponent);
    component = fixture.componentInstance;
    component.field = { props: { notificationType: NotificationType.AnonymousNotification7_3, selectPathogen } };
    fixture.detectChanges();
    expect(storage.getFavorites).toHaveBeenLastCalledWith(true);
  });

  it('unsubscribes when destroyed', () => {
    fixture.destroy();
    storage.getFavorites.mockClear();
    storage.favoritesChanged.next();
    expect(storage.getFavorites).not.toHaveBeenCalled();
  });

  it('reloads favorites when they change in the current tab', () => {
    storage.getFavorites.mockReturnValue([]);
    storage.favoritesChanged.next();
    expect(component.favorites()).toEqual([]);
  });

  it('reloads favorites for matching storage events only', () => {
    storage.getFavorites.mockClear();
    globalThis.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    expect(storage.getFavorites).not.toHaveBeenCalled();
    storage.getFavorites.mockReturnValue([]);
    globalThis.dispatchEvent(new StorageEvent('storage', { key: storage.PATHOGEN_FAVORITES }));
    expect(storage.getFavorites).toHaveBeenCalledOnce();
    expect(component.favorites()).toEqual([]);
  });

  it('removes the storage listener when destroyed', () => {
    fixture.destroy();
    storage.getFavorites.mockClear();
    globalThis.dispatchEvent(new StorageEvent('storage', { key: storage.PATHOGEN_FAVORITES }));
    expect(storage.getFavorites).not.toHaveBeenCalled();
  });
});
