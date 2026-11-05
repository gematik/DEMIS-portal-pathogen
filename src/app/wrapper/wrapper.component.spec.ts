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

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { PathogenNotificationNewComponent } from '../pathogen-notification-new/pathogen-notification-new.component';
import { PathogenNotificationComponent } from '../pathogen-notification/pathogen-notification.component';
import { WrapperComponent } from './wrapper.component';

@Component({ selector: 'app-pathogen-notification-new', template: '' })
class PathogenNotificationNewStubComponent {}

@Component({ selector: 'app-pathogen-notification', template: '' })
class PathogenNotificationStubComponent {}

describe('WrapperComponent', () => {
  let fixture: ComponentFixture<WrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WrapperComponent] })
      .overrideComponent(WrapperComponent, {
        remove: { imports: [PathogenNotificationNewComponent, PathogenNotificationComponent] },
        add: { imports: [PathogenNotificationNewStubComponent, PathogenNotificationStubComponent] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(WrapperComponent);
  });

  it('renders only the new notification form when the feature flag is enabled', () => {
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: true });
    fixture.detectChanges();

    expect(fixture.componentInstance.isCoreSidenavEnabled).toBe(true);
    expect(fixture.debugElement.query(By.directive(PathogenNotificationNewStubComponent))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationStubComponent))).toBeNull();
  });

  it('renders only the legacy notification form when the feature flag is disabled', () => {
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: false });
    fixture.detectChanges();

    expect(fixture.componentInstance.isCoreSidenavEnabled).toBe(false);
    expect(fixture.debugElement.query(By.directive(PathogenNotificationStubComponent))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationNewStubComponent))).toBeNull();
  });

  it.each([{}, undefined])('renders the legacy notification form when the flag is absent (%j)', flags => {
    vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue(flags);
    fixture.detectChanges();

    expect(fixture.componentInstance.isCoreSidenavEnabled).toBeUndefined();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationStubComponent))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationNewStubComponent))).toBeNull();
  });

  it('switches the rendered form when the feature flag changes', () => {
    const featureFlags = vi.spyOn(environment, 'featureFlags', 'get').mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: false });
    fixture.detectChanges();

    featureFlags.mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: true });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationNewStubComponent))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationStubComponent))).toBeNull();

    featureFlags.mockReturnValue({ FEATURE_FLAG_CORE_SIDENAV: false });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationStubComponent))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(PathogenNotificationNewStubComponent))).toBeNull();
  });
});
