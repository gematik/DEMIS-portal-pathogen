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

import { MockBuilder, MockRender } from 'ng-mocks';
import { AutocompleteTypeComponent } from './autocomplete-type.component';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { FormlyModule } from '@ngx-formly/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

describe('AutocompleteTypeComponent', () => {
  beforeEach(() =>
    MockBuilder(AutocompleteTypeComponent)
      .keep(FormlyModule.forRoot())
      .keep(ReactiveFormsModule)
      .keep(MatAutocompleteModule)
      .keep(MatInputModule)
      .keep(MatButtonModule)
      .keep(MatIconModule)
      .keep(MatFormFieldModule)
  );

  const setup = (initialValue: any) => {
    const filterSpy = jasmine.createSpy('filter').and.returnValue(of([]));
    const field: any = {
      id: 'testId',
      key: 'testKey',
      form: new FormGroup({}),
      formControl: new FormControl(initialValue),
      templateOptions: { placeholder: '', clearable: true, filter: filterSpy },
      props: { placeholder: '', clearable: true, filter: filterSpy },
    };
    const fixture = MockRender(AutocompleteTypeComponent, { field });
    const component = fixture.point.componentInstance;
    fixture.detectChanges();
    filterSpy.calls.reset();
    return { component, field, filterSpy, fixture };
  };

  // helper: force subscription to new filter observable after reset.
  const subscribeFilter = (component: AutocompleteTypeComponent) => {
    const sub = component.filter.subscribe();
    sub.unsubscribe();
  };

  it('onClick should clear value, call filter with empty string, and onBlur should restore previous value', () => {
    const { component, field, filterSpy, fixture } = setup('FirstValue');
    expect(field.formControl.value).toBe('FirstValue');

    component.onClick();
    fixture.detectChanges();
    subscribeFilter(component); // force subscription
    expect(field.formControl.value).toBe('');
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(filterSpy).toHaveBeenCalledWith('');

    component.onBlur();
    expect(field.formControl.value).toBe('FirstValue');
  });

  it('onBlur should not restore previous value if user typed a new non-empty value after click', () => {
    const { component, field } = setup('FirstValue');

    component.onClick();
    field.formControl.setValue('SecondValue');
    component.onBlur();
    expect(field.formControl.value).toBe('SecondValue');
  });

  it('onClick should do nothing when control is already empty', () => {
    const { component, field, filterSpy } = setup('');
    component.onClick();
    expect(field.formControl.value).toBe('');
    expect(filterSpy).not.toHaveBeenCalled();
  });

  it('onBlur with no previous value should leave empty value unchanged', () => {
    const { component, field } = setup('');
    component.onBlur();
    expect(field.formControl.value).toBe('');
  });

  it('onAutocompleteOpened should perform same reset as onClick when opened via keyboard', () => {
    const { component, field, filterSpy, fixture } = setup('FirstValue');
    component.onAutocompleteOpened();
    fixture.detectChanges();
    subscribeFilter(component); // force subscription
    expect(field.formControl.value).toBe('');
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(filterSpy).toHaveBeenCalledWith('');
  });

  it('onAutocompleteOpened after onClick should not double reset', () => {
    const { component, field, filterSpy, fixture } = setup('FirstValue');

    component.onClick();
    fixture.detectChanges();
    subscribeFilter(component); // force subscription
    expect(field.formControl.value).toBe('');
    expect(filterSpy.calls.count()).toBe(1);

    component.onAutocompleteOpened();
    fixture.detectChanges();
    // no new subscription -> count should stay 1
    expect(filterSpy.calls.count()).toBe(1);
    expect(field.formControl.value).toBe('');
  });

  it('after reset (click) typing new value should call filter first with empty string then with each typed term', () => {
    const { component, filterSpy, fixture } = setup('InitialValue');

    // trigger reset
    component.onClick();
    fixture.detectChanges();

    // subscribe AFTER reset so startWith('') emits and invokes filterSpy('')
    const sub = component.filter.subscribe();

    expect(filterSpy.calls.count()).toBe(1);
    expect(filterSpy.calls.argsFor(0)).toEqual(['']);

    // simulate user typing
    component.formControl.setValue('A'); // emits
    expect(filterSpy.calls.count()).toBe(2);
    expect(filterSpy.calls.argsFor(1)).toEqual(['A']);

    component.formControl.setValue('AB');
    expect(filterSpy.calls.count()).toBe(3);
    expect(filterSpy.calls.argsFor(2)).toEqual(['AB']);

    sub.unsubscribe();
  });
});
