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

import { CodeDisplay, ContactPointInfo } from '../../../../api/notification';
import { findCodeDisplayByCodeValue, formatCodeDisplayToDisplay, parseGender, parseSalutation } from '../../legacy/common-utils';

export type ClipboardRules = Record<string, (key: string, partialModel: any) => any | Promise<any>>;

export function addContact(contactType: ContactPointInfo.ContactTypeEnum, value: string, contacts: ContactPointInfo[]): ContactPointInfo[] {
  if (contacts.some(c => c.contactType === contactType && c.value === value)) return contacts;
  return [...contacts, { contactType, value }].filter(c => c.contactType !== contactType || c.value);
}

export enum ClipboardErrorTexts {
  CLIPBOARD_ERROR_DIALOG_TITLE = 'Fehler beim Einlesen der Daten aus der Zwischenablage',
  CLIPBOARD_ERROR_DIALOG_MESSAGE = 'Bei der Datenübernahme ist ein Fehler aufgetreten.',
  CLIPBOARD_ERROR_DIALOG_MESSAGE_DETAILS = 'Diese Daten werden aus der Zwischenablage importiert. Bitte wenden Sie sich an Ihre IT zur Konfiguration des Datenimports. Weitere Informationen finden Sie in der DEMIS Wissensdatenbank unter "<a href="https://wiki.gematik.de/x/fGFCH" target="_blank">Übergabe von Daten aus dem Primärsystem</a>".',
}

export const initialModelForClipboard = (pathogenValueFromClipboard: string, pathogenCodeDisplays: CodeDisplay[]) => {
  let pathogenDisplay = '';
  if (pathogenValueFromClipboard) {
    pathogenDisplay = formatCodeDisplayToDisplay(findCodeDisplayByCodeValue(pathogenCodeDisplays, pathogenValueFromClipboard));
  }
  return {
    pathogen: pathogenValueFromClipboard,
    notificationCategory: {
      federalStateCodeDisplay: 'DE-BW',
      pathogenDisplay: pathogenDisplay,
    },
    pathogenDTO: {
      codeDisplay: findCodeDisplayByCodeValue(pathogenCodeDisplays, pathogenValueFromClipboard),
      specimenList: [{}],
    },
  };
};

const getNotifierFacilityContactsEmail = (value: string, model: any) => {
  return {
    notifierFacility: {
      contacts: addContact('email', value, model?.notifierFacility?.contacts ? model.notifierFacility.contacts : []),
    },
  };
};

const getNotifierFacilityContactsPhone = (value: string, model: any) => {
  return {
    notifierFacility: {
      contacts: addContact('phone', value, model?.notifierFacility?.contacts ? model.notifierFacility.contacts : []),
    },
  };
};

const getNotifiedPersonContactEmail = (value: string, model: any) => {
  return {
    notifiedPerson: {
      contacts: addContact('email', value, model?.notifiedPerson?.contacts ? model.notifiedPerson.contacts : []),
    },
  };
};

const getNotifiedPersonContactsPhone = (value: string, model: any) => {
  return {
    notifiedPerson: {
      contacts: addContact('phone', value, model?.notifiedPerson?.contacts ? model.notifiedPerson.contacts : []),
    },
  };
};

export const FACILITY_RULES: ClipboardRules = {
  'F.name': value => ({
    notifierFacility: { facilityInfo: { institutionName: value } },
  }),
  'F.bsnr': value => ({
    notifierFacility: { facilityInfo: { existsBsnr: true, bsnr: value } },
  }),
  'F.street': value => ({ notifierFacility: { address: { street: value } } }),
  'F.houseNumber': value => ({
    notifierFacility: { address: { houseNumber: value } },
  }),
  'F.zip': value => ({ notifierFacility: { address: { zip: value } } }),
  'F.city': value => ({ notifierFacility: { address: { city: value } } }),

  'N.salutation': async value => {
    const fromClipboard = parseSalutation(value);
    return { notifierFacility: { contact: { salutation: fromClipboard } } };
  },
  'N.prefix': value => ({ notifierFacility: { contact: { prefix: value } } }),
  'N.given': value => ({
    notifierFacility: { contact: { firstname: value } },
  }),
  'N.family': value => ({
    notifierFacility: { contact: { lastname: value } },
  }),
  'N.phone': (value, model) => getNotifierFacilityContactsPhone(value, model),
  'N.email': (value, model) => getNotifierFacilityContactsEmail(value, model),
  'N.phone2': (value, model) => getNotifierFacilityContactsPhone(value, model),
  'N.email2': (value, model) => getNotifierFacilityContactsEmail(value, model),
};

export const PERSON_RULES: ClipboardRules = {
  // piggybacking on fillModels error detection here, we don't really need a promise
  'P.gender': async value => {
    const fromClipboard = parseGender(value);
    return { notifiedPerson: { info: { gender: fromClipboard } } };
  },
  'P.given': value => ({ notifiedPerson: { info: { firstname: value } } }),
  'P.family': value => ({ notifiedPerson: { info: { lastname: value } } }),
  'P.birthDate': value => ({
    notifiedPerson: { info: { birthDate: value } },
  }),
  'P.phone': (value, model) => getNotifiedPersonContactsPhone(value, model),
  'P.email': (value, model) => getNotifiedPersonContactEmail(value, model),
  'P.phone2': (value, model) => getNotifiedPersonContactsPhone(value, model),
  'P.email2': (value, model) => getNotifiedPersonContactEmail(value, model),
  'P.r.type': value => ({ notifiedPerson: { residenceAddress: { addressType: value } } }),
  'P.r.street': value => ({ notifiedPerson: { residenceAddress: { street: value } } }),
  'P.r.houseNumber': value => ({ notifiedPerson: { residenceAddress: { houseNumber: value } } }),
  'P.r.zip': value => ({ notifiedPerson: { residenceAddress: { zip: value } } }),
  'P.r.city': value => ({ notifiedPerson: { residenceAddress: { city: value } } }),
  'P.r.country': value => ({ notifiedPerson: { residenceAddress: { country: value } } }),
  'P.c.type': value => ({ notifiedPerson: { currentAddress: { addressType: value } } }),
  'P.c.name': value => ({ notifiedPerson: { currentAddress: { additionalInfo: value } } }),
  'P.c.street': value => ({ notifiedPerson: { currentAddress: { street: value } } }),
  'P.c.houseNumber': value => ({ notifiedPerson: { currentAddress: { houseNumber: value } } }),
  'P.c.zip': value => ({ notifiedPerson: { currentAddress: { zip: value } } }),
  'P.c.city': value => ({ notifiedPerson: { currentAddress: { city: value } } }),
  'P.c.country': value => ({ notifiedPerson: { currentAddress: { country: value } } }),
};
