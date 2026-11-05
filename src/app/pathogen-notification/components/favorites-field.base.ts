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

import { Directive, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { Subject, takeUntil } from 'rxjs';
import { CodeDisplay } from '../../../api/notification';
import { PathogenNotificationStorageService } from '../services/pathogen-notification-storage.service';
import { isNonNominalNotification } from '../utils/pathogen-notification-mapper';
import { FavoritesFieldConfig } from './favorites-field.config';

@Directive()
export abstract class FavoritesFieldBase extends FieldType<FavoritesFieldConfig> implements OnInit, OnDestroy {
  protected readonly pathogenNotificationStorageService = inject(PathogenNotificationStorageService);
  protected isNonNominalNotification7_3 = false;
  private readonly destroy$ = new Subject<void>();
  private readonly storageListener = (event: StorageEvent) => this.onStorageChange(event);

  favorites: WritableSignal<CodeDisplay[]> = signal([]);

  ngOnInit(): void {
    this.isNonNominalNotification7_3 = isNonNominalNotification(this.props.notificationType);
    this.loadFavorites();
    globalThis.addEventListener('storage', this.storageListener);
    this.pathogenNotificationStorageService.favoritesChanged.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadFavorites());
  }

  loadFavorites(): void {
    this.favorites.set(this.pathogenNotificationStorageService.getFavorites(this.isNonNominalNotification7_3) || []);
  }

  onStorageChange(event: StorageEvent): void {
    if (event.key === this.pathogenNotificationStorageService.PATHOGEN_FAVORITES) {
      this.loadFavorites();
    }
  }

  ngOnDestroy(): void {
    globalThis.removeEventListener('storage', this.storageListener);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
