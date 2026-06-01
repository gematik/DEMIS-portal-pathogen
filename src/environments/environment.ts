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

import { HttpHeaders } from '@angular/common/http';
import { assetUrl } from '../single-spa/asset-url';
import { isDevMode } from '@angular/core';
import { LOGGER_CONFIG_FOR_DEV, LOGGER_CONFIG_FOR_PROD } from '@gematik/demis-portal-core-library';

interface NgxLoggerConfig {
  level: number;
  disableConsoleLogging: boolean;
  serverLogLevel: number;
}

export type FeatureFlags = Record<string, boolean>;

type GatewayPaths = Record<string, string>;

type FutsPaths = Record<string, string>;

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
  public local = false;
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

  public get defaultLoggerConfiguration() {
    return isDevMode() ? LOGGER_CONFIG_FOR_DEV : LOGGER_CONFIG_FOR_PROD;
  }

  /**
   * Logger is by default disabled (values.yaml)
   * Locally it is by default enabled (environment.json)
   *
   * If values yaml & environment.json do not provide a logger configuration, the default configuration is used,
   * which is disabled for production and enabled for development.
   *
   * To enable or disable it differently on a specific environment, it must be changed via config maps
   *
   * Logger config hierarchy:
   * values.yaml > environment.json > defaultConfig
   */
  public get ngxLoggerConfig(): NgxLoggerConfig {
    return this.config?.ngxLoggerConfig ? this.config?.ngxLoggerConfig : this.defaultLoggerConfiguration;
  }

  public get pathToGateway(): string {
    return this.config?.pathToGateway;
  }

  /**
   *  @deprecated Use paragraph paths instead
   */
  public get pathToPathogen(): string {
    return this.gatewayPaths?.pathogen;
  }

  public get pathToPathogen_7_1(): string {
    return this.gatewayPaths?.pathogen_7_1;
  }

  public get pathToPathogen_7_3_nonNominal(): string {
    return this.gatewayPaths?.pathogen_7_3_non_nominal;
  }

  public get pathToPathogen_7_3_anonymous(): string {
    return this.gatewayPaths?.pathogen_7_3_anonymous;
  }

  public get pathToFuts(): string {
    // in case that FEATURE_FLAG_FHIR_CORE_SPLIT ist disabled (project flag from demis-cluster-deployment), use
    // "pathToFuts": "/translation/ui-data-model/v6/fhir",
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

  public get notificationCategories_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.notificationCategories_7_1;
  }

  public get notificationCategoriesForFederalState_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.notificationCategoriesForFederalState_7_1;
  }

  public get notificationCategoriesForSpecificCodeDefault(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.laboratoryDataForSpecificCodeDefault;
  }

  public get laboratoryDataForSpecificCode_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.laboratoryDataForSpecificCode_7_1;
  }

  public get laboratoryDataForSpecificCode_7_3(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.laboratoryDataForSpecificCode_7_3;
  }

  public get notificationCategory_FollowUp_7_1(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.followUpCode_7_1;
  }

  public get notificationCategory_FollowUp_7_3(): string {
    return this.config?.pathToFuts + this.config?.futsPaths?.followUpCode_7_3;
  }

  public get futsHeaders(): HttpHeaders {
    return this.headers.set('x-fhir-profile', 'fhir-profile-snapshots');
  }
}

export const environment = new Environment();
