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

import { Component, Input } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { MatToolbar } from '@angular/material/toolbar';
import { PasteBoxComponent } from '../../legacy/components/paste-box/paste-box.component';
import { HexhexbuttonComponent } from '../../legacy/components/hexhexbutton/hexhexbutton.component';
import { SideNavigationStepperComponent } from '../side-navigation-stepper/side-navigation-stepper.component';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-navigation-wrapper',
  templateUrl: './side-navigation-wrapper.component.html',
  styleUrls: ['./side-navigation-wrapper.component.scss'],
  standalone: true,
  imports: [MatDrawerContainer, MatDrawer, SideNavigationStepperComponent, HexhexbuttonComponent, PasteBoxComponent, MatDrawerContent, MatToolbar],
})
export class SideNavigationWrapperComponent {
  @Input() currentStep = 0;
  @Input() maxNumberOfSteps = 0;
  @Input() headline = '';
  @Input() currentStepHeadline = '';
  @Input() steps: FormlyFieldConfig[];
  @Input() model: any;

  constructor(private pathogenNotificationComponent: PathogenNotificationComponent) {}

  async handlePasteBoxClick(): Promise<void> {
    await this.pathogenNotificationComponent.populatePathogenFormWithClipboardData(true);
  }

  async handleHexhexButtonClick(): Promise<void> {
    this.pathogenNotificationComponent.populatePathogenFormWithHexHexData();
  }
}
