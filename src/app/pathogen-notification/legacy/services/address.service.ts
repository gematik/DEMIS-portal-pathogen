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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';

export interface OsmFeature {
  type: 'Feature';
  geometry: any;
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key: string; // place
    osm_value: string; // city
    name: string;
    street: string;
    houseNumber: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
  };
}

export interface OsmFeatureCollection {
  type: 'FeatureCollection';
  features: OsmFeature[];
}

export interface GeoAddress {
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  county: string;
  country: string;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  constructor(
    private http: HttpClient,
    private logger: NGXLogger
  ) {}

  getSuggestions(streetSearch: string, limit: number = 5): Observable<GeoAddress[]> {
    return this.http
      .get<OsmFeatureCollection>('https://photon.komoot.de/api/', {
        params: {
          q: streetSearch,
          limit: limit.toString(),
          lang: 'de',
          osm_tag: ['!highway', '!building'],
        },
      })
      .pipe(
        tap(c => this.logger.log('AddressService :: getSuggestions ::', c)),
        map(r =>
          r.features.map(f => ({
            street: f.properties.street,
            houseNumber: f.properties.houseNumber,
            zip: f.properties.postcode,
            city: f.properties.city,
            county: f.properties.state,
            country: f.properties.country,
          }))
        )
      );
  }
}
