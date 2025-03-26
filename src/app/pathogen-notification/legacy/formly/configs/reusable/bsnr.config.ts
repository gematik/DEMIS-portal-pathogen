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

import { FormlyFieldConfig } from '@ngx-formly/core';

export const existsBsnrFormlyFieldConfig: FormlyFieldConfig = {
  id: 'existsBsnr',
  type: 'radio',
  key: 'existsBsnr',
  className: 'col-3  align-self-start',
  defaultValue: true,
  props: {
    label: 'Betriebsstättennummer',
    required: true,
    options: [
      { value: true, label: 'Vorhanden' },
      { value: false, label: 'Nicht vorhanden' },
    ],
  },
};

export const bsnrFormlyFieldConfig: FormlyFieldConfig = {
  id: 'bsnr',
  key: 'bsnr',
  type: 'input',
  className: 'col-8',
  expressions: {
    hide: (ffc: FormlyFieldConfig) => ffc.model.existsBsnr === false,
    'props.required': (ffc: FormlyFieldConfig) => ffc.model.existsBsnr,
  },
  props: {
    required: true,
    maxLength: 9,
    label: 'Betriebsstättennummer',
  },
  validators: {
    validation: ['bsNrValidator'],
  },
};
