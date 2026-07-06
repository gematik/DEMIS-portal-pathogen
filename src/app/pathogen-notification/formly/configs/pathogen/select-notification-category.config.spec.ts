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

import { FormlyFieldConfig } from '@ngx-formly/core';
import { NotificationLaboratoryCategory } from 'src/api/notification';
import { NotificationType } from '../../../common/routing-helper';
import { applyFilter, selectNotificationCategoryFields } from './select-notification-category.config';
import { environment } from 'src/environments/environment';
import { validateUUID } from '../../../legacy/notification-form-validation-module';
import ReportStatusEnum = NotificationLaboratoryCategory.ReportStatusEnum;
import NotificationIdReferenceEnum = NotificationLaboratoryCategory.NotificationIdReferenceEnum;

describe('selectNotificationCategoryFields', () => {
  const federalStateCodeDisplays = [
    { code: 'DE-BY', display: 'Bayern' },
    { code: 'DE-BE', display: 'Berlin' },
  ];
  const pathogenDisplays = ['Influenza', 'SARS-CoV-2'];
  const subPathogenDisplays = ['Influenza A', 'Influenza B'];

  beforeEach(() => {
    environment.pathogenConfig = {
      production: false,
      pathToGateway: '',
      gatewayPaths: {},
      featureFlags: { FEATURE_FLAG_REFERENCE_FIELD: false },
      ngxLoggerConfig: { level: 0, disableConsoleLogging: true, serverLogLevel: 0 },
      pathToFuts: '',
      futsPaths: {},
      pathToDestinationLookup: '',
    } as any;
  });

  const getFields = (notificationType = NotificationType.NominalNotification7_1) => {
    return selectNotificationCategoryFields(federalStateCodeDisplays, pathogenDisplays, subPathogenDisplays, notificationType);
  };

  const findFieldById = (fields: FormlyFieldConfig[], id: string): FormlyFieldConfig | undefined => {
    for (const field of fields) {
      if (field.id === id) return field;
      if (field.fieldGroup) {
        const found = findFieldById(field.fieldGroup, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const findFieldByKey = (fields: FormlyFieldConfig[], key: string): FormlyFieldConfig | undefined => {
    for (const field of fields) {
      if (field.key === key) return field;
      if (field.fieldGroup) {
        const found = findFieldByKey(field.fieldGroup, key);
        if (found) return found;
      }
    }
    return undefined;
  };

  describe('general structure', () => {
    it('should return an array of FormlyFieldConfig', () => {
      const fields = getFields();
      expect(fields).toBeDefined();
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThan(0);
    });

    it('should contain pathogenDisplay field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'pathogenDisplay');
      expect(field).toBeDefined();
      expect(field!.type).toBe('autocomplete');
      expect(field!.props!.label).toBe('Meldepflichtiger Krankheitserreger');
      expect(field!.props!.required).toBe(true);
    });

    it('should contain pathogen field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'pathogen');
      expect(field).toBeDefined();
      expect(field!.type).toBe('autocomplete');
      expect(field!.props!.label).toBe('Nachgewiesene Erregerspezies');
    });

    it('should contain reportStatus field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'reportStatus');
      expect(field).toBeDefined();
      expect(field!.type).toBe('radio');
      expect(field!.props!.required).toBe(true);
    });

    it('should contain interpretation field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'interpretation');
      expect(field).toBeDefined();
      expect(field!.type).toBe('textarea');
    });

    it('should contain initialNotificationId field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'initialNotificationId');
      expect(field).toBeDefined();
      expect(field!.type).toBe('input');
    });

    it('should contain laboratoryOrderId field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'laboratoryOrderId');
      expect(field).toBeDefined();
      expect(field!.type).toBe('input');
      expect(field!.props!.maxLength).toBe(50);
    });

    it('should contain favoriteAddPathogen field', () => {
      const fields = getFields();
      const field = findFieldByKey(fields, 'favoriteAddPathogen');
      expect(field).toBeDefined();
      expect(field!.fieldGroup).toBeDefined();
    });
  });

  describe('federal state selection', () => {
    it('should show federal state for NominalNotification7_1', () => {
      const fields = getFields(NotificationType.NominalNotification7_1);
      const field = findFieldById(fields, 'federalStateCodeDisplay');
      const hideFn = field!.expressions!['hide'] as () => boolean;
      expect(hideFn()).toBe(false);
    });

    it('should hide federal state for NonNominalNotification7_3', () => {
      const fields = getFields(NotificationType.NonNominalNotification7_3);
      const field = findFieldById(fields, 'federalStateCodeDisplay');
      const hideFn = field!.expressions!['hide'] as () => boolean;
      expect(hideFn()).toBe(true);
    });

    it('should map federal state options correctly', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'federalStateCodeDisplay');
      expect(field!.props!.options).toEqual([
        { value: 'DE-BY', label: 'Bayern' },
        { value: 'DE-BE', label: 'Berlin' },
      ]);
    });
  });

  describe('favoritePathogen visibility', () => {
    it('should hide favoritePathogen for FollowUp notification', () => {
      const fields = getFields(NotificationType.FollowUpNotification7_1);
      const favoriteField = findFieldByKey(fields, 'favoriteAddPathogen');
      const innerField = favoriteField!.fieldGroup![0];
      const hideFn = innerField.expressions!['hide'] as () => boolean;
      expect(hideFn()).toBe(true);
    });

    it('should show favoritePathogen for non-FollowUp notification', () => {
      const fields = getFields(NotificationType.NominalNotification7_1);
      const favoriteField = findFieldByKey(fields, 'favoriteAddPathogen');
      const innerField = favoriteField!.fieldGroup![0];
      const hideFn = innerField.expressions!['hide'] as () => boolean;
      expect(hideFn()).toBe(false);
    });
  });

  describe('pathogenDisplay disabled expression', () => {
    it('should disable pathogenDisplay for FollowUp notification', () => {
      const fields = getFields(NotificationType.FollowUpNotification7_1);
      const field = findFieldById(fields, 'pathogenDisplay');
      const disabledFn = field!.expressions!['props.disabled'] as () => boolean;
      expect(disabledFn()).toBe(true);
    });

    it('should not disable pathogenDisplay for non-FollowUp notification', () => {
      const fields = getFields(NotificationType.NominalNotification7_1);
      const field = findFieldById(fields, 'pathogenDisplay');
      const disabledFn = field!.expressions!['props.disabled'] as () => boolean;
      expect(disabledFn()).toBe(false);
    });
  });

  describe('pathogen disabled expression', () => {
    it('should disable pathogen when pathogenDisplay is not set', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'pathogen');
      const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(true);
    });

    it('should enable pathogen when pathogenDisplay is set', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'pathogen');
      const mockField = { parent: { model: { pathogenDisplay: 'Influenza' } } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(false);
    });
  });

  describe('when isReferenceFieldEnabled is true', () => {
    beforeEach(() => {
      environment.pathogenConfig.featureFlags = { FEATURE_FLAG_REFERENCE_FIELD: true };
    });

    it('should contain notificationIdReference field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'notificationIdReference');
      expect(field).toBeDefined();
      expect(field!.type).toBe('radio');
      expect(field!.props!.required).toBe(true);
      expect(field!.props!.label).toBe('Verweis auf vorherige Meldung (Initiale Meldungs-ID)');
    });

    it('should set defaultValue of notificationIdReference to RelatesToOtherFacility for FollowUp', () => {
      const fields = getFields(NotificationType.FollowUpNotification7_1);
      const field = findFieldById(fields, 'notificationIdReference');
      expect(field!.defaultValue).toBe(NotificationIdReferenceEnum.RelatesToOtherFacility);
    });

    it('should set defaultValue of notificationIdReference to undefined for non-FollowUp', () => {
      const fields = getFields(NotificationType.NominalNotification7_1);
      const field = findFieldById(fields, 'notificationIdReference');
      expect(field!.defaultValue).toBeUndefined();
    });

    it('should disable notificationIdReference for FollowUp notification', () => {
      const fields = getFields(NotificationType.FollowUpNotification7_1);
      const field = findFieldById(fields, 'notificationIdReference');
      const mockField = { parent: { model: { pathogen: 'something' } } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(true);
    });

    it('should disable notificationIdReference when pathogen is not set', () => {
      const fields = getFields(NotificationType.NominalNotification7_1);
      const field = findFieldById(fields, 'notificationIdReference');
      const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(true);
    });

    it('should enable notificationIdReference when not FollowUp and pathogen is set', () => {
      const fields = getFields(NotificationType.NominalNotification7_1);
      const field = findFieldById(fields, 'notificationIdReference');
      const mockField = { parent: { model: { pathogen: 'something' } } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(false);
    });

    describe('template expression for initial notification ID hint', () => {
      it('should show OWN_FACILITY text when notificationIdReference is RelatesToOwnFacility', () => {
        const fields = getFields();
        const templateField = findFieldWithTemplateExpression(fields)!;
        const mockField = {
          parent: { model: { notificationIdReference: NotificationIdReferenceEnum.RelatesToOwnFacility } },
        } as unknown as FormlyFieldConfig;
        const templateFn = templateField.expressions!['template'] as (f: FormlyFieldConfig) => string;
        expect(templateFn(mockField)).toContain('um sie für diese Meldung als Meldungs-ID nachzunutzen');
      });

      it('should show OTHER_FACILITY text when notificationIdReference is RelatesToOtherFacility', () => {
        const fields = getFields();
        const templateField = findFieldWithTemplateExpression(fields)!;
        const mockField = {
          parent: { model: { notificationIdReference: NotificationIdReferenceEnum.RelatesToOtherFacility } },
        } as unknown as FormlyFieldConfig;
        const templateFn = templateField.expressions!['template'] as (f: FormlyFieldConfig) => string;
        expect(templateFn(mockField)).toContain('um den Meldungsverweis zu setzen');
      });

      it('should show NO_REFERENCE text when notificationIdReference is NoReference', () => {
        const fields = getFields();
        const templateField = findFieldWithTemplateExpression(fields)!;
        const mockField = {
          parent: { model: { notificationIdReference: NotificationIdReferenceEnum.NoReference } },
        } as unknown as FormlyFieldConfig;
        const templateFn = templateField.expressions!['template'] as (f: FormlyFieldConfig) => string;
        expect(templateFn(mockField)).toContain('eine neue Meldungs-ID erzeugt');
      });

      it('should show NO_REFERENCE text when notificationIdReference is not set', () => {
        const fields = getFields();
        const templateField = findFieldWithTemplateExpression(fields)!;
        const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
        const templateFn = templateField.expressions!['template'] as (f: FormlyFieldConfig) => string;
        expect(templateFn(mockField)).toContain('eine neue Meldungs-ID erzeugt');
      });
    });

    describe('initialNotificationId disabled expression', () => {
      it('should disable when FollowUp notification', () => {
        const fields = getFields(NotificationType.FollowUpNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = {
          parent: { model: { pathogen: 'test', notificationIdReference: NotificationIdReferenceEnum.RelatesToOwnFacility } },
        } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(true);
      });

      it('should disable when pathogen is not set', () => {
        const fields = getFields(NotificationType.NominalNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { notificationIdReference: NotificationIdReferenceEnum.RelatesToOwnFacility } } } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(true);
      });

      it('should disable when notificationIdReference is NoReference', () => {
        const fields = getFields(NotificationType.NominalNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = {
          parent: { model: { pathogen: 'test', notificationIdReference: NotificationIdReferenceEnum.NoReference } },
        } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(true);
      });

      it('should enable when pathogen is set, not FollowUp, and reference is set', () => {
        const fields = getFields(NotificationType.NominalNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = {
          parent: { model: { pathogen: 'test', notificationIdReference: NotificationIdReferenceEnum.RelatesToOwnFacility } },
        } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(false);
      });
    });

    describe('initialNotificationId required expression', () => {
      it('should be required when notificationIdReference is RelatesToOwnFacility', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = {
          parent: { model: { notificationIdReference: NotificationIdReferenceEnum.RelatesToOwnFacility } },
        } as unknown as FormlyFieldConfig;
        const requiredFn = field!.expressions!['props.required'] as (f: FormlyFieldConfig) => boolean;
        expect(requiredFn(mockField)).toBe(true);
      });

      it('should be required when notificationIdReference is RelatesToOtherFacility', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = {
          parent: { model: { notificationIdReference: NotificationIdReferenceEnum.RelatesToOtherFacility } },
        } as unknown as FormlyFieldConfig;
        const requiredFn = field!.expressions!['props.required'] as (f: FormlyFieldConfig) => boolean;
        expect(requiredFn(mockField)).toBe(true);
      });

      it('should not be required when notificationIdReference is NoReference', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = {
          parent: { model: { notificationIdReference: NotificationIdReferenceEnum.NoReference } },
        } as unknown as FormlyFieldConfig;
        const requiredFn = field!.expressions!['props.required'] as (f: FormlyFieldConfig) => boolean;
        expect(requiredFn(mockField)).toBe(false);
      });

      it('should not be required when notificationIdReference is not set', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
        const requiredFn = field!.expressions!['props.required'] as (f: FormlyFieldConfig) => boolean;
        expect(requiredFn(mockField)).toBe(false);
      });
    });

    describe('initialNotificationIdClassName (with reference field)', () => {
      it('should gray out when pathogen is not set', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
        const classNameFn = field!.expressions!['className'] as (f: FormlyFieldConfig) => string;
        expect(classNameFn(mockField)).toContain('grayed-out-element');
      });

      it('should not gray out when pathogen is set', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { pathogen: 'invp' } } } as unknown as FormlyFieldConfig;
        const classNameFn = field!.expressions!['className'] as (f: FormlyFieldConfig) => string;
        expect(classNameFn(mockField)).not.toContain('grayed-out-element');
      });

      it('should gray out for FollowUp notification', () => {
        const fields = getFields(NotificationType.FollowUpNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { notificationIdReference: NotificationIdReferenceEnum.RelatesToOwnFacility } } } as unknown as FormlyFieldConfig;
        const classNameFn = field!.expressions!['className'] as (f: FormlyFieldConfig) => string;
        expect(classNameFn(mockField)).toContain('grayed-out-element');
      });
    });

    describe('initialNotificationId UUID validation', () => {
      it('should include uuidValidator in validators', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        expect(field!.validators!.validation).toContain('uuidValidator');
      });

      it('should return error message for invalid UUID format', () => {
        const result = validateUUID('invalid-uuid-format');
        expect(result).toEqual({ fieldMatch: { message: 'Die Meldungs-ID muss dem UUID-Format entsprechen.' } });
      });

      it('should return error message for partially valid UUID', () => {
        const result = validateUUID('12345678-1234-1234-1234');
        expect(result).toEqual({ fieldMatch: { message: 'Die Meldungs-ID muss dem UUID-Format entsprechen.' } });
      });

      it('should return null for valid UUID', () => {
        const result = validateUUID('12345678-1234-1234-1234-123456789abc');
        expect(result).toBeNull();
      });

      it('should return null for empty value', () => {
        const result = validateUUID('');
        expect(result).toBeNull();
      });

      it('should return null for null value', () => {
        const result = validateUUID(null);
        expect(result).toBeNull();
      });
    });
  });

  describe('when isReferenceFieldEnabled is false', () => {
    beforeEach(() => {
      environment.pathogenConfig.featureFlags = { FEATURE_FLAG_REFERENCE_FIELD: false };
    });

    it('should not contain notificationIdReference field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'notificationIdReference');
      expect(field).toBeUndefined();
    });

    it('should contain initialNotificationId field', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'initialNotificationId');
      expect(field).toBeDefined();
    });

    it('should use static INITIAL_NOTIFICATION_ID_HINT template', () => {
      const fields = getFields();
      const templateField = findFieldWithStaticTemplate(fields, 'Bitte geben Sie die Meldungs-ID');
      expect(templateField).toBeDefined();
    });

    describe('initialNotificationIdClassName (without reference field)', () => {
      it('should gray out when reportStatus is not Amended', () => {
        const fields = getFields();
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { reportStatus: ReportStatusEnum.Final } } } as unknown as FormlyFieldConfig;
        const classNameFn = field!.expressions!['className'] as (f: FormlyFieldConfig) => string;
        expect(classNameFn(mockField)).toContain('grayed-out-element');
      });

      it('should gray out for FollowUp notification even with Amended status', () => {
        const fields = getFields(NotificationType.FollowUpNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { reportStatus: ReportStatusEnum.Amended } } } as unknown as FormlyFieldConfig;
        const classNameFn = field!.expressions!['className'] as (f: FormlyFieldConfig) => string;
        expect(classNameFn(mockField)).toContain('grayed-out-element');
      });

      it('should not gray out when reportStatus is Amended and not FollowUp', () => {
        const fields = getFields(NotificationType.NominalNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { reportStatus: ReportStatusEnum.Amended } } } as unknown as FormlyFieldConfig;
        const classNameFn = field!.expressions!['className'] as (f: FormlyFieldConfig) => string;
        expect(classNameFn(mockField)).not.toContain('grayed-out-element');
      });
    });

    describe('initialNotificationId disabled expression', () => {
      it('should disable when FollowUp notification', () => {
        const fields = getFields(NotificationType.FollowUpNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { pathogen: 'test' } } } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(true);
      });

      it('should disable when pathogen is not set', () => {
        const fields = getFields(NotificationType.NominalNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(true);
      });

      it('should enable when not FollowUp and pathogen is set', () => {
        const fields = getFields(NotificationType.NominalNotification7_1);
        const field = findFieldById(fields, 'initialNotificationId');
        const mockField = { parent: { model: { pathogen: 'test' } } } as unknown as FormlyFieldConfig;
        const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
        expect(disabledFn(mockField)).toBe(false);
      });
    });
  });

  describe('reportClassName expression', () => {
    it('should gray out Befund header when pathogen is not set', () => {
      const fields = getFields();
      const befundField = fields.find(f => f.template === '<h2>Befund</h2>');
      expect(befundField).toBeDefined();
      const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
      const classNameFn = befundField!.expressions!['className'] as (f: FormlyFieldConfig) => string;
      expect(classNameFn(mockField)).toContain('grayed-out-element');
    });

    it('should not gray out Befund header when pathogen is set', () => {
      const fields = getFields();
      const befundField = fields.find(f => f.template === '<h2>Befund</h2>');
      const mockField = { parent: { model: { pathogen: 'Influenza' } } } as unknown as FormlyFieldConfig;
      const classNameFn = befundField!.expressions!['className'] as (f: FormlyFieldConfig) => string;
      expect(classNameFn(mockField)).not.toContain('grayed-out-element');
    });
  });

  describe('reportStatus disabled expression', () => {
    it('should disable reportStatus when pathogen is not set', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'reportStatus');
      const mockField = { parent: { model: {} } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(true);
    });

    it('should enable reportStatus when pathogen is set', () => {
      const fields = getFields();
      const field = findFieldById(fields, 'reportStatus');
      const mockField = { parent: { model: { pathogen: 'Influenza' } } } as unknown as FormlyFieldConfig;
      const disabledFn = field!.expressions!['props.disabled'] as (f: FormlyFieldConfig) => boolean;
      expect(disabledFn(mockField)).toBe(false);
    });
  });
});

describe('applyFilter', () => {
  const testData = ['Alpha', 'Beta', 'Gamma', 'AlphaBeta'];

  it('should return filtered data when term is provided', done => {
    applyFilter('Alpha', testData).subscribe(result => {
      expect(result).toContain('Alpha');
      expect(result).toContain('AlphaBeta');
      expect(result).not.toContain('Gamma');
      done();
    });
  });

  it('should return all data when term is empty', done => {
    applyFilter('', testData).subscribe(result => {
      expect(result.length).toBe(testData.length);
      done();
    });
  });

  it('should return a copy of data (not the same reference)', done => {
    applyFilter('', testData).subscribe(result => {
      expect(result).not.toBe(testData);
      expect(result).toEqual(testData);
      done();
    });
  });
});

// Helper functions
function findFieldWithTemplateExpression(fields: FormlyFieldConfig[]): FormlyFieldConfig | undefined {
  for (const field of fields) {
    if (field.expressions && 'template' in field.expressions && typeof field.expressions['template'] === 'function') {
      return field;
    }
    if (field.fieldGroup) {
      const found = findFieldWithTemplateExpression(field.fieldGroup);
      if (found) return found;
    }
  }
  return undefined;
}

function findFieldWithStaticTemplate(fields: FormlyFieldConfig[], containing: string): FormlyFieldConfig | undefined {
  for (const field of fields) {
    if (typeof field.template === 'string' && field.template.includes(containing)) {
      return field;
    }
    if (field.fieldGroup) {
      const found = findFieldWithStaticTemplate(field.fieldGroup, containing);
      if (found) return found;
    }
  }
  return undefined;
}
