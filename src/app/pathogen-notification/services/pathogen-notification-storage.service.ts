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
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { EventEmitter, Injectable, inject } from '@angular/core';
import { CodeDisplay, NotifierFacility } from '../../../api/notification';
import { LocalStorageService } from '../legacy/services/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class PathogenNotificationStorageService {
  private readonly localStorageService = inject(LocalStorageService);

  public readonly PATHOGEN_CODE_DISPLAY = 'PATHOGEN_CODE_DISPLAY';
  public readonly PATHOGEN_FAVORITES = 'PATHOGEN_FAVORITES';
  public readonly PATHOGEN_FAVORITES_7_3 = 'PATHOGEN_FAVORITES_7_3';
  public readonly FEDERAL_STATE_CODE = 'FEDERAL_STATE_CODE';
  public readonly NOTIFIER_FACILITY = 'NOTIFIER_FACILITY';

  // Event emitter to notify components of changes in the favorites list
  favoritesChanged: EventEmitter<void> = new EventEmitter<void>();

  setSelectedPathogenCodeDisplay(codeDisplay: CodeDisplay): void {
    this.localStorageService.setItem(this.PATHOGEN_CODE_DISPLAY, codeDisplay);
  }

  getSelectedPathogenCodeDisplay(): CodeDisplay {
    return this.localStorageService.getItem(this.PATHOGEN_CODE_DISPLAY);
  }

  removeSelectedPathogenCodeDisplay(): void {
    this.localStorageService.removeItem(this.PATHOGEN_CODE_DISPLAY);
  }

  setFederalStateCode(federalStateCode: string): void {
    this.localStorageService.setItem(this.FEDERAL_STATE_CODE, federalStateCode);
  }

  getFederalStateCode(): string {
    return this.localStorageService.getItem(this.FEDERAL_STATE_CODE);
  }

  setNotifierFacility(notifierFacility: NotifierFacility): void {
    this.localStorageService.setItem(this.NOTIFIER_FACILITY, notifierFacility);
  }

  getNotifierFacility(): NotifierFacility {
    return this.localStorageService.getItem(this.NOTIFIER_FACILITY);
  }

  getFavorites(isNonNominalNotification7_3: boolean = false): CodeDisplay[] {
    const favorites = this.localStorageService.getItem(this.getFavoritesKey(isNonNominalNotification7_3));

    if (
      typeof favorites === 'string' ||
      favorites === undefined ||
      !Array.isArray(favorites) ||
      favorites.some(fav => typeof fav !== 'object' || !fav.code || !fav.display)
    ) {
      this.updateFavorites([], isNonNominalNotification7_3);
      return [];
    }

    return favorites as CodeDisplay[];
  }

  updateFavorites(favorites: CodeDisplay[], isNonNominalNotification7_3: boolean = false) {
    this.localStorageService.setItem(this.getFavoritesKey(isNonNominalNotification7_3), favorites);
    this.favoritesChanged.emit(); // Emit the event when favorites are updated
  }

  addFavoriteToList(favorite: CodeDisplay, isNonNominalNotification7_3: boolean = false): void {
    this.localStorageService.addItemToList(this.getFavoritesKey(isNonNominalNotification7_3), favorite);
    this.favoritesChanged.emit(); // Emit the event when a favorite is added
  }

  removeFavoriteFromList(favorite: CodeDisplay, isNonNominalNotification7_3: boolean = false): void {
    this.localStorageService.removeObjectFromList(this.getFavoritesKey(isNonNominalNotification7_3), favorite);
    this.favoritesChanged.emit(); // Emit the event when a favorite is removed
  }

  private getFavoritesKey(isNonNominalNotification7_3: boolean): string {
    return isNonNominalNotification7_3 ? this.PATHOGEN_FAVORITES_7_3 : this.PATHOGEN_FAVORITES;
  }
}
