/*
 Copyright (c) 2025 gematik GmbH
 Licensed under the EUPL, Version 1.2 or - as soon they will be approved by
 the European Commission - subsequent versions of the EUPL (the "Licence");
 You may not use this work except in compliance with the Licence.
    You may obtain a copy of the Licence at:
    https://joinup.ec.europa.eu/software/page/eupl
        Unless required by applicable law or agreed to in writing, software
 distributed under the Licence is distributed on an "AS IS" basis,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the Licence for the specific language governing permissions and
 limitations under the Licence.
 */

import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { assetUrl } from '../../../single-spa/asset-url';

@Injectable({
  providedIn: 'root',
})
export class IconLoaderService {
  private readonly ICON_FOLDER_PATH = assetUrl('icons/');

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {}

  init(): Promise<void> {
    return new Promise(resolve => {
      this.matIconRegistry.addSvgIcon('arrow-right', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}arrow--right.svg`));
      this.matIconRegistry.addSvgIcon('arrow-left', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}arrow--left.svg`));
      this.matIconRegistry.addSvgIcon('demis', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}demis.svg`));
      this.matIconRegistry.addSvgIcon('user', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}user.svg`));
      this.matIconRegistry.addSvgIcon('pin', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}pin.svg`));
      this.matIconRegistry.addSvgIcon('pin-filled', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}pin_filled.svg`));
      this.matIconRegistry.addSvgIcon('checkmark-outline', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}checkmark-outline.svg`));
      this.matIconRegistry.addSvgIcon('circle-dash', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}circle-dash.svg`));
      this.matIconRegistry.addSvgIcon('send', this.domSanitizer.bypassSecurityTrustResourceUrl(`${this.ICON_FOLDER_PATH}send-button.svg`));
      resolve();
    });
  }
}
