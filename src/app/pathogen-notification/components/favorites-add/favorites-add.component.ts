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

import { Component, computed, OnDestroy, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

import { CodeDisplay } from 'src/api/notification';
import { PathogenNotificationStorageService } from '../../services/pathogen-notification-storage.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-favorites-add',
  templateUrl: './favorites-add.component.html',
  styleUrls: ['./favorites-add.component.scss'],
  standalone: true,
  imports: [MatIcon],
})
export class FavoritesAddComponent extends FieldType implements OnInit, OnDestroy {
  pathogen: CodeDisplay;
  maxFavorites: number = 5;
  favorites: WritableSignal<CodeDisplay[]> = signal([]);
  isMaxNumberOfFavorites: Signal<boolean> = computed(() => {
    return this.favorites().length >= this.maxFavorites;
  });
  isPathogenInFavorites: Signal<boolean> = computed(() => {
    return this.favorites().some(fav => fav.code === this.pathogen.code);
  });

  constructor(private pathogenNotificationStorageService: PathogenNotificationStorageService) {
    super();
    this.pathogen = pathogenNotificationStorageService.getSelectedPathogenCodeDisplay();
    this.loadFavorites();
  }

  ngOnInit(): void {
    window.addEventListener('storage', this.onStorageChange.bind(this));
    this.pathogenNotificationStorageService.favoritesChanged.subscribe(() => {
      this.loadFavorites();
    });
  }

  loadFavorites(): void {
    const favorites = this.pathogenNotificationStorageService.getFavorites() || [];
    this.favorites.update(() => favorites);
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === this.pathogenNotificationStorageService.PATHOGEN_FAVORITES) {
      this.loadFavorites();
    }
  }

  addPathogenToFavorites(): void {
    this.pathogenNotificationStorageService.addFavoriteToList(this.pathogen);
    this.loadFavorites();
  }

  removePathogenFromFavorites(): void {
    this.pathogenNotificationStorageService.removeFavoriteFromList(this.pathogen);
    this.loadFavorites();
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.onStorageChange.bind(this));
  }
}
