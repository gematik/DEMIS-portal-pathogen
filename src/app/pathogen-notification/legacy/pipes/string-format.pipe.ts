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

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stringFormat',
  standalone: true,
})
export class StringFormatPipe implements PipeTransform {
  transform(value: any, ...args: any[]): string {
    const formatFn: (obj: any) => string = args[0];
    return formatFn(value);
  }
}
