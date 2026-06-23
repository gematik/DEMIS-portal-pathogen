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

import { ConfigOption } from '@ngx-formly/core';
import { DATEPICKER_VALIDATION_MESSAGES, FormlyDatepickerComponent, FormlyRepeaterComponent } from '@gematik/demis-portal-core-library';
import { RepeatComponent } from '../../legacy/formly/types/repeat/repeat.component';
import { AutocompleteTypeComponent } from '../../legacy/formly/types/autocomplete/autocomplete-type.component';
import { FormWrapperComponent } from '../../components/form-wrapper/form-wrapper.component';
import { FavoritesListComponent } from '../../components/favorites-list/favorites-list.component';
import { FavoritesAddComponent } from '../../components/favorites-add/favorites-add.component';
import { ValidationWrapperComponent } from '../../legacy/formly/wrappers/validation-wrapper/validation-wrapper.component';
import { ExpansionPanelWrapperComponent } from '../../legacy/formly/wrappers/expansion-panel-wrapper/expansion-panel.wrapper';
import { defaultAppearanceExtension, defaultPlaceholderExtension } from '../../utils/formly-extensions';

export const PathogenFormlyConfig: ConfigOption = {
  types: [
    { name: 'repeater', component: FormlyRepeaterComponent },
    { name: 'datepicker', component: FormlyDatepickerComponent },
    { name: 'repeat', component: RepeatComponent },
    {
      name: 'autocomplete',
      component: AutocompleteTypeComponent,
      wrappers: ['form-field'],
    },
    {
      name: 'demis-formly-tab-navigation',
      component: FormWrapperComponent,
    },
    {
      name: 'demis-favorites-list',
      component: FavoritesListComponent,
    },
    {
      name: 'demis-favorites-add-list',
      component: FavoritesAddComponent,
    },
  ],
  wrappers: [
    { name: 'validation', component: ValidationWrapperComponent },
    { name: 'expansion-panel', component: ExpansionPanelWrapperComponent },
  ],
  validationMessages: [...DATEPICKER_VALIDATION_MESSAGES, { name: 'required', message: 'Diese Angabe wird benötigt' }],
  extensions: [
    {
      name: 'default-placeholder',
      extension: defaultPlaceholderExtension,
    },
    {
      name: 'default-appearance',
      extension: defaultAppearanceExtension,
    },
  ],
};
