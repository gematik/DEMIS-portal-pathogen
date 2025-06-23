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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

/**
 * @deprecated Use PasteBoxComponent from @gematik/demis-portal-core-library instead
 *
 * TODO: Remove this component, once FEATURE_FLAG_PORTAL_PASTEBOX will be removed
 */
@Component({
  selector: 'app-paste-box',
  templateUrl: './paste-box.component.html',
  styleUrls: ['./paste-box.component.scss'],
  standalone: true,
  imports: [MatButton, MatIcon],
})
export class PasteBoxComponent {
  @Output() paste = new EventEmitter<void>();
  @Input() buttonId!: string;

  doPaste() {
    this.paste.emit();
  }
}
