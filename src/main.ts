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

import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { MatTabsModule } from '@angular/material/tabs';
import { environment } from './environments/environment';
import { LoggerModule } from 'ngx-logger';
import { PathogenNotificationModule } from './app/pathogen-notification/pathogen-notification.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app/app-routing.module';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { RouterLink, RouterModule } from '@angular/router';
import { AuthInterceptor } from './app/pathogen-notification/services/auth/auth.interceptor';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

bootstrapApplication(AppComponent, {
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
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
  ],
}).catch(err => console.error(err));
