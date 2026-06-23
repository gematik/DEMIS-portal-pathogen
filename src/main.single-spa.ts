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

import { enableProdMode, importProvidersFrom, NgZone, provideZoneChangeDetection } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { getSingleSpaExtraProviders, singleSpaAngular } from 'single-spa-angular';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import { AppProps } from 'single-spa';
import { setPublicPath } from 'systemjs-webpack-interop';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { LoggerModule } from 'ngx-logger';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app/app-routing.module';
import { bootstrapApplication } from '@angular/platform-browser';
import { AuthInterceptor } from './app/pathogen-notification/services/auth/auth.interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { allowedRoutes } from './app/pathogen-notification/common/routing-helper';
import { provideFormlyCore } from '@ngx-formly/core';
import { PathogenFormlyConfig } from './app/pathogen-notification/formly/configs/formly-app-config';
import { withFormlyMaterial } from '@ngx-formly/material';
import { withFormlyFieldSelect } from '@ngx-formly/material/select';
import { ClipboardDataService } from './app/pathogen-notification/services/clipboard-data.service';
import { FhirPathogenNotificationService } from './app/pathogen-notification/services/fhir-pathogen-notification.service';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { NotificationFormValidationConfig } from './app/pathogen-notification/legacy/notification-form-validation-module';
import { PathogenFormValidationConfig } from './app/pathogen-notification/common/pathogen-formly-validation-module';
import { withDemisFormlyCore } from '@gematik/demis-portal-core-library';

const appId = 'notification-portal-mf-pathogen';
let router: Router;

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    const appPromise = bootstrapApplication(AppComponent, {
      providers: [
        provideZoneChangeDetection(),
        importProvidersFrom(AppRoutingModule, LoggerModule.forRoot(environment.ngxLoggerConfig), FormlyMatDatepickerModule),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        getSingleSpaExtraProviders(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
        ClipboardDataService,
        FhirPathogenNotificationService,
        provideFormlyCore([
          NotificationFormValidationConfig,
          PathogenFormValidationConfig,
          PathogenFormlyConfig,
          ...withFormlyMaterial(),
          withFormlyFieldSelect(),
          ...withDemisFormlyCore(),
        ]),
      ],
    });

    appPromise.then(appRef => {
      router = appRef.injector.get(Router);
      syncUrlWithRouter();
      setupRouterSync();
      return appRef;
    });

    return appPromise;
  },
  template: '<mf-pathogen-root />',
  Router,
  NgZone,
  NavigationStart,
});

function init() {
  setPublicPath(appId);

  return fetch(environment.pathToEnvironment)
    .then(response => response.json())
    .then(config => {
      environment.pathogenConfig = config;
    })
    .finally(() => {
      if (environment.isProduction) {
        enableProdMode();
      }
    });
}

function bootstrapFn(props: AppProps) {
  return init().then(() => {
    if (typeof lifecycles.bootstrap == 'function') {
      return lifecycles.bootstrap(props);
    } else {
      return lifecycles.bootstrap;
    }
  });
}

function isSafeRoute(redirectUrl: string) {
  return Object.values(allowedRoutes).some(route => redirectUrl.includes(route));
}

/**
 * Get the current URL from the hash or pathname
 * Since we're using HashLocationStrategy, we need to extract the route from the hash
 */
function getCurrentUrlFromLocation(): string {
  // Check if we're using hash-based routing
  if (window.location.hash) {
    // Extract the path after the # and remove the leading /
    const hashPath = window.location.hash.substring(1); // Remove the #
    return hashPath.startsWith('/') ? hashPath.substring(1) : hashPath;
  }
  // Fallback to pathname if no hash
  const pathname = window.location.pathname;
  return pathname.startsWith('/') ? pathname.substring(1) : pathname;
}

/**
 * shell and microfrontend are using different routers
 * when switching tabs, the shell is switching the URL, but the angular router of this microfrontend is not updated automatically
 */
function syncUrlWithRouter() {
  if (router) {
    const currentUrl = getCurrentUrlFromLocation();
    const normalizedRouterUrl = router.url.startsWith('/') ? router.url.substring(1) : router.url;

    if (normalizedRouterUrl !== currentUrl && isSafeRoute(currentUrl)) {
      router.navigateByUrl('/' + currentUrl).catch(err => console.error('Navigation Error:', err));
    }
  }
}

/**
 * Set up a listener for popstate events to sync the router when the shell changes the URL
 */
function setupRouterSync() {
  // Listen for hash changes (primary mechanism for HashLocationStrategy)
  window.addEventListener('hashchange', () => {
    syncUrlWithRouter();
  });

  // Listen for browser navigation events (back/forward buttons)
  window.addEventListener('popstate', () => {
    syncUrlWithRouter();
  });
}

export const bootstrap = bootstrapFn;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
