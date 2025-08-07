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

import { NotificationType } from '../common/routing-helper';

export namespace PathogenFormInfos {
  export const insertAllKnownInfosToFulfillReportingObligation: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48 primary-color-icon">info_outline</span>
      <span class="message">Grundsätzlich müssen Sie gemäß Infektionsschutzgesetz alle Ihnen vorliegenden Informationen im Meldeformular angeben, um die Meldepflicht zu erfüllen. Die Nachmeldung oder Korrektur von Angaben hat unverzüglich zu erfolgen.</span>
    </div>
  `;

  export const specificReportingObligations = (notificationType: NotificationType): string => {
    if (notificationType === NotificationType.NominalNotification7_1) {
      return PathogenFormInfos.stateSpecificReportingObligations;
    } else if (notificationType === NotificationType.FollowUpNotification7_1) {
      return PathogenFormInfos.followUpNotificationSpecificReportingObligations;
    }
    return '';
  };

  export const stateSpecificReportingObligations: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48 primary-color-icon">info_outline</span>
      <span class="message">Einzelne Bundesländer haben Gesetze und Verordnungen, die die Meldepflichten nach dem Infektionsschutzgesetz erweitern. Diese Meldepflichten gelten für Ihr Labor, wenn es in einem der betroffenen Bundesländern angesiedelt ist. Absprachen darüber hinaus sind freiwillig. Die DropDown-Liste der Erreger zeigt Ihnen die Meldetatbestände, die für das ausgewählte Bundesland meldepflichtig sind.</span>
    </div>
`;
  export const followUpNotificationSpecificReportingObligations: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48 primary-color-icon">info_outline</span>
      <span class="message">Dies ist eine Folgemeldung, die sich auf die von Ihnen angegebene initiale Meldungs-ID bezieht. Damit ist der Meldetatbestand vorgegeben. Die benötigten Daten der betroffenen Person wurden in der Initialmeldung bereits angegeben und werden per Meldungs-ID verknüpft.</span>
    </div>
`;
  export const personalDataWillBeStoredInLocalStorage: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48 primary-color-icon">info_outline</span>
      <span class="message">Die Informationen aus den Eingabefeldern zur meldenden Person werden <i>lokal im aktuellen Browser</i> gespeichert. Bei Folgemeldungen werden diese Eingabefelder automatisch mit den gespeicherten Daten vorbefüllt, damit der Meldevorgang beschleunigt wird.</span>
    </div>
  `;
}
export const specificReportingObligations = PathogenFormInfos.specificReportingObligations;
