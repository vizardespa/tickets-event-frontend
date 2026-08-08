import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Event } from '../../../shared/models/event.model';

/**
 * Reusable card that summarizes a single event.
 */
@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
  ],
  template: `
    <mat-card class="flex h-full flex-col transition-shadow hover:shadow-lg">
      <mat-card-header>
        <mat-card-title class="text-lg font-semibold">{{ event.name }}</mat-card-title>
        <mat-card-subtitle class="flex items-center gap-1">
          <mat-icon class="!h-4 !w-4 text-base">place</mat-icon>
          {{ event.venue }}
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="flex flex-1 flex-col gap-3">
        <p class="line-clamp-2 text-sm text-gray-600">
          {{ event.description || 'No description provided.' }}
        </p>

        <div class="flex items-center gap-2 text-sm text-gray-700">
          <mat-icon class="!h-4 !w-4 text-base">calendar_today</mat-icon>
          <span>{{ event.date | date: 'medium' }}</span>
        </div>

        <div class="mt-auto flex items-center justify-between pt-2">
          <span class="text-primary text-xl font-bold">{{ event.price | currency }}</span>
          <mat-chip-set>
            <mat-chip
              [highlighted]="event.availableSeats > 0"
              [disabled]="event.availableSeats === 0"
            >
              {{ event.availableSeats > 0 ? event.availableSeats + ' seats left' : 'Sold out' }}
            </mat-chip>
          </mat-chip-set>
        </div>
      </mat-card-content>

      <mat-card-actions align="end">
        <a mat-button color="primary" [routerLink]="['/events', event.id]">
          <mat-icon>visibility</mat-icon>
          Details
        </a>
      </mat-card-actions>
    </mat-card>
  `,
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
}
