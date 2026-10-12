import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Event } from '../../../shared/models/event.model';
import { isTicketTypePurchasable, TicketType } from '../../../shared/models/ticket-type.model';
import { EventService } from '../../../shared/services/event.service';
import { TicketTypeService } from '../../../shared/services/ticket-type.service';

/**
 * Full details for a single event, listing its ticket types and letting the user start a
 * purchase (handed off to the Checkout component) for whichever ones are currently on sale.
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

            <mat-divider></mat-divider>

            <div>
              <h3 class="mb-2 text-lg font-semibold text-gray-900">Ticket types</h3>

              @if (ticketTypesLoading()) {
                <div class="flex justify-center py-6">
                  <mat-spinner diameter="32"></mat-spinner>
                </div>
              } @else if (ticketTypes().length === 0) {
                <p class="text-sm text-gray-500">
                  No ticket types have been configured for this event yet.
                </p>
              } @else {
                <div class="flex flex-col gap-3">
                  @for (tt of ticketTypes(); track tt.id) {
                    <div
                      class="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                    >
                      <div>
                        <div class="font-medium">{{ tt.name }}</div>
                        @if (tt.description) {
                          <div class="text-sm text-gray-500">{{ tt.description }}</div>
                        }
                        <div class="text-primary font-semibold">{{ tt.price | currency }}</div>
                        @if (!isPurchasable(tt)) {
                          <div class="text-xs text-red-500">
                            {{ purchaseWindowMessage(tt) }}
                          </div>
                        }
                      </div>
                      <button
                        mat-flat-button
                        color="primary"
                        [disabled]="ev.availableSeats === 0 || !isPurchasable(tt)"
                        (click)="buyTicket(ev, tt)"
                      >
                        <mat-icon>shopping_cart</mat-icon>
                        Buy
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly ticketTypeService = inject(TicketTypeService);

  readonly event = signal<Event | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly ticketTypes = signal<TicketType[]>([]);
  readonly ticketTypesLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No event id provided.');
      return;
    }
    this.load(id);
    this.loadTicketTypes(id);
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

  loadTicketTypes(eventId: string): void {
    this.ticketTypesLoading.set(true);
    this.ticketTypeService.getByEvent(eventId).subscribe({
      next: (ticketTypes) => {
        this.ticketTypes.set(ticketTypes);
        this.ticketTypesLoading.set(false);
      },
      error: () => {
        this.ticketTypesLoading.set(false);
      },
    });
  }

  isPurchasable(ticketType: TicketType): boolean {
    return isTicketTypePurchasable(ticketType);
  }

  purchaseWindowMessage(ticketType: TicketType): string {
    const now = new Date();
    if (ticketType.purchaseStartAt && now < new Date(ticketType.purchaseStartAt)) {
      return `Sales open ${new Date(ticketType.purchaseStartAt).toLocaleString()}`;
    }
    if (ticketType.purchaseEndAt && now > new Date(ticketType.purchaseEndAt)) {
      return `Sales ended ${new Date(ticketType.purchaseEndAt).toLocaleString()}`;
    }
    return '';
  }

  buyTicket(ev: Event, ticketType: TicketType): void {
    this.router.navigate(['/checkout'], {
      queryParams: { eventId: ev.id, ticketTypeId: ticketType.id },
    });
  }
}
