import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Event } from '../../../shared/models/event.model';
import { EventService } from '../../../shared/services/event.service';
import { EventCardComponent } from '../event-card/event-card.component';

/**
 * Landing page: a responsive grid of event cards.
 */
@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [EventCardComponent, MatProgressSpinnerModule, MatButtonModule, MatIconModule],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-8">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Upcoming Events</h1>
          <p class="text-sm text-gray-500">Browse events and grab your tickets.</p>
        </div>
      </header>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center gap-3 py-20 text-center">
          <mat-icon class="!h-12 !w-12 text-5xl text-red-400">error_outline</mat-icon>
          <p class="text-gray-600">{{ error() }}</p>
          <button mat-flat-button color="primary" (click)="load()">Retry</button>
        </div>
      } @else if (events().length === 0) {
        <div class="flex flex-col items-center gap-3 py-20 text-center text-gray-500">
          <mat-icon class="!h-12 !w-12 text-5xl">event_busy</mat-icon>
          <p>No events available right now.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (event of events(); track event.id) {
            <app-event-card [event]="event" />
          }
        </div>
      }
    </section>
  `,
})
export class EventsListComponent implements OnInit {
  private readonly eventService = inject(EventService);

  readonly events = signal<Event[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.eventService.getAll().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load events. Is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
