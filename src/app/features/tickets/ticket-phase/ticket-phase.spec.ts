import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketPhase } from './ticket-phase';

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
});
