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

import { Component, computed, Signal } from '@angular/core';

import { CodeDisplay } from 'src/api/notification';
import { MatIcon } from '@angular/material/icon';
import { FavoritesFieldBase } from '../favorites-field.base';

@Component({
  selector: 'app-favorites-add',
  templateUrl: './favorites-add.component.html',
  styleUrls: ['./favorites-add.component.scss'],
  imports: [MatIcon],
})
export class FavoritesAddComponent extends FavoritesFieldBase {
  pathogen: CodeDisplay;
  maxFavorites = 5;
  isMaxNumberOfFavorites: Signal<boolean> = computed(() => {
    return this.favorites().length >= this.maxFavorites;
  });
  isPathogenInFavorites: Signal<boolean> = computed(() => {
    return this.favorites().some(fav => fav.code === this.pathogen.code);
  });
  override ngOnInit(): void {
    this.pathogen = this.pathogenNotificationStorageService.getSelectedPathogenCodeDisplay();
    super.ngOnInit();
  }

  addPathogenToFavorites(): void {
    this.pathogenNotificationStorageService.addFavoriteToList(this.pathogen, this.isNonNominalNotification7_3);
    this.loadFavorites();
  }

  removePathogenFromFavorites(): void {
    this.pathogenNotificationStorageService.removeFavoriteFromList(this.pathogen, this.isNonNominalNotification7_3);
    this.loadFavorites();
  }
}
