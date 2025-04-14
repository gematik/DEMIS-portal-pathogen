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

import {
  AddressType,
  MethodPathogenDTO,
  NotificationLaboratoryCategory,
  NotifiedPersonBasicInfo,
  PractitionerInfo,
  ResistanceDTO,
  ResistanceGeneDTO,
} from '../../../api/notification';
import GenderEnum = NotifiedPersonBasicInfo.GenderEnum;
import SalutationEnum = PractitionerInfo.SalutationEnum;

import ResultEnum = MethodPathogenDTO.ResultEnum;
import ReportStatusEnum = NotificationLaboratoryCategory.ReportStatusEnum;
import ResistanceResultEnum = ResistanceDTO.ResistanceResultEnum;
import ResistanceGeneResultEnum = ResistanceGeneDTO.ResistanceGeneResultEnum;

export const RESIDENCE_ADDRESS_TYPE_OPTION_LIST = [
  { value: AddressType.Primary, label: 'Hauptwohnung' },
  { value: AddressType.Ordinary, label: 'Gewöhnlicher Aufenthaltsort' },
];

export const CURRENT_ADDRESS_TYPE_OPTION_LIST = [
  { value: AddressType.PrimaryAsCurrent, label: 'Wohnsitz' },
  { value: AddressType.SubmittingFacility, label: 'Adresse der Einsender-Einrichtung' },
  { value: AddressType.Current, label: 'anderer Wohnsitz' },
  { value: AddressType.OtherFacility, label: 'andere Einrichtung / Unterkunft' },
];

export const EXIST_BS_NR_OPTION_LIST = [
  { value: true, label: 'Vorhanden' },
  { value: false, label: 'Nicht vorhanden' },
];

export const GENDER_OPTION_LIST = [
  { value: GenderEnum.Male, label: 'Männlich' },
  { value: GenderEnum.Female, label: 'Weiblich' },
  { value: GenderEnum.Other, label: 'Divers' },
  { value: GenderEnum.Unknown, label: 'Keine Angabe' },
];

export const INSTITUTION_TYPE_OPTION_LIST = [
  { value: 'work', label: 'Dienstlich' },
  { value: 'home', label: 'Privat' },
];

export const SALUTATION_OPTION_LIST = [
  { value: SalutationEnum.Mrs, label: 'Frau' },
  { value: SalutationEnum.Mr, label: 'Herr' },
];

export const SYMPTOMS_OPTION_LIST = [];

export const RESULT_OPTION_LIST = [
  { value: ResultEnum.Pos, label: 'Positiv' },
  { value: ResultEnum.Neg, label: 'Negativ' },
];

export const REPORT_STATUS_OPTION_LIST = [
  { value: ReportStatusEnum.Final, label: 'Endgültig' },
  { value: ReportStatusEnum.Preliminary, label: 'Vorläufig' },
  { value: ReportStatusEnum.Amended, label: 'Ergänzung oder Korrektur' },
];

export const RESISTANCE_RESULT_OPTION_LIST = [
  { value: ResistanceResultEnum.Resistant, label: 'Resistent' },
  {
    value: ResistanceResultEnum.SusceptibleWithIncreasedExposure,
    label: 'Sensibel bei erhöhter Exposition',
  },
  { value: ResistanceResultEnum.Intermediate, label: 'Intermediär' },
  { value: ResistanceResultEnum.Susceptible, label: 'Sensibel' },
  { value: ResistanceResultEnum.Indeterminate, label: 'Uneindeutig' },
];
export const RESISTANCE_GENE_RESULT_OPTION_LIST = [
  { value: ResistanceGeneResultEnum.Detected, label: 'Nachgewiesen/Resistent' },
  { value: ResistanceGeneResultEnum.NotDetected, label: 'Nicht nachgewiesen/Sensibel' },
  { value: ResistanceGeneResultEnum.Indeterminate, label: 'Uneindeutig' },
];
