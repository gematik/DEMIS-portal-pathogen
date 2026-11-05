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

import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MaxHeightContentContainerComponent, ProcessStep, SideNavigationComponent, StepContent } from '@gematik/demis-portal-core-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { allowedRoutes, NotificationType } from '../pathogen-notification/common/routing-helper';
import { NotifiedPersonComponent } from './notified-person/notified-person.component';
import { NotifierFacilityComponent } from './notifier-facility/notifier-facility.component';
import { NotificationCategoryComponent } from './notification-category/notification-category.component';
import { PathogenDiagnosticComponent } from './pathogen-diagnostic/pathogen-diagnostic.component';
import { PathogenNotificationNewComponent } from './pathogen-notification-new.component';
import { PathogenNotificationService } from './pathogen-notification.service';
import { getStepData } from './step-data';
import { SubmittingFacilityComponent } from './submitting-facility/submitting-facility.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Stub must match the library selector.
  selector: 'gem-demis-max-height-content-container',
  template: '<ng-content />',
})
class MaxHeightContentContainerStubComponent {
  readonly elementSelectorsToSubtract = input<string[]>([]);
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Stub must match the library selector.
  selector: 'gem-demis-side-navigation',
  template: '',
})
class SideNavigationStubComponent {
  readonly sideNavTitle = input<string>();
  readonly stepsMap = input.required<Map<ProcessStep, StepContent>>();
}

describe('PathogenNotificationNewComponent', () => {
  let fixture: ComponentFixture<PathogenNotificationNewComponent>;
  let service: {
    notifierFacilityGroup: FormGroup;
    submittingFacilityGroup: FormGroup;
    notifiedPersonGroup: FormGroup;
    notificationCategoryGroup: FormGroup;
    pathogenDTOGroup: FormGroup;
    resetVisitedFlags: ReturnType<typeof vi.fn>;
    initialize: ReturnType<typeof vi.fn>;
    cancelPendingInitialization: ReturnType<typeof vi.fn>;
  };
  let router: { url: string };

  beforeEach(async () => {
    service = {
      notifierFacilityGroup: new FormGroup({}),
      submittingFacilityGroup: new FormGroup({}),
      notifiedPersonGroup: new FormGroup({}),
      notificationCategoryGroup: new FormGroup({}),
      pathogenDTOGroup: new FormGroup({}),
      resetVisitedFlags: vi.fn(),
      initialize: vi.fn(),
      cancelPendingInitialization: vi.fn(),
    };
    router = { url: `/${allowedRoutes.nominal}` };
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({
      FEATURE_FLAG_NON_NOMINAL_NOTIFICATION: true,
      FEATURE_FLAG_ANONYMOUS_NOTIFICATION: true,
      FEATURE_FLAG_FOLLOW_UP_7_3: true,
    });
    await TestBed.configureTestingModule({
      imports: [PathogenNotificationNewComponent],
      providers: [
        { provide: PathogenNotificationService, useValue: service },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(PathogenNotificationNewComponent, {
        remove: { imports: [MaxHeightContentContainerComponent, SideNavigationComponent] },
        add: { imports: [MaxHeightContentContainerStubComponent, SideNavigationStubComponent] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(PathogenNotificationNewComponent);
  });

  it.each([
    [allowedRoutes.nominal, NotificationType.NominalNotification7_1],
    [allowedRoutes.followUp, NotificationType.FollowUpNotification7_1],
    [allowedRoutes.nonNominal, NotificationType.NonNominalNotification7_3],
    [allowedRoutes.anonymous, NotificationType.AnonymousNotification7_3],
    [allowedRoutes.followUpNonNominal, NotificationType.FollowUpNotification7_3],
  ])('initializes the notification type for route %s', (route, notificationType) => {
    router.url = `/${route}`;
    fixture.detectChanges();

    expect(service.initialize).toHaveBeenCalledExactlyOnceWith(notificationType);
    expect(service.resetVisitedFlags).toHaveBeenCalledOnce();
    expect(service.resetVisitedFlags.mock.invocationCallOrder[0]).toBeLessThan(service.initialize.mock.invocationCallOrder[0]);
  });

  it('falls back to the nominal notification for an unknown route', () => {
    router.url = '/unknown';
    fixture.detectChanges();

    expect(service.initialize).toHaveBeenCalledExactlyOnceWith(NotificationType.NominalNotification7_1);
  });

  it.each([
    [allowedRoutes.nominal, 'Erregernachweis (§ 7.1)', 'Meldung eines Erregernachweises gemäß § 7 Abs. 1 IfSG'],
    [allowedRoutes.followUp, 'Folgemeldung', 'Meldung eines Nachweises von Krankheitserregern gemäß § 7 Abs. 1 IfSG ohne Angaben von Personendaten'],
    [allowedRoutes.nonNominal, 'Erregernachweis', 'Meldung eines Nachweises von Krankheitserregern gemäß § 7 Abs. 3 IfSG ohne Angaben von Personendaten'],
    [allowedRoutes.anonymous, 'Erregernachweis (anonym)', 'Meldung eines Erregernachweises einer anonymen Testung gemäß § 7 Abs. 3 IfSG'],
    [
      allowedRoutes.followUpNonNominal,
      'Folgemeldung (§ 7.3)',
      'Meldung eines Nachweises von Krankheitserregern gemäß § 7 Abs. 3 IfSG ohne Angaben von Personendaten',
    ],
  ])('sets the heading for route %s', (route, title, description) => {
    router.url = `/${route}`;
    fixture.detectChanges();

    expect(fixture.componentInstance.headingTitle()).toBe(title);
    expect(fixture.componentInstance.headingDescription()).toBe(description);
  });

  it.each([allowedRoutes.nonNominal, allowedRoutes.anonymous, allowedRoutes.followUpNonNominal])(
    'does not initialize a feature-gated notification when its flags are disabled (%s)',
    route => {
      vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({});
      router.url = `/${route}`;
      fixture.detectChanges();

      expect(service.initialize).toHaveBeenCalledExactlyOnceWith(NotificationType.NominalNotification7_1);
    }
  );

  it('does not repeat initialization on subsequent change detection', () => {
    fixture.detectChanges();
    fixture.detectChanges();

    expect(service.initialize).toHaveBeenCalledOnce();
    expect(service.resetVisitedFlags).toHaveBeenCalledOnce();
  });

  it('cancels pending service requests when destroyed', () => {
    fixture.destroy();

    expect(service.cancelPendingInitialization).toHaveBeenCalledOnce();
  });

  it('maps all five steps to the corresponding content components in workflow order', () => {
    const entries = [...fixture.componentInstance.stepsMap()];
    const components = [
      NotifierFacilityComponent,
      SubmittingFacilityComponent,
      NotifiedPersonComponent,
      NotificationCategoryComponent,
      PathogenDiagnosticComponent,
    ];
    const groups = [
      service.notifierFacilityGroup,
      service.submittingFacilityGroup,
      service.notifiedPersonGroup,
      service.notificationCategoryGroup,
      service.pathogenDTOGroup,
    ];

    expect(entries.map(([step]) => step)).toEqual(getStepData(fixture.componentInstance.pathogenNotificationService));
    expect(entries.map(([, content]) => content.component)).toEqual(components);
    entries.forEach(([step], index) => expect(step.control).toBe(groups[index]));
    expect(fixture.componentInstance.stepsMap()).toBe(fixture.componentInstance.stepsMap());
  });

  it('passes the step map and layout configuration to the child components', () => {
    fixture.detectChanges();
    const sideNavigation = fixture.debugElement.query(By.directive(SideNavigationStubComponent)).componentInstance as SideNavigationStubComponent;
    const container = fixture.debugElement.query(By.directive(MaxHeightContentContainerStubComponent))
      .componentInstance as MaxHeightContentContainerStubComponent;

    expect(sideNavigation.stepsMap()).toBe(fixture.componentInstance.stepsMap());
    expect(sideNavigation.sideNavTitle()).toBe('Erregernachweis (§ 7.1)');
    expect(container.elementSelectorsToSubtract()).toEqual(['app-navbar']);
  });
});
