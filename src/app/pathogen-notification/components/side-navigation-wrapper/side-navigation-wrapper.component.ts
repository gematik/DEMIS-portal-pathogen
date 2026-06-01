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

import { Component, computed, inject, input, signal } from '@angular/core';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { FormsFooterComponent, PasteBoxComponent, SectionHeaderComponent } from '@gematik/demis-portal-core-library';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { environment } from 'src/environments/environment';
import { HexhexbuttonComponent } from '../../legacy/components/hexhexbutton/hexhexbutton.component';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { SideNavigationStepperComponent } from '../side-navigation-stepper/side-navigation-stepper.component';
import { ClipboardDataService } from '../../services/clipboard-data.service';
import { Router } from '@angular/router';
import { getNotificationTypeByRouterUrl, NotificationType } from '../../common/routing-helper';
import { isAnonymousNotificationEnabled } from '../../utils/pathogen-notification-mapper';

@Component({
  selector: 'app-side-navigation-wrapper',
  templateUrl: './side-navigation-wrapper.component.html',
  styleUrls: ['./side-navigation-wrapper.component.scss'],
  imports: [
    MatDrawerContainer,
    MatDrawer,
    SideNavigationStepperComponent,
    HexhexbuttonComponent,
    MatDrawerContent,
    PasteBoxComponent,
    SectionHeaderComponent,
    FormsFooterComponent,
  ],
})
export class SideNavigationWrapperComponent {
  private readonly pathogenNotificationComponent = inject(PathogenNotificationComponent);

  readonly currentStep = input(0);
  readonly currentStepHeadline = input('');
  readonly steps = input<FormlyFieldConfig[]>(undefined);
  readonly model = input<any>(undefined);
  notificationType = signal(NotificationType.NominalNotification7_1);
  readonly router = inject(Router);

  private readonly clipboardDataService = inject(ClipboardDataService);

  constructor() {
    this.notificationType.set(getNotificationTypeByRouterUrl(this.router.url));
  }

  public get FEATURE_FLAG_PORTAL_HEADER_FOOTER(): boolean {
    return environment.featureFlags?.FEATURE_FLAG_PORTAL_HEADER_FOOTER;
  }

  public get FEATURE_FLAG_PORTAL_ACCESSIBILITY(): boolean {
    return environment.featureFlags?.FEATURE_FLAG_PORTAL_ACCESSIBILITY;
  }

  public get FEATURE_FLAG_FOOTER_LINKS_CORRECTION(): boolean {
    return environment.featureFlags?.FEATURE_FLAG_FOOTER_LINKS_CORRECTION ?? false;
  }

  async handlePasteBoxClick(clipboardData?: Map<string, string>): Promise<void> {
    this.clipboardDataService.clipboardData.set(Array.from(clipboardData.entries()) as string[][]);
    await this.pathogenNotificationComponent.populatePathogenFormWithClipboardData(true);
  }

  async handleHexhexButtonClick(): Promise<void> {
    this.pathogenNotificationComponent.populatePathogenFormWithHexHexData();
  }

  protected readonly NotificationType = NotificationType;
  protected readonly isAnonymousNotificationEnabled = isAnonymousNotificationEnabled;

  readonly headingTitle = computed(() => {
    switch (this.notificationType()) {
      case NotificationType.NominalNotification7_1:
        return 'Erregernachweis (§ 7.1)';
      case NotificationType.NonNominalNotification7_3:
        return 'Erregernachweis';
      case NotificationType.FollowUpNotification7_1:
        return 'Folgemeldung';
      case NotificationType.AnonymousNotification7_3:
        return this.isAnonymousNotificationEnabled() ? 'Erregernachweis (anonym)' : '';
      case NotificationType.FollowUpNotification7_3:
        return 'Folgemeldung (§ 7.3)';
      default:
        return 'Erregernachweis';
    }
  });

  readonly headingDescription = computed(() => {
    switch (this.notificationType()) {
      case NotificationType.NominalNotification7_1:
        return 'Meldung eines Erregernachweises gemäß § 7 Abs. 1 IfSG';
      case NotificationType.NonNominalNotification7_3:
        return 'Meldung eines Nachweises von Krankheitserregern gemäß § 7 Abs. 3 IfSG ohne Angaben von Personendaten';
      case NotificationType.FollowUpNotification7_1:
        return 'Meldung eines Nachweises von Krankheitserregern gemäß § 7 Abs. 1 IfSG ohne Angaben von Personendaten';
      case NotificationType.FollowUpNotification7_3:
        return 'Meldung eines Nachweises von Krankheitserregern gemäß § 7 Abs. 3 IfSG ohne Angaben von Personendaten';
      case NotificationType.AnonymousNotification7_3:
        return 'Meldung eines Erregernachweises einer anonymen Testung gemäß § 7 Abs. 3 IfSG';
      default:
        return '';
    }
  });
}
