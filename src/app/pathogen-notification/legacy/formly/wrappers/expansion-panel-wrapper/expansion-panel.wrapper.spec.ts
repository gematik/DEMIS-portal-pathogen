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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpansionPanelWrapperComponent } from './expansion-panel.wrapper';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

describe('ExpansionPanelWrapperComponent', () => {
  let component: ExpansionPanelWrapperComponent;
  let fixture: ComponentFixture<ExpansionPanelWrapperComponent>;

  const field = {
    parent: {
      parent: {
        fieldGroup: [{ fieldGroup: [{ props: { isClosed: false } }] }, { fieldGroup: [{ props: { isClosed: false } }] }],
      },
    },
    props: { isClosed: true },
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpansionPanelWrapperComponent, NoopAnimationsModule, RouterModule.forRoot([])],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionPanelWrapperComponent);
    component = fixture.componentInstance;
    component.field = field;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close open panels and open clicked panel on handlePanelClosingOnOpen click', () => {
    component.handlePanelClosingOnOpen(field);
    expect(field.parent.parent.fieldGroup[0].fieldGroup[0].props.isClosed).toBeTrue();
    expect(field.parent.parent.fieldGroup[1].fieldGroup[0].props.isClosed).toBeTrue();
    expect(field.props.isClosed).toBeFalse();
  });
});
