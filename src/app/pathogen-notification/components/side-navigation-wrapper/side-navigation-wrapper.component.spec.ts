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
    For additional notes and disclaimer from gematik and in case of changes by gematik,
    find details in the "Readme" file.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SideNavigationWrapperComponent } from './side-navigation-wrapper.component';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { MockProvider } from 'ng-mocks';
import { NGXLogger } from 'ngx-logger';

describe('SideNavigationWrapperComponent', () => {
  let component: SideNavigationWrapperComponent;
  let fixture: ComponentFixture<SideNavigationWrapperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SideNavigationWrapperComponent, NoopAnimationsModule, RouterModule.forRoot([])],
      providers: [{ provide: PathogenNotificationComponent, useValue: {} }, MockProvider(NGXLogger)],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavigationWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values for inputs', () => {
    expect(component.currentStep()).toBe(0);
    expect(component.maxNumberOfSteps()).toBe(0);
    expect(component.currentStepHeadline()).toBe('');
    expect(component.steps()).toBeUndefined();
    expect(component.model()).toBeUndefined();
  });
});
