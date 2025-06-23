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

import { enableProdMode, importProvidersFrom, NgZone } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterModule } from '@angular/router';
import { getSingleSpaExtraProviders, singleSpaAngular } from 'single-spa-angular';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import { AppProps } from 'single-spa';
import { setPublicPath } from 'systemjs-webpack-interop';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { MatTabsModule } from '@angular/material/tabs';
import { LoggerModule } from 'ngx-logger';
import { PathogenNotificationModule } from './app/pathogen-notification/pathogen-notification.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { AuthInterceptor } from './app/pathogen-notification/services/auth/auth.interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { allowedRoutes } from './app/pathogen-notification/common/routing-helper';

const appId = 'notification-portal-mf-pathogen';
let router: Router;

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    const appPromise = bootstrapApplication(AppComponent, {
      providers: [
        importProvidersFrom(
          RouterModule,
          RouterLink,
          BrowserModule,
          AppRoutingModule,
          ReactiveFormsModule,
          PathogenNotificationModule,
          LoggerModule.forRoot(environment.ngxLoggerConfig),
          MatTabsModule
        ),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        getSingleSpaExtraProviders(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
      ],
    });

    appPromise.then(appRef => {
      if (environment.featureFlags.FEATURE_FLAG_NON_NOMINAL_NOTIFICATION) {
        router = appRef.injector.get(Router);
        syncUrlWithRouter();
      }
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
  return Object.values(allowedRoutes).some(route => route === redirectUrl);
}

/**
 * shell and microfrontend are using different routers
 * when switching tabs, the shell is switching the URL, but the angular router of this microfrontend is not updated automatically
 * this is a workaround for this issue
 */
function syncUrlWithRouter() {
  if (router) {
    const redirectUrl = window.location.hash.replace(/^#\//, '').split('?')[0];
    if (isSafeRoute(redirectUrl)) {
      router.navigateByUrl('').then(_ => {
        router.navigateByUrl('/' + redirectUrl);
      });
    } else {
      router.navigateByUrl('/');
    }
  }
}

export const bootstrap = bootstrapFn;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
