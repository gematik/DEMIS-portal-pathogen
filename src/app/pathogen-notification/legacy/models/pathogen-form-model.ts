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

import {
  AddressType,
  ContactPointInfo,
  NotificationLaboratoryCategory,
  NotifiedPerson,
  NotifiedPersonAnonymous,
  NotifierFacility,
  PathogenDTO,
  SubmitterFacility,
} from 'src/api/notification';

/**
 * Recursively optional variant of `T`. Formly models are filled in step by step,
 * so nested objects are frequently present with only some of their keys.
 */
export type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export interface ContactsFormModel {
  phoneNumbers?: ContactPointInfo[];
  emailAddresses?: ContactPointInfo[];
}

export type NotifierFacilityFormModel = DeepPartial<Omit<NotifierFacility, 'contacts'>> & {
  contacts?: ContactPointInfo[] | ContactsFormModel;
};

export type SubmittingFacilityFormModel = DeepPartial<Omit<SubmitterFacility, 'contacts'>> & {
  copyAddressCheckBox?: boolean;
  contacts?: ContactPointInfo[] | ContactsFormModel;
};

export type NotifiedPersonFormModel = DeepPartial<Omit<NotifiedPerson, 'contacts'>> & {
  currentAddressType?: AddressType;
  contacts?: ContactPointInfo[] | ContactsFormModel;
};

export interface PathogenFormModel {
  notifierFacility?: NotifierFacilityFormModel;
  notifiedPerson?: NotifiedPersonFormModel | DeepPartial<NotifiedPersonAnonymous>;
  notifiedPersonAnonymous?: DeepPartial<NotifiedPersonAnonymous>;
  submittingFacility?: SubmittingFacilityFormModel;
  notificationCategory?: DeepPartial<NotificationLaboratoryCategory>;
  pathogenDTO: DeepPartial<PathogenDTO>;
}
