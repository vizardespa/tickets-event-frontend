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
    fixture.componentRef.setInput('isDateRangeValidationEnable', false);

    fixture.componentRef.setInput('ticketType', pastPhase);
    expect(component.isPastPhase()).toBe(false);
    expect(component.isFuturePhase()).toBe(false);
    expect(component.isCurrentPhase()).toBe(true);

    fixture.componentRef.setInput('ticketType', futurePhase);
    expect(component.isPastPhase()).toBe(false);
    expect(component.isFuturePhase()).toBe(false);
    expect(component.isCurrentPhase()).toBe(true);
  });
});
