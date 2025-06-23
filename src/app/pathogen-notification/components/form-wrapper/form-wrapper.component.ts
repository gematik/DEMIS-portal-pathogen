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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FieldType, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { SideNavigationWrapperComponent } from '../side-navigation-wrapper/side-navigation-wrapper.component';
import { MaxHeightContentContainerComponent } from '@gematik/demis-portal-core-library';

@Component({
  selector: 'app-form-wrapper',
  templateUrl: './form-wrapper.component.html',
  styleUrls: ['./form-wrapper.component.scss'],
  standalone: true,
  imports: [
    SideNavigationWrapperComponent,
    MatTabGroup,
    MatTab,
    FormlyModule,
    MatToolbar,
    MatToolbarRow,
    RouterLink,
    MatButton,
    MatIcon,
    MaxHeightContentContainerComponent,
  ],
})
export class FormWrapperComponent extends FieldType implements OnInit {
  selectedIndex = 0;
  currentFragment = '';

  constructor(private route: ActivatedRoute) {
    super();
  }

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      this.currentFragment = fragment;
      this.handleFragmentChange();
    });
  }

  handleFragmentChange() {
    this.field.fieldGroup.forEach((field: FormlyFieldConfig, index) => {
      if (field.props.anchor === this.currentFragment) {
        this.selectedIndex = index;
      }
    });
  }

  nextStep(maxNumberOfTabs: number) {
    if (this.selectedIndex !== maxNumberOfTabs) {
      this.selectedIndex = this.selectedIndex + 1;
    }
  }

  previousStep() {
    if (this.selectedIndex != 0) {
      this.selectedIndex = this.selectedIndex - 1;
    }
  }

  isValid(field: FormlyFieldConfig): boolean {
    if (field.key) {
      return field.formControl.valid;
    }

    return field.fieldGroup ? field.fieldGroup.every(f => this.isValid(f)) : true;
  }

  checkPathogenSelection(model: any, label: string) {
    return label === 'Meldetatbestand' ? !!model?.notificationCategory?.pathogenDisplay : true;
  }

  protected readonly JSON = JSON;
}
