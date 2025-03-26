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

export namespace PathogenFormInfos {
  export const insertAllKnownInfosToFulfillReportingObligation: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48">info_outline</span>
      <span class="message">Grundsätzlich müssen Sie gemäß Infektionsschutzgesetz alle Ihnen vorliegenden Informationen im Meldeformular angeben, um die Meldepflicht zu erfüllen. Die Nachmeldung oder Korrektur von Angaben hat unverzüglich zu erfolgen.</span>
    </div>
  `;
  export const stateSpecificReportingObligations: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48">info_outline</span>
      <span class="message">Einzelne Bundesländer haben Gesetze und Verordnungen, die die Meldepflichten nach dem Infektionsschutzgesetz erweitern. Diese Meldepflichten gelten für Ihr Labor, wenn es in einem der betroffenen Bundesländern angesiedelt ist. Absprachen darüber hinaus sind freiwillig. Die DropDown-Liste der Erreger zeigt Ihnen die Meldetatbestände, die für das ausgewählte Bundesland meldepflichtig sind.</span>
    </div>
`;
  export const personalDataWillBeStoredInLocalStorage: string = `
    <div class="info-notification-text">
      <span class="material-icons md-48">info_outline</span>
      <span class="message">Die Informationen aus den Eingabefeldern zur meldenden Person werden <i>lokal im aktuellen Browser</i> gespeichert. Bei Folgemeldungen werden diese Eingabefelder automatisch mit den gespeicherten Daten vorbefüllt, damit der Meldevorgang beschleunigt wird.</span>
    </div>
  `;
}
