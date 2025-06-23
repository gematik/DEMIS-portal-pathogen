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

import { Component, inject, Input } from '@angular/core';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { PasteBoxComponent } from '@gematik/demis-portal-core-library';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from 'src/environments/environment';
import { HexhexbuttonComponent } from '../../legacy/components/hexhexbutton/hexhexbutton.component';
import { PasteBoxComponent as DeprecatedPasteBoxComponent } from '../../legacy/components/paste-box/paste-box.component';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { SideNavigationStepperComponent } from '../side-navigation-stepper/side-navigation-stepper.component';
import { ClipboardDataService } from '../../services/clipboard-data.service';
import { Router } from '@angular/router';
import { getNotificationTypeByRouterUrl, NotificationType } from '../../common/routing-helper';

@Component({
  selector: 'app-side-navigation-wrapper',
  templateUrl: './side-navigation-wrapper.component.html',
  styleUrls: ['./side-navigation-wrapper.component.scss'],
  standalone: true,
  imports: [
    MatDrawerContainer,
    MatDrawer,
    SideNavigationStepperComponent,
    HexhexbuttonComponent,
    DeprecatedPasteBoxComponent,
    MatDrawerContent,
    PasteBoxComponent,
  ],
})
export class SideNavigationWrapperComponent {
  @Input() currentStep = 0;
  @Input() maxNumberOfSteps = 0;
  @Input() currentStepHeadline = '';
  @Input() steps: FormlyFieldConfig[];
  @Input() model: any;
  notificationType = NotificationType.NominalNotification7_1;
  readonly router = inject(Router);

  private readonly clipboardDataService = inject(ClipboardDataService);

  constructor(private pathogenNotificationComponent: PathogenNotificationComponent) {
    this.notificationType = getNotificationTypeByRouterUrl(this.router.url);
  }

  // TODO: Remove this getter, once FEATURE_FLAG_PORTAL_PASTEBOX will be removed
  get FEATURE_FLAG_PORTAL_PASTEBOX() {
    return environment.featureFlags?.FEATURE_FLAG_PORTAL_PASTEBOX ?? false;
  }

  get FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER() {
    return environment.featureFlags?.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER ?? false;
  }

  async handlePasteBoxClick(clipboardData?: Map<string, string>): Promise<void> {
    debugger;
    if (this.FEATURE_FLAG_PORTAL_PASTEBOX) {
      if (this.FEATURE_FLAG_PORTAL_PATHOGEN_DATEPICKER) {
        const normalizedData = this.clipboardDataService.normalizeClipboardData(clipboardData);
        this.clipboardDataService.clipboardData.set(Array.from(normalizedData.entries()) as string[][]);
      } else {
        this.clipboardDataService.clipboardData.set(Array.from(clipboardData.entries()) as string[][]);
      }
    }
    await this.pathogenNotificationComponent.populatePathogenFormWithClipboardData(true);
  }

  async handleHexhexButtonClick(): Promise<void> {
    this.pathogenNotificationComponent.populatePathogenFormWithHexHexData();
  }

  protected readonly NotificationType = NotificationType;
}
