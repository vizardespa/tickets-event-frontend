import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineUp } from './line-up';

describe('LineUp', () => {
  let component: LineUp;
  let fixture: ComponentFixture<LineUp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineUp],
    }).compileComponents();

    fixture = TestBed.createComponent(LineUp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
