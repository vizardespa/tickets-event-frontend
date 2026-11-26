import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { TicketType, TicketTypePhase } from '../../../shared/models/ticket-type.model';

@Component({
  selector: 'app-ticket-phase',
  imports: [DecimalPipe],
  templateUrl: './ticket-phase.html',
  styleUrl: './ticket-phase.scss',
})
export class TicketPhase {
  ticketType = input<TicketType | TicketTypePhase>();
  // TODO: Make this dynamic based on the ticket type's start and end dates, instead of hardcoding it.
  // Needs to research how to do it in a human readable way...
  dateRangeLabel = input<string>();
  hideDateRangeLabel = input<boolean>(true);
  forceDisplay = input<boolean>(false);
  // When false, every phase is treated as current: no past/future checks, no "AGOTADO" badge.
  isDateRangeValidationEnable = input<boolean>(true);

  imagePath = input<string>('assets/img/TJ_MANO.png');

  onClick = output<TicketType | TicketTypePhase | undefined>();

  name = computed(() => {
    const ticketType = this.ticketType();
    return ticketType?.name.includes('_')
      ? ticketType?.name.split('_')?.[1]?.toUpperCase() || ''
      : ticketType?.name.toUpperCase() || '';
  });

  showDateRangeLabel = computed(
    () => !this.hideDateRangeLabel() && !!this.dateRangeLabel()?.trim()
  );

  isPastPhase = computed(() => {
    if (!this.isDateRangeValidationEnable() || !this.ticketType()) {
      return false;
    }
    const now = new Date();
    const purchaseEndAt = this.ticketType()?.purchaseEndAt
      ? new Date(this.ticketType()?.purchaseEndAt || '')
      : null;
    return purchaseEndAt ? now > purchaseEndAt : false;
  });

  isFuturePhase = computed(() => {
    if (!this.isDateRangeValidationEnable() || !this.ticketType()) {
      return false;
    }
    const now = new Date();
    const purchaseStartAt = this.ticketType()?.purchaseStartAt
      ? new Date(this.ticketType()?.purchaseStartAt || '')
      : null;
    return purchaseStartAt ? now < purchaseStartAt : false;
  });

  isCurrentPhase = computed(() => {
    const isDateRangeValidationEnable = this.isDateRangeValidationEnable();

    if (isDateRangeValidationEnable) {
      return !this.isPastPhase() && !this.isFuturePhase();
    }
    return this.ticketType()?.isCurrentPhase;
  });
}
