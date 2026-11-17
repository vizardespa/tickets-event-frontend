import { Component, computed, input } from '@angular/core';
import { TicketType } from '../../../shared/models/ticket-type.model';

@Component({
  selector: 'app-ticket-phase',
  imports: [],
  templateUrl: './ticket-phase.html',
  styleUrl: './ticket-phase.scss',
})
export class TicketPhase {
  ticketType = input<TicketType>();
  // TODO: Make this dynamic based on the ticket type's start and end dates, instead of hardcoding it.
  // Needs to research how to do it in a human readable way...
  dateRangeLabel = input<string>();

  isPastPhase = computed(() => {
    if (!this.ticketType()) {
      return false;
    }
    const now = new Date();
    const purchaseEndAt = this.ticketType()?.purchaseEndAt
      ? new Date(this.ticketType()?.purchaseEndAt || '')
      : null;
    return purchaseEndAt ? now > purchaseEndAt : false;
  });

  isFuturePhase = computed(() => {
    if (!this.ticketType()) {
      return false;
    }
    const now = new Date();
    const purchaseStartAt = this.ticketType()?.purchaseStartAt
      ? new Date(this.ticketType()?.purchaseStartAt || '')
      : null;
    return purchaseStartAt ? now < purchaseStartAt : false;
  });
}
