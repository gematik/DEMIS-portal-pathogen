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

interface Configuration {
  production: boolean;
  pathToGateway: string;
  gatewayPaths: GatewayPaths;
  featureFlags: FeatureFlags;
  ngxLoggerConfig: NgxLoggerConfig;
}

export class Environment {
  public headers: HttpHeaders;
  public local: boolean = false;
  public pathToIgsService: string = 'PATH TO IGS SERVICE NOT DEFINED';
  public pathogenConfig: Configuration;

  constructor() {
    this.headers = new HttpHeaders({
      'app-key': 'bd2aca3d5b433868146e41f89ccbd1c7',
      'Content-Type': 'application/json',
      'x-real-ip': '123.123.123.123',
    });
  }

  public get pathToEnvironment() {
    return assetUrl('../environment.json');
  }

  private get config(): Configuration {
    return this.pathogenConfig;
  }

  public get isLocal(): boolean {
    return this.local;
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

  public get featureFlags(): FeatureFlags {
    return this.config?.featureFlags;
  }

  private get gatewayPaths(): GatewayPaths {
    return this.config?.gatewayPaths;
  }
}

export const environment = new Environment();
