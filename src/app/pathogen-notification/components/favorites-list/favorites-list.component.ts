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

import { Component } from '@angular/core';
import { CodeDisplay } from 'src/api/notification';
import { getDesignationValueIfAvailable } from '../../legacy/common-utils';
import { NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { FavoritesFieldBase } from '../favorites-field.base';

@Component({
  selector: 'app-favorites-list',
  templateUrl: './favorites-list.component.html',
  styleUrls: ['./favorites-list.component.scss'],
  imports: [MatButton, MatIconButton, MatIcon, NgTemplateOutlet],
})
export class FavoritesListComponent extends FavoritesFieldBase {
  protected readonly getDesignationValueIfAvailable = getDesignationValueIfAvailable;

  selectPathogenFromFavorites(pathogen: CodeDisplay): void {
    if (!this.props.selectPathogen) {
      throw new Error('Favorites list requires a selectPathogen callback.');
    }
    this.props.selectPathogen(pathogen);
  }

  removePathogenFromFavorites(pathogen: CodeDisplay): void {
    const updatedFavorites = this.favorites().filter(fav => fav.code !== pathogen.code);
    this.pathogenNotificationStorageService.updateFavorites(updatedFavorites, this.isNonNominalNotification7_3);
  }
}
