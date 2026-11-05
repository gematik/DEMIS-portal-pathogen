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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepNavigation } from '@gematik/demis-portal-core-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PathogenNotificationService } from '../pathogen-notification.service';
import { NotificationStepActionsComponent } from './notification-step-actions.component';

describe('NotificationStepActionsComponent', () => {
  let fixture: ComponentFixture<NotificationStepActionsComponent>;
  const navigation = {
    previous: vi.fn(),
    next: vi.fn(),
    canGoToPrevious: vi.fn(),
    canGoToNext: vi.fn(),
  };
  const service = { sendData: vi.fn(), isFormValid: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    navigation.canGoToPrevious.mockReturnValue(true);
    navigation.canGoToNext.mockReturnValue(true);
    service.isFormValid.mockReturnValue(true);
    await TestBed.configureTestingModule({
      imports: [NotificationStepActionsComponent],
      providers: [
        { provide: StepNavigation, useValue: navigation },
        { provide: PathogenNotificationService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationStepActionsComponent);
  });

  it('renders only the back button on the left and respects navigation state', () => {
    fixture.componentRef.setInput('side', 'left');
    fixture.detectChanges();
    const back: HTMLButtonElement = fixture.nativeElement.querySelector('#btn-nav-action-back');
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
    back.click();
    expect(navigation.previous).toHaveBeenCalledOnce();
    navigation.canGoToPrevious.mockReturnValue(false);
    fixture.detectChanges();
    expect(back.disabled).toBe(true);
  });

  it('renders next and submit on the right and invokes the existing actions', () => {
    fixture.componentRef.setInput('side', 'right');
    fixture.detectChanges();
    const next: HTMLButtonElement = fixture.nativeElement.querySelector('#btn-nav-action-next');
    const submit: HTMLButtonElement = fixture.nativeElement.querySelector('#btn-send-notification');
    next.click();
    submit.click();
    expect(navigation.next).toHaveBeenCalledOnce();
    expect(service.sendData).toHaveBeenCalledOnce();
    navigation.canGoToNext.mockReturnValue(false);
    fixture.detectChanges();
    expect(next.disabled).toBe(true);
  });

  it('hides next for the last step and preserves accessible submit blocking', () => {
    service.isFormValid.mockReturnValue(false);
    fixture.componentRef.setInput('side', 'right');
    fixture.componentRef.setInput('showNext', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#btn-nav-action-next')).toBeNull();
    const submit: HTMLButtonElement = fixture.nativeElement.querySelector('#btn-send-notification');
    expect(submit.getAttribute('aria-disabled')).toBe('true');
    expect(submit.disabled).toBe(false);
    submit.click();
    expect(service.sendData).not.toHaveBeenCalled();
  });
});
