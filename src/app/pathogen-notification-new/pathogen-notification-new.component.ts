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

import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { createStepContent, MaxHeightContentContainerComponent, provideStepNavigation, SideNavigationComponent } from '@gematik/demis-portal-core-library';
import { getStepData } from './step-data';
import { FormlyModule } from '@ngx-formly/core';
import { PathogenNotificationService } from './pathogen-notification.service';
import { NotifierFacilityComponent } from './notifier-facility/notifier-facility.component';
import { SubmittingFacilityComponent } from './submitting-facility/submitting-facility.component';
import { NotifiedPersonComponent } from './notified-person/notified-person.component';
import { NotificationCategoryComponent } from './notification-category/notification-category.component';
import { PathogenDiagnosticComponent } from './pathogen-diagnostic/pathogen-diagnostic.component';
import { getNotificationTypeByRouterUrl, NotificationType } from '../pathogen-notification/common/routing-helper';
import { Router } from '@angular/router';
import { isAnonymousNotificationEnabled } from '../pathogen-notification/utils/pathogen-notification-mapper';

@Component({
  selector: 'app-pathogen-notification-new',
  imports: [MaxHeightContentContainerComponent, SideNavigationComponent, FormlyModule],
  providers: [provideStepNavigation()],
  templateUrl: './pathogen-notification-new.component.html',
  styleUrls: ['./pathogen-notification-new.component.scss'],
})
export class PathogenNotificationNewComponent implements OnInit, OnDestroy {
  readonly pathogenNotificationService = inject(PathogenNotificationService);
  readonly router = inject(Router);
  notificationType = NotificationType.NominalNotification7_1;

  private readonly stepContents = computed(() => [
    createStepContent({ component: NotifierFacilityComponent }),
    createStepContent({ component: SubmittingFacilityComponent }),
    createStepContent({ component: NotifiedPersonComponent }),
    createStepContent({ component: NotificationCategoryComponent }),
    createStepContent({ component: PathogenDiagnosticComponent }),
  ]);

  /**
   * Maps process steps to their corresponding content components
   */
  public readonly stepsMap = computed(() => {
    return new Map(getStepData(this.pathogenNotificationService).map((step, index) => [step, this.stepContents()[index]]));
  });

  ngOnInit(): void {
    // no validation errors should be shown when first visiting the component
    this.pathogenNotificationService.resetVisitedFlags();
    this.notificationType = getNotificationTypeByRouterUrl(this.router.url);
    this.pathogenNotificationService.initialize(this.notificationType);
  }

  ngOnDestroy(): void {
    this.pathogenNotificationService.cancelPendingInitialization();
  }

  // hex hex
  //clipboard
  protected readonly isAnonymousNotificationEnabled = isAnonymousNotificationEnabled;

  readonly headingTitle = computed(() => {
    switch (this.notificationType) {
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
    switch (this.notificationType) {
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
