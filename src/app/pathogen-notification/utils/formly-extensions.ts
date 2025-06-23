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

import { FormlyExtension } from '@ngx-formly/core';
import { VALUE_DEFAULT_PLACEHOLDER, VALUE_DEFUALT_SELECT_PLACEHOLDER } from '../legacy/common-utils';

export const defaultPlaceholderExtension: FormlyExtension = {
  prePopulate(field): void {
    let placeholder: string = VALUE_DEFAULT_PLACEHOLDER;

    if (field.props?.placeholder) {
      return;
    }

    if (field.type === 'select' || field.type === 'autocomplete') {
      placeholder = VALUE_DEFUALT_SELECT_PLACEHOLDER;
    }

    field.props = {
      ...field.props,
      placeholder: placeholder,
    };
  },
};

export const defaultAppearanceExtension: FormlyExtension = {
  prePopulate(field): void {
    if (field.props?.['appearance']) {
      return;
    }

    if (field.type === 'checkbox') {
      field.props = {
        ...field.props,
        appearance: 'fill',
      };
      return;
    }

    field.props = {
      ...field.props,
      floatLabel: 'always',
      appearance: 'outline',
    };
  },
};
