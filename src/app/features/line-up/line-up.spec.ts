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

  it('should render every default line with its own band count', () => {
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.flex-col.gap-2 > div');
    expect(lines.length).toBe(component.lines().length);
    component.lines().forEach((line, index) => {
      expect(lines[index].querySelectorAll('span').length).toBe(line.length * 2 - 1);
    });
  });

  it('should only render the requested number of lines', () => {
    fixture.componentRef.setInput('linesToRender', 3);
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.flex-col.gap-2 > div');
    expect(lines.length).toBe(3);
  });

  it('should render custom lines with different band counts per line', () => {
    fixture.componentRef.setInput('lines', [
      [
        { name: 'ONE', color: 'white' },
        { name: 'TWO', color: 'yellow' },
      ],
      [{ name: 'THREE', color: 'white' }],
    ]);
    fixture.detectChanges();
    const lines = fixture.nativeElement.querySelectorAll('.flex-col.gap-2 > div');
    expect(lines.length).toBe(2);
    expect(lines[0].querySelectorAll('span').length).toBe(3);
    expect(lines[1].querySelectorAll('span').length).toBe(1);
  });

  it('should apply the yellow class only to yellow bands', () => {
    fixture.detectChanges();
    const spans: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.flex-col.gap-2 > div > span')
    );
    const yellow = spans.filter((span) => span.className.includes('text-[#F9DF15]'));
    const expected = component
      .lines()
      .flat()
      .filter((band) => band.color === 'yellow').length;
    expect(yellow.length).toBe(expected);
  });
});
