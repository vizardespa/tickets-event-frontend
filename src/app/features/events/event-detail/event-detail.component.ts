import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, map } from 'rxjs';
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
  templateUrl: './event-detail.component.html',
})
export class EventDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly ticketTypeService = inject(TicketTypeService);

  /** Route id as a signal, so both resources refetch whenever it changes. */
  private readonly eventId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))));

  private readonly eventResource = rxResource({
    params: () => this.eventId(),
    stream: ({ params: eventId }) => (eventId ? this.eventService.getById(eventId) : EMPTY),
  });

  private readonly ticketTypesResource = rxResource({
    params: () => this.eventId(),
    stream: ({ params: eventId }) =>
      eventId ? this.ticketTypeService.getAvailableByEvent(eventId) : EMPTY,
  });

  readonly event = this.eventResource.value;
  readonly loading = this.eventResource.isLoading;
  readonly error = computed(() => {
    if (!this.eventId()) {
      return 'No event id provided.';
    }
    return this.eventResource.error() ? 'Event not found or backend unavailable.' : null;
  });
  readonly ticketTypes = computed(() => this.ticketTypesResource.value() ?? []);
  readonly ticketTypesLoading = this.ticketTypesResource.isLoading;

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
