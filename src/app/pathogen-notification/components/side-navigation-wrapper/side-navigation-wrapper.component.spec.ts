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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SideNavigationWrapperComponent } from './side-navigation-wrapper.component';
import { PathogenNotificationComponent } from '../../pathogen-notification.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

describe('SideNavigationWrapperComponent', () => {
  let component: SideNavigationWrapperComponent;
  let fixture: ComponentFixture<SideNavigationWrapperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SideNavigationWrapperComponent, NoopAnimationsModule, RouterModule.forRoot([])],
      providers: [{ provide: PathogenNotificationComponent, useValue: {} }],
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
    expect(component.currentStep).toBe(0);
    expect(component.maxNumberOfSteps).toBe(0);
    expect(component.headline).toBe('');
    expect(component.currentStepHeadline).toBe('');
    expect(component.steps).toBeUndefined();
    expect(component.model).toBeUndefined();
  });
});
