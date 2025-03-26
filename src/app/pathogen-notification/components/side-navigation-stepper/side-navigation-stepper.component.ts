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

import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { MatIcon } from '@angular/material/icon';
import { NgFor, NgIf } from '@angular/common';
import { MatStep, MatStepper, MatStepperIcon } from '@angular/material/stepper';

@Component({
  selector: 'app-side-navigation-stepper',
  templateUrl: './side-navigation-stepper.component.html',
  styleUrls: ['./side-navigation-stepper.component.scss'],
  standalone: true,
  imports: [MatStepper, NgFor, MatStep, MatStepperIcon, MatIcon, NgIf],
})
export class SideNavigationStepperComponent {
  @Input() steps: FormlyFieldConfig[] = [];
  @Input() currentStep: number;
  @Input() model: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  isTouchedAndValid(field: FormlyFieldConfig) {
    if (field.key) {
      return field.formControl.valid && field.formControl.touched;
    }
    return field.fieldGroup ? field.fieldGroup.every(f => this.isTouchedAndValid(f)) : true;
  }

  isEditable(index: number) {
    const isDiagnosticReadySpecimenPrep = !this.model?.notificationCategory?.pathogenDisplay ? 'disabled_step' : null;
    return index == 4 && isDiagnosticReadySpecimenPrep;
  }

  onStepChange(event: StepperSelectionEvent) {
    this.router.navigate(['./'], {
      relativeTo: this.route,
      fragment: this.steps[event.selectedIndex].props['anchor'],
    });
  }

  getStepId(step: FormlyFieldConfig): string {
    return String(step?.key || step?.props?.label);
  }
}
