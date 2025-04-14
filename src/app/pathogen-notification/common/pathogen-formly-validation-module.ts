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

import { FormlyModule } from '@ngx-formly/core';
import { AbstractControl } from '@angular/forms';
import { endDateValidator } from '../legacy/notification-form-validation-module';

export const PathogenFormValidationModule = FormlyModule.forRoot({
  validators: [
    {
      name: 'receivedDateStartDateValidator',
      validation: receivedDateStartDateValidation,
    },
  ],
});

const EXTRACTION_START_ERROR_MSG: string = 'Das Entnahmedatum darf nicht nach dem Eingangsdatum liegen';

function receivedDateStartDateValidation(control: AbstractControl): any {
  return endDateValidator(control.parent?.value?.extractionDate, control.value, EXTRACTION_START_ERROR_MSG);
}
