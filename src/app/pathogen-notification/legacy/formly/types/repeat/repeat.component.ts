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

import { Component } from '@angular/core';
import { FieldArrayType, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-repeat',
  templateUrl: './repeat.component.html',
  styleUrls: ['./repeat.component.scss'],
  imports: [FormlyModule, MatIconButton, MatIcon, MatButton],
})
export class RepeatComponent extends FieldArrayType {
  constructor() {
    super();
  }

  ngOnInit() {
    this.field.props.add = this.add.bind(this);
    this.field.props.remove = this.remove.bind(this);
    this.field.props.setFieldCount = this.setFieldCount.bind(this);
  }

  setFieldCount(value: number, resetValues: boolean = false) {
    const currentLength = this.field.fieldGroup.length;
    const difference = value - currentLength;
    if (difference > 0) {
      Array(difference)
        .fill(null)
        .forEach(() => this.add());
    } else if (difference < 0) {
      for (let i = currentLength - 1; i >= value; i--) {
        this.remove(i);
      }
    }
    if (resetValues) this.field.fieldGroup.forEach(f => f.formControl.reset(null));
  }

  createRepeatId(s: string, i: number): string {
    if (/\d/.test(s)) {
      s = s.substring(0, s.length - 2);
    }
    return `${s}_${i}`;
  }

  setIdName(type: string, formlyField: FormlyFieldConfig, index: number, id?: string): string {
    formlyField.fieldGroup!.forEach((field: FormlyFieldConfig) => {
      // inside repeat type all fields inside the array should have a fixed id
      field.id = this.createRepeatId(field.id, index);
      return field.id;
    });
    return type + '-' + id + '_' + index;
  }

  setAddButtonIdName(buttonName: string): string {
    return 'btn-' + buttonName.toLocaleLowerCase().split(' ').join('-');
  }

  isLonely(formlyField: FormlyFieldConfig, isContact?: boolean) {
    if (isContact && this.areContactsLonely()) {
      return true;
    } else if (!isContact) {
      return formlyField.parent?.model?.length == 1;
    } else {
      return formlyField.parent?.model?.length == 0;
    }
  }

  closeAllExistingPanelsAndOpenNewOneOnAdd(formlyField: FormlyFieldConfig) {
    super.add();
    const numberOfPanels = formlyField.fieldGroup.length;
    this.reorder(numberOfPanels - 1);
    this.form.markAsUntouched();
    for (let i = 1; i < numberOfPanels; i++) {
      formlyField.fieldGroup[i].fieldGroup[0].props['isClosed'] = true;
    }
    formlyField.fieldGroup[0].fieldGroup[0].props['isClosed'] = false;
  }

  private areContactsLonely() {
    return (
      (this.form.value.emailAddresses?.length == 0 && this.form.value.phoneNumbers?.length == 1) ||
      (this.form.value.emailAddresses?.length == 1 && this.form.value.phoneNumbers?.length == 0)
    );
  }

  private reorder(oldI: number) {
    const m = this.model[oldI];
    this.remove(oldI);
    this.add(0, m);
  }
}
