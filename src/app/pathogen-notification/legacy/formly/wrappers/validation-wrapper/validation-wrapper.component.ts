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

import { Component, ElementRef, OnInit } from '@angular/core';
import { FieldWrapper, FormlyModule } from '@ngx-formly/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Subject } from 'rxjs';
import { MatError } from '@angular/material/form-field';

@Component({
  selector: 'app-validation-wrapper',
  templateUrl: './validation-wrapper.component.html',
  standalone: true,
  imports: [MatError, FormlyModule],
})
export class ValidationWrapperComponent extends FieldWrapper implements OnInit {
  stateChanges = new Subject<void>();
  _errorState = false;

  constructor(
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef
  ) {
    super();
  }

  // @ts-ignore
  get showError(): boolean {
    return true;
  }

  ngOnInit(): void {
    if (this.field?.formControl) {
      this.field.formControl.statusChanges.subscribe(() => {
        // Handle status changes
        this.stateChanges.next();
      });
    }
  }
}
