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

import { enableProdMode, NgZone, importProvidersFrom } from '@angular/core';

import { Router, NavigationStart, RouterModule, RouterLink } from '@angular/router';
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
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AuthInterceptor } from './app/pathogen-notification/services/auth/auth.interceptor';
import { HTTP_INTERCEPTORS, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';

const appId = 'notification-portal-mf-pathogen';

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return bootstrapApplication(AppComponent, {
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

export const bootstrap = bootstrapFn;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
