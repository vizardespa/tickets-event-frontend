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
  // The app's source locale is `es`, which groups thousands with a dot ("1.350").
  // Prices are shown with a comma ("1,350"), so the number pipe is pinned to a comma-grouping locale.
  readonly priceLocale = 'en-US';

  ticketType = input<TicketType | TicketTypePhase>();
  // TODO: Make this dynamic based on the ticket type's start and end dates, instead of hardcoding it.
  // Needs to research how to do it in a human readable way...
  dateRangeLabel = input<string>();
  showDateRangeLabel = input<boolean>(false);
  // When true, the phase details are shown even if the phase is not the current one.
  alwaysShowDetails = input<boolean>(false);
  // When false, every phase is treated as current: no past/future checks, no "AGOTADO" badge.
  useDateRangeValidation = input<boolean>(true);

  imagePath = input<string>('assets/img/TJ_MANO.png');

  onClick = output<TicketType | TicketTypePhase | undefined>();

  name = computed(() => {
    const ticketType = this.ticketType();
    return ticketType?.name.includes('_')
      ? ticketType?.name.split('_')?.[1]?.toUpperCase() || ''
      : ticketType?.name.toUpperCase() || '';
  });

  shouldShowDateRangeLabel = computed(
    () => this.showDateRangeLabel() && !!this.dateRangeLabel()?.trim()
  );

  isPastPhase = computed(() => {
    if (!this.useDateRangeValidation() || !this.ticketType()) {
      return false;
    }
    const now = new Date();
    const purchaseEndAt = this.ticketType()?.purchaseEndAt
      ? new Date(this.ticketType()?.purchaseEndAt || '')
      : null;
    return purchaseEndAt ? now > purchaseEndAt : false;
  });

  isFuturePhase = computed(() => {
    if (!this.useDateRangeValidation() || !this.ticketType()) {
      return false;
    }
    const now = new Date();
    const purchaseStartAt = this.ticketType()?.purchaseStartAt
      ? new Date(this.ticketType()?.purchaseStartAt || '')
      : null;
    return purchaseStartAt ? now < purchaseStartAt : false;
  });

  isCurrentPhase = computed(() => {
    if (!this.useDateRangeValidation()) {
      return this.ticketType()?.isCurrentPhase ?? false;
    }
    return !this.isPastPhase() && !this.isFuturePhase();
  });

  // The phase can be picked: it is the current one and still has tickets left.
  isSelectable = computed(() => this.isCurrentPhase() && !!this.ticketType()?.purchasable);

  isSoldOut = computed(() => {
    const ticketType = this.ticketType();
    return !!ticketType && (this.isPastPhase() || !ticketType.purchasable);
  });

  showDetails = computed(
    () => !!this.ticketType() && (this.isCurrentPhase() || this.alwaysShowDetails())
  );
}
