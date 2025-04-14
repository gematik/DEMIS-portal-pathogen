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

import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-hexhexbutton',
  templateUrl: './hexhexbutton.component.html',
  styleUrls: ['./hexhexbutton.component.scss'],
  standalone: true,
})
export class HexhexbuttonComponent {
  @Output() paste = new EventEmitter<void>();

  constructor(private targetElement: ElementRef) {
    this.targetElement.nativeElement.classList.add('hexhexbutton');
  }

  @HostListener('click') animate() {
    const button = this.targetElement.nativeElement.querySelector('.hexhexbutton');
    if (button) {
      button.classList.remove('animate');
      setTimeout(() => {
        button.classList.add('animate');
      }, 10); // Short timeout to ensure the class is removed and added again
    }
  }

  doPaste() {
    this.paste.emit();
  }

  showHexHex(): boolean {
    return !environment.isProduction;
  }
}
