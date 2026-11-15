import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Top navigation bar. When the links do not fit, they collapse into a menu button.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements AfterViewInit {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');
  private readonly logo = viewChild.required<ElementRef<HTMLElement>>('logo');
  private readonly measurer = viewChild.required<ElementRef<HTMLElement>>('measurer');

  readonly collapsed = signal(false);

  readonly links: { label: string; route?: string }[] = [
    { label: 'INICIO', route: '/dashboard' },
    { label: 'LINE UP', route: '/line-up' },
    { label: 'BOLETOS', route: '/events' },
    { label: 'HISTORIA' },
    { label: 'MERCH' },
    { label: 'CONTACTO' },
  ];

  ngAfterViewInit(): void {
    const header = this.header().nativeElement;
    const observer = new ResizeObserver(() => this.zone.run(() => this.update()));
    observer.observe(header);
    this.destroyRef.onDestroy(() => observer.disconnect());
    this.update();
  }

  private update(): void {
    const header = this.header().nativeElement;
    const style = getComputedStyle(header);
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const available = header.clientWidth - padding - this.logo().nativeElement.offsetWidth - 16;
    this.collapsed.set(this.measurer().nativeElement.offsetWidth > available);
  }
}
