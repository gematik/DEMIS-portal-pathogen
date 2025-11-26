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

import { formatDateToYYMMDD, germanToIsoFormat, isoToGermanFormat } from './common-utils';

describe('common-utils', () => {
  describe('isoToGermanFormat', () => {
    it('formats a valid YYYY-MM-DD string to dd.MM.yyyy', () => {
      expect(isoToGermanFormat('2025-06-11')).toBe('11.06.2025');
    });

    it('returns empty string for ISO with time', () => {
      expect(isoToGermanFormat('2025-06-11T00:00:00Z')).toBe('');
    });

    it('returns empty string for partial YYYY-MM', () => {
      expect(isoToGermanFormat('2025-06')).toBe('');
    });

    it('returns empty string for partial YYYY', () => {
      expect(isoToGermanFormat('2025')).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(isoToGermanFormat('')).toBe('');
    });

    it('returns empty string for invalid date', () => {
      expect(isoToGermanFormat('invalid-date')).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(isoToGermanFormat(undefined as any)).toBe('');
    });
  });

  describe('formatBirthDateToYYMMDD', () => {
    it('should format "05.11.1998" to "981105"', () => {
      expect(formatDateToYYMMDD('05.11.1998')).toBe('981105');
    });

    it('should format "1998-11-05" to "981105"', () => {
      expect(formatDateToYYMMDD('1998-11-05')).toBe('981105');
    });

    it('should return empty string for invalid format "1998.11.05"', () => {
      expect(formatDateToYYMMDD('1998.11.05')).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(formatDateToYYMMDD('')).toBe('');
    });

    it('should return empty string for invalid date like "99-99-9999"', () => {
      expect(formatDateToYYMMDD('99-99-9999')).toBe('');
    });

    it('should return empty string for partial input like "1998-11"', () => {
      expect(formatDateToYYMMDD('1998-11')).toBe('');
    });
  });

  describe('germanToIsoFormat', () => {
    it('should convert "12.03.2025" to "2025-03-12"', () => {
      expect(germanToIsoFormat('12.03.2025')).toBe('2025-03-12');
    });

    it('should convert "03.2025" to "2025-03"', () => {
      expect(germanToIsoFormat('03.2025')).toBe('2025-03');
    });

    it('should return input unchanged if it does not match any format', () => {
      expect(germanToIsoFormat('invalid-date')).toBe('invalid-date');
      expect(germanToIsoFormat('2025/03/12')).toBe('2025/03/12');
    });

    it('should return input unchanged for empty string', () => {
      expect(germanToIsoFormat('')).toBe('');
    });

    it('should not convert ambiguous values like "13.2025"', () => {
      // "13.2025" is not a valid MM.yyyy (no 13th month)
      expect(germanToIsoFormat('13.2025')).toBe('13.2025');
    });
  });
});
