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

import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FollowUpNotificationIdService } from '@gematik/demis-portal-core-library';
import { NGXLogger } from 'ngx-logger';
import { from, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { NotificationLaboratoryCategory } from '../../api/notification';
import { NotificationType } from '../pathogen-notification/common/routing-helper';
import { findCodeDisplayByCodeValue } from '../pathogen-notification/legacy/common-utils';
import { ClipboardDataService } from '../pathogen-notification/services/clipboard-data.service';
import { FhirPathogenNotificationService } from '../pathogen-notification/services/fhir-pathogen-notification.service';
import { PathogenNotificationStorageService } from '../pathogen-notification/services/pathogen-notification-storage.service';
import { dummyDataForPathogenForm } from '../pathogen-notification/utils/dummy-data';
import { isFollowUpNotification } from '../pathogen-notification/utils/pathogen-notification-mapper';
import { PathogenNotificationService, PathogenReferenceData } from './pathogen-notification.service';

@Injectable({ providedIn: 'root' })
export class PathogenNotificationPrefillService {
  private readonly notificationService = inject(PathogenNotificationService);
  private readonly fhirService = inject(FhirPathogenNotificationService);
  private readonly storageService = inject(PathogenNotificationStorageService);
  private readonly clipboardDataService = inject(ClipboardDataService);
  private readonly followUpNotificationIdService = inject(FollowUpNotificationIdService);
  private readonly logger = inject(NGXLogger);
  private readonly destroyRef = inject(DestroyRef);
  private readonly prefillCancelled = new Subject<void>();

  cancelPendingPrefill(): void {
    this.prefillCancelled.next();
  }

  /** Loads reference data before applying the notification-type-specific dummy form. */
  populateWithDummyData(): void {
    if (!this.notificationService.formsInitialized()) {
      this.logger.error('Dummy data cannot be applied before form initialization.');
      return;
    }

    this.cancelPendingPrefill();
    const notificationType = this.notificationService.notificationType;
    const data = dummyDataForPathogenForm(notificationType);
    const federalStateCode = data.notificationCategory.federalState ?? 'DE-BW';
    const pathogenCode: string = data.pathogenDTO.codeDisplay.code;

    this.loadPathogenReferenceData(pathogenCode, federalStateCode)
      .pipe(takeUntil(this.prefillCancelled), takeUntil(this.notificationService.initializationCancelled$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: referenceData => {
          this.notificationService.resetPathogenDiagnostics();
          this.notificationService.applyPathogenReferenceData(referenceData, federalStateCode);
          this.notificationService.applyPrefillData({
            ...data,
            notificationCategory: {
              ...data.notificationCategory,
              federalState: federalStateCode,
              notifiablePathogen: this.notificationService.toPathogenFormValue(referenceData.pathogen),
              ...(isFollowUpNotification(notificationType) && {
                initialNotificationId: this.followUpNotificationIdService.validatedNotificationId(),
                notificationIdReference: NotificationLaboratoryCategory.NotificationIdReferenceEnum.RelatesToOtherFacility,
              }),
            },
          });
        },
        error: error => this.logger.error('Failed to populate dummy data.', error),
      });
  }

  /** Loads diagnostics before resolving clipboard codes and patching the step forms. */
  populateFromClipboard(entries: Map<string, string>): void {
    if (!this.notificationService.formsInitialized()) {
      this.logger.error('Clipboard data cannot be applied before form initialization.');
      return;
    }

    this.cancelPendingPrefill();
    const notificationType = this.notificationService.notificationType;
    const selected = this.storageService.getSelectedPathogenCodeDisplay();
    const code = (isFollowUpNotification(notificationType) ? undefined : entries.get('T.notificationCategory')) || selected?.code;
    const federalStateCode = this.notificationService.getStoredFederalStateCode();
    const hasNotificationData = [...entries].some(([key, value]) => key.startsWith('T.') && !!value);

    let pathogenReferenceData$: Observable<PathogenReferenceData | undefined>;
    if (!code || !hasNotificationData) {
      // Person and facility imports do not require pathogen reference data.
      pathogenReferenceData$ = of(undefined);
    } else if (selected?.code === code && this.notificationService.pathogenData) {
      // Reuse loaded diagnostics when the selected notification category has not changed.
      pathogenReferenceData$ = of({
        pathogen: selected,
        diagnostics: this.notificationService.pathogenData,
        pathogens: this.notificationService.pathogenCodeDisplays,
      });
    } else {
      // Resolve the category first, then load the value sets needed to map diagnostic codes.
      pathogenReferenceData$ = this.loadPathogenReferenceData(code, federalStateCode);
    }

    pathogenReferenceData$
      .pipe(
        switchMap(pathogenReferenceData =>
          from(this.clipboardDataService.mapClipboardData(entries, notificationType, pathogenReferenceData?.diagnostics)).pipe(
            map(clipboardData => ({ pathogenReferenceData, clipboardData }))
          )
        ),
        takeUntil(this.prefillCancelled),
        takeUntil(this.notificationService.initializationCancelled$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ pathogenReferenceData, clipboardData }) => {
          if (pathogenReferenceData) {
            this.notificationService.applyPathogenReferenceData(pathogenReferenceData, federalStateCode);
            clipboardData.notificationCategory = {
              ...clipboardData.notificationCategory,
              federalState: federalStateCode,
              notifiablePathogen: this.notificationService.toPathogenFormValue(pathogenReferenceData.pathogen),
            };
            clipboardData.pathogenDTO = { ...clipboardData.pathogenDTO, codeDisplay: pathogenReferenceData.pathogen };
          }
          this.notificationService.applyPrefillData(clipboardData, { mergeArrays: true });
        },
        error: error => this.logger.error('Failed to populate clipboard data.', error),
      });
  }

  /** Loads the available categories and the diagnostic value sets for the requested pathogen. */
  private loadPathogenReferenceData(code: string, federalStateCode: string): Observable<PathogenReferenceData> {
    const notificationType = this.notificationService.notificationType;
    const followUpCategory = notificationType === NotificationType.FollowUpNotification7_1 ? '7.1' : '7.3';
    const pathogens$ = isFollowUpNotification(notificationType)
      ? this.fhirService.fetchAllPathogenCodeDisplays(followUpCategory)
      : this.fhirService.fetchPathogenCodeDisplaysByTypeAndState(notificationType, federalStateCode);

    return pathogens$.pipe(
      take(1),
      switchMap(pathogens => {
        const pathogen = findCodeDisplayByCodeValue(pathogens, code);
        if (!pathogen) throw new Error(`Pathogen "${code}" is not available.`);
        return this.fhirService.fetchDiagnosticsBasedOnPathogenSelection(pathogen.code, notificationType).pipe(
          take(1),
          map(diagnostics => ({ pathogen, diagnostics, pathogens }))
        );
      })
    );
  }
}
