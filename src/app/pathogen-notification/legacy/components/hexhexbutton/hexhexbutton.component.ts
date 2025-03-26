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
