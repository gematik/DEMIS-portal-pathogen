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

import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    return MockBuilder(LocalStorageService);
  });

  beforeEach(() => {
    service = TestBed.inject(LocalStorageService);

    // Clear localStorage before each test
    localStorage.clear();

    // Spies for localStorage methods
    spyOn(localStorage, 'getItem').and.callThrough();
    spyOn(localStorage, 'setItem').and.callThrough();
    spyOn(localStorage, 'removeItem').and.callThrough();
    spyOn(localStorage, 'clear').and.callThrough();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setItem', () => {
    it('should set an item in localStorage', () => {
      const key = 'testKey';
      const value = { data: 'testValue' };
      service.setItem(key, value);
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    it('should not set an item if value is falsy', () => {
      const key = 'testKey';
      service.setItem(key, null);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    it('should get an item from localStorage', () => {
      const key = 'testKey';
      const value = { data: 'testValue' };
      localStorage.setItem(key, JSON.stringify(value));

      const result = service.getItem<{ data: string }>(key);
      expect(result).toEqual(value);
      expect(localStorage.getItem).toHaveBeenCalledWith(key);
    });

    it('should return null if key is empty', () => {
      const result = service.getItem('');
      expect(result).toBeNull();
    });

    it('should return null if item does not exist', () => {
      const result = service.getItem('nonExistentKey');
      expect(result).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should remove an item from localStorage', () => {
      const key = 'testKey';
      localStorage.setItem(key, 'someValue');
      service.removeItem(key);
      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('should not try to remove if key is empty', () => {
      service.removeItem('');
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    it('should update an item in localStorage', () => {
      const key = 'testKey';
      const value = { data: 'newValue' };
      service.updateItem(key, value);
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value));
    });
  });

  describe('addItemToList', () => {
    it('should add a new item to an existing list in localStorage', () => {
      const key = 'listKey';
      const existingList = ['item1'];
      const newItem = 'item2';
      localStorage.setItem(key, JSON.stringify(existingList));

      service.addItemToList(key, newItem);

      const expectedList = [newItem, 'item1'];
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(expectedList));
    });

    it('should create a new list if one does not exist', () => {
      const key = 'newListKey';
      const newItem = 'item1';

      service.addItemToList(key, newItem);

      const expectedList = [newItem];
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(expectedList));
    });

    it('should not add duplicate items', () => {
      const key = 'listKey';
      const existingList = ['item1'];
      const newItem = 'item1';
      localStorage.setItem(key, JSON.stringify(existingList));

      service.addItemToList(key, newItem);

      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('deepEqual', () => {
    it('should return true for equal objects', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      expect(service.deepEqual(obj1, obj2)).toBeTrue();
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };
      expect(service.deepEqual(obj1, obj2)).toBeFalse();
    });
  });

  describe('removeObjectFromList', () => {
    it('should remove an object from the list', () => {
      const key = 'objListKey';
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const list = [obj1, obj2];
      localStorage.setItem(key, JSON.stringify(list));

      service.removeObjectFromList(key, obj1);

      const expectedList = [obj2];
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(expectedList));
    });

    it('should handle empty list gracefully', () => {
      const key = 'emptyListKey';
      service.removeObjectFromList(key, { id: 1 });
      expect(localStorage.setItem).toHaveBeenCalledWith(key, '[]');
    });

    it('should remain unchanged if object not found', () => {
      const key = 'objListKey';
      const obj1 = { id: 1 };
      const list = [obj1];
      localStorage.setItem(key, JSON.stringify(list));

      service.removeObjectFromList(key, { id: 2 });

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(list));
    });
  });
});
