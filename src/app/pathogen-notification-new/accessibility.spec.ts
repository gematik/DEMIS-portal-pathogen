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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FollowUpNotificationIdService } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { allowedRoutes } from '../pathogen-notification/common/routing-helper';
import { PathogenFormValidationConfig } from '../pathogen-notification/common/pathogen-formly-validation-module';
import { PathogenFormlyConfig } from '../pathogen-notification/formly/configs/formly-app-config';
import { NotificationFormValidationConfig } from '../pathogen-notification/legacy/notification-form-validation-module';
import { ErrorDialogService } from '../pathogen-notification/services/error-dialog.service';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { PathogenFormInfos } from '../pathogen-notification/utils/disclaimer-texts';
import { PathogenNotificationNewComponent } from './pathogen-notification-new.component';

const LANDMARK_SELECTOR = 'header, [role="banner"], main, [role="main"], nav, [role="navigation"], footer, [role="contentinfo"]';
const TOP_LEVEL_LANDMARK_SELECTOR = 'header, [role="banner"], main, [role="main"], footer, [role="contentinfo"]';

describe('Pathogen a11y tests', () => {
  let fixture: ComponentFixture<PathogenNotificationNewComponent>;
  let host: HTMLElement;

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: true });
    await TestBed.configureTestingModule({
      imports: [
        PathogenNotificationNewComponent,
        NoopAnimationsModule,
        FormlyMaterialModule,
        FormlyModule.forRoot({
          ...PathogenFormlyConfig,
          validators: [...NotificationFormValidationConfig.validators, ...PathogenFormValidationConfig.validators],
          extras: NotificationFormValidationConfig.extras,
        }),
      ],
      providers: [
        { provide: Router, useValue: { url: `/${allowedRoutes.nominal}` } },
        {
          provide: FollowUpNotificationIdService,
          useValue: {
            openDialog: vi.fn(),
            closeDialog: vi.fn(),
            resetState: vi.fn(),
            hasValidNotificationId$: of(false),
            followUpNotificationCategory: () => null,
            validatedNotificationId: () => null,
          },
        },
        {
          provide: FhirPathogenNotificationService,
          useValue: {
            fetchCountryCodeDisplays: () => of([{ code: 'DE', display: 'Deutschland', designations: [] }]),
            fetchFederalStateCodeDisplays: () => of([{ code: 'DE-BW', display: 'Baden-Württemberg', designations: [] }]),
            fetchPathogenCodeDisplaysByTypeAndState: () => of([]),
          },
        },
        {
          provide: PathogenNotificationStorageService,
          useValue: {
            getNotifierFacilityModel: vi.fn(),
            setNotifierFacilityModel: vi.fn(),
            getFederalStateCode: () => 'DE-BW',
            setFederalStateCode: vi.fn(),
            removeSelectedPathogenCodeDisplay: vi.fn(),
            getSelectedPathogenCodeDisplay: () => null,
          },
        },
        { provide: ErrorDialogService, useValue: { showBasicClosableErrorDialog: vi.fn() } },
        { provide: NGXLogger, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PathogenNotificationNewComponent);
    host = fixture.nativeElement as HTMLElement;
    await settle();
  });

  it('renders exactly one main landmark that contains the step content', () => {
    const mains = host.querySelectorAll('main, [role="main"]');

    expect(mains).toHaveLength(1);
    expect(mains[0].querySelector('app-notifier-facility')).not.toBeNull();
  });

  it('renders at most one banner landmark', () => {
    expect(host.querySelectorAll('header, [role="banner"]').length).toBeLessThanOrEqual(1);
  });

  it('renders exactly one contentinfo landmark', () => {
    expect(host.querySelectorAll('footer, [role="contentinfo"]')).toHaveLength(1);
  });

  it('labels every navigation landmark uniquely', () => {
    const navigations = [...host.querySelectorAll<HTMLElement>('nav, [role="navigation"]')];
    const labels = navigations.map(nav => nav.getAttribute('aria-label') ?? nav.getAttribute('aria-labelledby'));

    expect(navigations.length).toBeGreaterThan(0);
    expect(labels.every(label => !!label?.trim())).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('does not nest the top level landmarks inside each other', () => {
    const landmarks = [...host.querySelectorAll<HTMLElement>(TOP_LEVEL_LANDMARK_SELECTOR)];

    expect(landmarks.filter(landmark => landmark.parentElement?.closest(LANDMARK_SELECTOR))).toEqual([]);
  });

  it('keeps the landmark structure stable across all steps', async () => {
    const stepCount = fixture.componentInstance.stepsMap().size;

    for (let step = 1; step < stepCount; step++) {
      const stepButtons = host.querySelectorAll<HTMLElement>('gem-demis-process-stepper button');
      stepButtons[step]?.click();
      await settle();

      expect(host.querySelectorAll('main, [role="main"]')).toHaveLength(1);
      expect(host.querySelectorAll('footer, [role="contentinfo"]')).toHaveLength(1);
      expect(host.querySelectorAll('header, [role="banner"]').length).toBeLessThanOrEqual(1);
    }
  });

  it('marks every decorative icon as hidden for assistive technology', () => {
    const icons = [...host.querySelectorAll<HTMLElement>('mat-icon, .material-icons-outlined')];

    expect(icons.length).toBeGreaterThan(0);
    expect(icons.filter(icon => icon.getAttribute('aria-hidden') !== 'true')).toEqual([]);
  });

  it('marks the decorative info icon of every disclaimer as hidden', () => {
    const disclaimers = [
      PathogenFormInfos.insertAllKnownInfosToFulfillReportingObligation,
      PathogenFormInfos.stateSpecificReportingObligations,
      PathogenFormInfos.followUpNotificationSpecificReportingObligations,
      PathogenFormInfos.personalDataWillBeStoredInLocalStorage,
    ];

    disclaimers.forEach(disclaimer => {
      const container = document.createElement('div');
      container.innerHTML = disclaimer;
      const icon = container.querySelector('.material-icons-outlined');

      expect(icon?.textContent).toBe('error_outline');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
