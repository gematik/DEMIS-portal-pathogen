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

import { environment } from '../../../environments/environment';
import { ErrorDialogService } from './error-dialog.service';
import { MessageDialogService } from '@gematik/demis-portal-core-library';
import { MockBuilder } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';

describe('ErrorDialogService', () => {
  let serviceUnderTest: ErrorDialogService;
  let showErrorDialogSpy: jasmine.Spy;

  beforeEach(() => MockBuilder(ErrorDialogService));

  beforeEach(() => {
    environment.pathogenConfig = {
      ...environment.pathogenConfig,
      featureFlags: {
        FEATURE_FLAG_PORTAL_ERROR_DIALOG: true,
      },
    };
    serviceUnderTest = TestBed.inject(ErrorDialogService);
    showErrorDialogSpy = spyOn(TestBed.inject(MessageDialogService), 'showErrorDialog');
  });

  describe('showBasicClosableErrorDialog', () => {
    it('should call showErrorDialog with correct params', () => {
      const message = 'Something went wrong';
      const title = 'Error Title';

      serviceUnderTest.showBasicClosableErrorDialog(message, title);
      expect(showErrorDialogSpy).toHaveBeenCalledOnceWith({
        errorTitle: title,
        errors: [{ text: message }],
      });
    });

    it('should call showErrorDialog with correct params, even with missing title', () => {
      const message = 'Something went wrong';

      serviceUnderTest.showBasicClosableErrorDialog(message);
      expect(showErrorDialogSpy).toHaveBeenCalledOnceWith({
        errorTitle: null,
        errors: [{ text: message }],
      });
    });
  });

  describe('showBasicErrorDialogWithRedirect', () => {
    it('should call showErrorDialog with correct params', () => {
      const message = 'Something went wrong';
      const title = 'Error Title';

      serviceUnderTest.showBasicErrorDialogWithRedirect(message, title);
      expect(showErrorDialogSpy).toHaveBeenCalledOnceWith({
        redirectToHome: true,
        errorTitle: title,
        errors: [{ text: message }],
      });
    });

    it('should call showErrorDialog with correct params, even with missing title', () => {
      const message = 'Something went wrong';

      serviceUnderTest.showBasicErrorDialogWithRedirect(message);
      expect(showErrorDialogSpy).toHaveBeenCalledOnceWith({
        redirectToHome: true,
        errorTitle: null,
        errors: [{ text: message }],
      });
    });
  });

  describe('openErrorDialogAndRedirectToHome', () => {
    it('should call showErrorDialog with correct params', () => {
      const error = new Error('Something went wrong');
      const title = 'Error Title';
      spyOn(TestBed.inject(MessageDialogService), 'extractMessageFromError').and.returnValue('Something went wrong');
      serviceUnderTest.openErrorDialogAndRedirectToHome(error, title);
      expect(showErrorDialogSpy).toHaveBeenCalledOnceWith({
        redirectToHome: true,
        errorTitle: title,
        errors: [{ text: 'Something went wrong' }],
      });
    });
  });
});
