import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketTypePhase } from '../../../shared/models/ticket-type.model';

import { TicketPhase } from './ticket-phase';

const pastPhase: TicketTypePhase = {
  name: 'Comunidad',
  description: 'Past phase',
  price: 1350,
  purchaseStartAt: '2020-01-01T00:00:00Z',
  purchaseEndAt: '2020-12-31T23:59:59Z',
  dateRangeLabel: '1 ENERO AL 31 DICIEMBRE',
  imagePath: '',
  purchasable: true,
  isCurrentPhase: false,
};

const futurePhase: TicketTypePhase = {
  ...pastPhase,
  name: 'Tijuana',
  purchaseStartAt: '2999-01-01T00:00:00Z',
  purchaseEndAt: '2999-12-31T23:59:59Z',
};

describe('TicketPhase', () => {
  let component: TicketPhase;
  let fixture: ComponentFixture<TicketPhase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketPhase],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketPhase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the purchase window when date validation is enabled', () => {
    fixture.componentRef.setInput('ticketType', pastPhase);
    expect(component.isPastPhase()).toBe(true);
    expect(component.isFuturePhase()).toBe(false);
    expect(component.isCurrentPhase()).toBe(false);

    fixture.componentRef.setInput('ticketType', futurePhase);
    expect(component.isPastPhase()).toBe(false);
    expect(component.isFuturePhase()).toBe(true);
    expect(component.isCurrentPhase()).toBe(false);
  });

  it('ignores every date when date validation is disabled', () => {
    fixture.componentRef.setInput('useDateRangeValidation', false);

    fixture.componentRef.setInput('ticketType', pastPhase);
    expect(component.isPastPhase()).toBe(false);
    expect(component.isFuturePhase()).toBe(false);
    expect(component.isCurrentPhase()).toBe(false);

    fixture.componentRef.setInput('ticketType', futurePhase);
    expect(component.isPastPhase()).toBe(false);
    expect(component.isFuturePhase()).toBe(false);
    expect(component.isCurrentPhase()).toBe(false);
  });

  it('falls back to the ticket type current phase flag when date validation is disabled', () => {
    fixture.componentRef.setInput('useDateRangeValidation', false);
    fixture.componentRef.setInput('ticketType', { ...pastPhase, isCurrentPhase: true });

    expect(component.isCurrentPhase()).toBe(true);
  });

  it('is selectable only when the phase is current and purchasable', () => {
    fixture.componentRef.setInput('useDateRangeValidation', false);
    fixture.componentRef.setInput('ticketType', { ...pastPhase, isCurrentPhase: true });
    expect(component.isSelectable()).toBe(true);

    fixture.componentRef.setInput('ticketType', {
      ...pastPhase,
      isCurrentPhase: true,
      purchasable: false,
    });
    expect(component.isSelectable()).toBe(false);
  });

  it('shows the sold-out message when the ticket type is not purchasable', () => {
    fixture.componentRef.setInput('ticketType', {
      ...pastPhase,
      purchaseStartAt: '2020-01-01T00:00:00Z',
      purchaseEndAt: '2999-12-31T23:59:59Z',
      purchasable: false,
    });
    fixture.detectChanges();

    expect(component.isSoldOut()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('AGOTADO');
  });

  it('shows phase details when alwaysShowDetails is enabled', () => {
    fixture.componentRef.setInput('ticketType', futurePhase);
    fixture.componentRef.setInput('alwaysShowDetails', true);
    fixture.detectChanges();

    expect(component.showDetails()).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('???');
    expect(fixture.nativeElement.textContent).toContain('TIJUANA');
  });

  it('hides the date range by default and enlarges the name and image', () => {
    fixture.componentRef.setInput('ticketType', futurePhase);
    fixture.componentRef.setInput('alwaysShowDetails', true);
    fixture.componentRef.setInput('dateRangeLabel', '1 ENERO AL 31 DICIEMBRE');
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.ticket-phase > span');
    const image = fixture.nativeElement.querySelector('.ticket-phase__image');

    expect(component.shouldShowDateRangeLabel()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('1 ENERO AL 31 DICIEMBRE');
    expect(name.classList).toContain('text-3xl');
    expect(image.style.height).toBe('8.5rem');

    fixture.componentRef.setInput('showDateRangeLabel', true);
    fixture.detectChanges();

    expect(component.shouldShowDateRangeLabel()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('1 ENERO AL 31 DICIEMBRE');
    expect(name.classList).toContain('text-xl');
    expect(image.style.height).toBe('8rem');
  });
});
