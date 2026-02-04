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

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  setItem<T>(key: string, value: T): void {
    if (window.localStorage && !!value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  getItem<T>(key: string): T | null {
    if (!window.localStorage || !key) {
      return null;
    }
    const storageItem = localStorage.getItem(key);
    return storageItem ? (JSON.parse(storageItem) as T) : null;
  }

  removeItem(key: string): void {
    if (window.localStorage && key) {
      localStorage.removeItem(key);
    }
  }

  updateItem<T>(key: string, value: T): void {
    if (window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  addItemToList<T>(key: string, value: T): void {
    if (window.localStorage) {
      const currentItems: string[] = JSON.parse(localStorage.getItem(key));
      const itemArray = [];
      if (!currentItems?.includes(value as string)) {
        itemArray.push(value);
        if (currentItems) {
          for (const v of currentItems) {
            itemArray.push(v);
          }
        }
        localStorage.setItem(key, JSON.stringify(itemArray));
      }
    }
  }

  deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  removeObjectFromList<T>(key: string, value: T): void {
    if (window.localStorage) {
      const currentItems: T[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedItems = currentItems.filter(item => !this.deepEqual(item, value));
      localStorage.setItem(key, JSON.stringify(updatedItems));
    }
  }
}
