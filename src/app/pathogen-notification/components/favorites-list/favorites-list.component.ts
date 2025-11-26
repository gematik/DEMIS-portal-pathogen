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

import { Component, OnDestroy, OnInit, signal, WritableSignal, inject } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { CodeDisplay } from 'src/api/notification';
import { getDesignationValueIfAvailable } from '../../legacy/common-utils';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { PathogenNotificationStorageService } from '../../services/pathogen-notification-storage.service';
import { NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-favorites-list',
  templateUrl: './favorites-list.component.html',
  styleUrls: ['./favorites-list.component.scss'],
  imports: [MatButton, MatIconButton, MatIcon, NgTemplateOutlet],
})
export class FavoritesListComponent extends FieldType implements OnInit, OnDestroy {
  private readonly pathogenNotificationStorageService = inject(PathogenNotificationStorageService);
  private readonly pathogenNotificationComponent = inject(PathogenNotificationComponent);

  favorites: WritableSignal<CodeDisplay[]> = signal([]);
  protected readonly getDesignationValueIfAvailable = getDesignationValueIfAvailable;
  private readonly isNonNominalNotification7_3: boolean = false;

  constructor() {
    super();
    this.isNonNominalNotification7_3 = this.pathogenNotificationComponent.isNonNominalNotification7_3();
    this.loadFavorites();
  }

  ngOnInit(): void {
    window.addEventListener('storage', this.onStorageChange.bind(this));
    this.pathogenNotificationStorageService?.favoritesChanged?.subscribe(() => {
      this.loadFavorites();
    });
  }

  loadFavorites(): void {
    const favorites = this.pathogenNotificationStorageService.getFavorites(this.isNonNominalNotification7_3) || [];
    this.favorites.update(() => favorites);
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === this.pathogenNotificationStorageService.PATHOGEN_FAVORITES) {
      this.loadFavorites();
    }
  }

  selectPathogenFromFavorites(pathogen: CodeDisplay): void {
    this.pathogenNotificationComponent.populateWithFavoriteSelection(pathogen);
  }

  removePathogenFromFavorites(pathogen: CodeDisplay): void {
    const updatedFavorites = this.favorites().filter(fav => fav.code !== pathogen.code);
    this.pathogenNotificationStorageService.updateFavorites(updatedFavorites, this.isNonNominalNotification7_3);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.onStorageChange.bind(this));
  }
}
