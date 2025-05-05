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

import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { FieldType } from '@ngx-formly/material';
import { Observable } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatSuffix } from '@angular/material/form-field';
import { MatIconButton } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-formly-autocomplete-type',
  styleUrls: ['./autocomplete-type.component.scss'],
  template: `
    <input
      [id]="id"
      matInput
      [matAutocomplete]="auto"
      [formControl]="formControl"
      [formlyAttributes]="field"
      [placeholder]="props.placeholder"
      [errorStateMatcher]="errorStateMatcher" />
    @if (props['clearable'] && formControl.value) {
      <span id="close-icon">
        <button id="clear-pathogen" matSuffix mat-icon-button aria-label="Clear" (click)="formControl.setValue('')">
          <mat-icon>close</mat-icon>
        </button>
      </span>
    }
    <mat-autocomplete #auto="matAutocomplete">
      @for (value of filter | async; track value) {
        <mat-option [value]="value">
          {{ value }}
        </mat-option>
      }
    </mat-autocomplete>
  `,
  standalone: true,
  imports: [MatInput, MatAutocompleteTrigger, ReactiveFormsModule, FormlyModule, MatIconButton, MatSuffix, MatIcon, MatAutocomplete, MatOption, AsyncPipe],
  encapsulation: ViewEncapsulation.None,
})
export class AutocompleteTypeComponent extends FieldType<FieldTypeConfig> implements OnInit, AfterViewInit {
  @ViewChild(MatInput) formFieldControl!: MatInput;
  @ViewChild(MatAutocompleteTrigger) autocomplete!: MatAutocompleteTrigger;

  filter!: Observable<any>;

  ngOnInit() {
    this.filter = this.formControl.valueChanges.pipe(
      startWith((this.formControl.value as string) || ''),
      //@ts-ignore
      switchMap(term => this.props.filter(term))
    );
  }

  ngAfterViewInit() {
    // temporary fix for https://github.com/angular/material2/issues/6728
    if (this.autocomplete) {
      (<any>this.autocomplete)._formField = this.formField;
    }
  }
}

/**  Copyright 2018 Google Inc. All Rights Reserved.
 Use of this source code is governed by an MIT-style license that
 can be found in the LICENSE file at http://angular.io/license */
