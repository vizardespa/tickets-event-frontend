import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Event } from '../../../shared/models/event.model';
import { EventService } from '../../../shared/services/event.service';
import { TicketService } from '../../../shared/services/ticket.service';
import { BuyTicketDialogComponent, BuyTicketResult } from './buy-ticket-dialog.component';

/**
 * Full details for a single event with a "Buy Ticket" action.
 */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
  ],
  template: `
    <section class="mx-auto max-w-3xl px-4 py-8">
      <a mat-button routerLink="/events" class="mb-4">
        <mat-icon>arrow_back</mat-icon>
        Back to events
      </a>

      @if (loading()) {
        <div class="flex justify-center py-20">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="flex flex-col items-center gap-3 py-20 text-center">
          <mat-icon class="!h-12 !w-12 text-5xl text-red-400">error_outline</mat-icon>
          <p class="text-gray-600">{{ error() }}</p>
        </div>
      } @else if (event(); as ev) {
        <mat-card class="p-2">
          <mat-card-header>
            <mat-card-title class="text-2xl font-bold">{{ ev.name }}</mat-card-title>
            <mat-card-subtitle class="flex items-center gap-1">
              <mat-icon class="!h-4 !w-4 text-base">place</mat-icon>
              {{ ev.venue }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="flex flex-col gap-4 pt-2">
            <p class="text-gray-700">{{ ev.description || 'No description provided.' }}</p>

            <mat-divider></mat-divider>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex items-center gap-2">
                <mat-icon class="text-primary">calendar_today</mat-icon>
                <div>
                  <div class="text-xs uppercase text-gray-400">Date</div>
                  <div class="font-medium">{{ ev.date | date: 'medium' }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <mat-icon class="text-primary">payments</mat-icon>
                <div>
                  <div class="text-xs uppercase text-gray-400">Price</div>
                  <div class="font-medium">{{ ev.price | currency }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <mat-icon class="text-primary">event_seat</mat-icon>
                <div>
                  <div class="text-xs uppercase text-gray-400">Availability</div>
                  <div class="font-medium">{{ ev.availableSeats }} / {{ ev.totalSeats }} seats</div>
                </div>
              </div>
            </div>

            <div>
              <mat-chip-set>
                <mat-chip
                  [highlighted]="ev.availableSeats > 0"
                  [disabled]="ev.availableSeats === 0"
                >
                  {{ ev.availableSeats > 0 ? 'Available' : 'Sold out' }}
                </mat-chip>
              </mat-chip-set>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <button
              mat-flat-button
              color="primary"
              [disabled]="ev.availableSeats === 0 || purchasing()"
              (click)="buyTicket(ev)"
            >
              <mat-icon>shopping_cart</mat-icon>
              {{ purchasing() ? 'Processing...' : 'Buy Ticket' }}
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </section>
  `,
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly ticketService = inject(TicketService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly event = signal<Event | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly purchasing = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No event id provided.');
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.eventService.getById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Event not found or backend unavailable.');
        this.loading.set(false);
      },
    });
  }

  buyTicket(ev: Event): void {
    const ref = this.dialog.open(BuyTicketDialogComponent, {
      width: '420px',
      data: { eventName: ev.name },
    });

    ref.afterClosed().subscribe((result: BuyTicketResult | null | undefined) => {
      if (!result) {
        return;
      }
      this.purchasing.set(true);
      this.ticketService
        .purchase({
          eventId: ev.id,
          ownerName: result.ownerName,
          ownerEmail: result.ownerEmail,
        })
        .subscribe({
          next: (ticket) => {
            this.purchasing.set(false);
            this.snackBar.open(`Ticket purchased! Seat #${ticket.seatNumber}`, 'View', {
              duration: 5000,
            });
            this.load(ev.id);
          },
          error: () => {
            this.purchasing.set(false);
            this.snackBar.open('Purchase failed. Please try again.', 'Dismiss', {
              duration: 5000,
            });
          },
        });
    });
  }
}
