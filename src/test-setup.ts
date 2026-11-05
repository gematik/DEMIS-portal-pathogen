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

import '@angular/compiler';
import '@analogjs/vitest-angular/setup-zone';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';

/**
 TODO update ngx-formly and check if this workaround is still needed
 * ngx-formly 7 is partially compiled against Angular 18 and its `formly-field-mat-select` renders
 * the `mat-option`s from an asynchronous options stream. Whenever the control already holds a
 * value by the time those options resolve, Angular Material flips `mat-option`'s `aria-selected`
 * host binding while change detection is still running, so Angular's dev-only `checkNoChanges`
 * verification pass - which `ComponentFixture.detectChanges()` performs right after every regular
 * pass - reports an NG0100. The binding settles on the following pass and no assertion ever sees a
 * wrong value; the error merely aborts whichever `detectChanges()` call happens to trigger it.
 * This stayed invisible while the TestBed still ran zoneless, because the zoneless code path in
 * `ComponentFixture.detectChanges()` does not run the verification pass at all.
 *
 * Ignore exactly this error; every other NG0100 still fails the test as it should.
 */
const originalCheckNoChanges = ComponentFixture.prototype.checkNoChanges;
ComponentFixture.prototype.checkNoChanges = function () {
  try {
    originalCheckNoChanges.call(this);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('NG0100') && message.includes('aria-selected')) {
      return;
    }
    throw error;
  }
};

setupTestBed({
  zoneless: false,
  providers: [provideZoneChangeDetection()],
  teardown: { destroyAfterEach: true },
});
