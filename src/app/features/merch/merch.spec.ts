import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Merch } from './merch';

describe('Merch', () => {
  let component: Merch;
  let fixture: ComponentFixture<Merch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Merch],
    }).compileComponents();

    fixture = TestBed.createComponent(Merch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
