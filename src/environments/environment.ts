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

import { HttpHeaders } from '@angular/common/http';
import { NgxLoggerLevel } from 'ngx-logger';
import { assetUrl } from '../single-spa/asset-url';

interface NgxLoggerConfig {
  level: number;
  disableConsoleLogging: boolean;
  serverLogLevel: number;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

interface GatewayPaths {
  [key: string]: string;
}

interface FutsPaths {
  [key: string]: string;
}

interface Configuration {
  production: boolean;
  pathToGateway: string;
  gatewayPaths: GatewayPaths;
  featureFlags: FeatureFlags;
  ngxLoggerConfig: NgxLoggerConfig;
  pathToFuts: string;
  futsPaths: FutsPaths;
  pathToDestinationLookup: string;
}

export class Environment {
  public headers: HttpHeaders;
  public local: boolean = false;
  public pathogenConfig: Configuration;

  constructor() {
    this.headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  public get pathToEnvironment() {
    return assetUrl('../environment.json');
  }

  private get config(): Configuration {
    return this.pathogenConfig;
  }

  public get isProduction(): boolean {
    return !!this.config?.production;
  }

  public get ngxLoggerConfig(): NgxLoggerConfig {
    return this.config?.ngxLoggerConfig ? this.config?.ngxLoggerConfig : this.defaultNgxLoggerConfig;
  }

  public get defaultNgxLoggerConfig(): NgxLoggerConfig {
    return {
      level: NgxLoggerLevel.OFF,
      disableConsoleLogging: true,
      serverLogLevel: NgxLoggerLevel.OFF,
    };
  }

  public get pathToGateway(): string {
    return this.config?.pathToGateway;
  }

  public get pathToPathogen(): string {
    return this.gatewayPaths?.pathogen;
  }

  public get pathToPathogen_7_1(): string {
    return this.gatewayPaths?.pathogen_7_1;
  }

  public get pathToPathogen_7_3_nonNominal(): string {
    return this.gatewayPaths?.pathogen_7_3_non_nominal;
  }

  public get pathToFuts(): string {
    return this.config?.pathToFuts;
  }

  public get featureFlags(): FeatureFlags {
    return this.config?.featureFlags;
  }

  private get gatewayPaths(): GatewayPaths {
    return this.config?.gatewayPaths;
  }

  public get pathToDestinationLookup(): string {
    return this.config?.pathToDestinationLookup;
  }

  public get pathToFederalStates_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.federalStates_7_1;
  }

  public get countryCodes(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.countryCodes;
  }

  public get notificationCategories_7_3(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.notificationCategories_7_3;
  }

  public get notificationCategoriesForFederalState_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.notificationCategoriesForFederalState_7_1;
  }

  public get laboratoryDataForSpecificCode_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.laboratoryDataForSpecificCode_7_1;
  }

  public get laboratoryDataForSpecificCode_7_3(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.laboratoryDataForSpecificCode_7_3;
  }

  public get futsHeaders(): HttpHeaders {
    return this.headers.set(this.config?.featureFlags?.FEATURE_FLAG_NEW_API_ENDPOINTS ? 'x-fhir-profile' : 'fhirProfile', 'fhir-profile-snapshots');
  }
}

export const environment = new Environment();
