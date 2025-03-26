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

import { Component } from '@angular/core';
import { FieldWrapper, FormlyFieldConfig } from '@ngx-formly/core';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

@Component({
  selector: 'app-formly-expansion-panel',
  styleUrls: ['./expansion-panel.wrapper.scss'],
  template: `
    <div class="row">
      <div id="accordion-wrapper" [class]="'col-sm-12 mt-sm-2 mb-sm-3'">
        <mat-accordion>
          <mat-expansion-panel
            [expanded]="!props['isClosed'] || props['isSingle']"
            (opened)="handlePanelClosingOnOpen(field)"
            (closed)="props['isClosed'] = true"
            [hideToggle]="props['isSingle']">
            <mat-expansion-panel-header [class]="props['isSingle'] ? 'disabled-pointer' : ''">
              <mat-panel-title>
                <h2>{{ field.props!.label }}</h2>
              </mat-panel-title>
            </mat-expansion-panel-header>
            @if (field.props!.description) {
              <div class="lead mt-4 mb-4">
                {{ field.props!.description }}
              </div>
            }
            <ng-container #fieldComponent></ng-container>
          </mat-expansion-panel>
        </mat-accordion>
      </div>
    </div>
  `,
  standalone: true,
  imports: [MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle],
})
export class ExpansionPanelWrapperComponent extends FieldWrapper {
  handlePanelClosingOnOpen(field: FormlyFieldConfig) {
    const specimenListLength = field.parent.parent.fieldGroup.length;
    for (let i = 0; i < specimenListLength; i++) {
      field.parent.parent.fieldGroup[i].fieldGroup[0].props['isClosed'] = true;
    }
    field.props!['isClosed'] = false;
  }
}
